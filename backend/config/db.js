import fs from 'fs/promises';
import { AsyncLocalStorage } from 'async_hooks';
import mysql from 'mysql2/promise';
import { safeErrorMessage } from '../utils/redactSecrets.js';

// MySQL connection settings come only from the environment and are never printed.
// Either one connection URL:
//   MYSQL_URL=mysql://user:password@host:3306/database
// or separate values:
//   MYSQL_HOST, MYSQL_PORT (default 3306), MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
// Optional: MYSQL_SSL=true (cloud databases that require TLS), MYSQL_SSL_CA=/path/to/ca.pem,
//           MYSQL_POOL_SIZE (default 10 simultaneous connections).
export const getDbConfig = () => {
  const env = process.env;
  let fromUrl = {};
  if (env.MYSQL_URL) {
    const url = new URL(env.MYSQL_URL);
    fromUrl = {
      host: url.hostname,
      port: url.port,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, '')),
      ssl: url.searchParams.get('ssl')
    };
  }

  const sslWanted = String(env.MYSQL_SSL ?? fromUrl.ssl ?? '').toLowerCase() === 'true';
  return {
    host: env.MYSQL_HOST || fromUrl.host,
    port: Number(env.MYSQL_PORT || fromUrl.port || 3306),
    user: env.MYSQL_USER || fromUrl.user,
    password: env.MYSQL_PASSWORD ?? fromUrl.password ?? '',
    database: env.MYSQL_DATABASE || fromUrl.database,
    ssl: sslWanted ? { rejectUnauthorized: true, ...(env.MYSQL_SSL_CA ? { caPath: env.MYSQL_SSL_CA } : {}) } : undefined,
    poolSize: Number(env.MYSQL_POOL_SIZE || 10)
  };
};

export const missingConfig = (cfg) => ['host', 'user', 'database'].filter((key) => !cfg[key]);

export const connectionOptions = async (cfg, { withDatabase = true } = {}) => {
  let ssl = cfg.ssl;
  if (ssl?.caPath) {
    const { caPath, ...rest } = ssl;
    ssl = { ...rest, ca: await fs.readFile(caPath, 'utf8') };
  }
  return {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    ...(withDatabase ? { database: cfg.database } : {}),
    ssl,
    charset: 'UTF8MB4_UNICODE_CI',
    timezone: 'Z',          // all dates are stored and read as UTC
    decimalNumbers: true,   // DECIMAL money columns come back as numbers, not strings
    dateStrings: false,
    connectTimeout: 10000
  };
};

let pool = null;
let poolPromise = null;

const createPool = async () => {
  const cfg = getDbConfig();
  const missing = missingConfig(cfg);
  if (missing.length) {
    throw new Error(`MySQL is not configured: set MYSQL_URL, or MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE (missing: ${missing.join(', ')})`);
  }
  pool = mysql.createPool({
    ...(await connectionOptions(cfg)),
    waitForConnections: true,
    connectionLimit: cfg.poolSize,
    maxIdle: cfg.poolSize,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });
  return pool;
};

// The pool is created on first use, so importing a model never opens a connection by itself.
export const getPool = async () => {
  if (pool) return pool;
  if (!poolPromise) poolPromise = createPool().catch((err) => { poolPromise = null; throw err; });
  return poolPromise;
};

// ---- Transactions -------------------------------------------------------------------------
// Inside transaction(fn), every query() made by fn (and anything it awaits) runs on the same
// connection, so it commits or rolls back as one unit.
const txStorage = new AsyncLocalStorage();
const releasedConnections = new WeakSet();

const activeTransactionConnection = () => {
  const conn = txStorage.getStore();
  return conn && !releasedConnections.has(conn) ? conn : null;
};

const RETRYABLE = new Set(['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);

export const query = async (sql, params = []) => {
  const txConn = activeTransactionConnection();
  if (txConn) {
    const [result] = await txConn.query(sql, params);
    return result;
  }
  // A single statement outside a transaction is retried if MySQL picked it to resolve a lock conflict.
  for (let attempt = 1; ; attempt += 1) {
    try {
      const [result] = await (await getPool()).query(sql, params);
      return result;
    } catch (err) {
      if (attempt < 3 && RETRYABLE.has(err?.code)) continue;
      throw err;
    }
  }
};

export const transaction = async (fn) => {
  if (activeTransactionConnection()) return fn(); // already inside one: join it

  for (let attempt = 1; ; attempt += 1) {
    const conn = await (await getPool()).getConnection();
    try {
      // READ COMMITTED locks only the rows a statement actually changes or selects FOR UPDATE
      // (no "gap" locks), which avoids needless lock conflicts between simultaneous requests.
      await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await conn.beginTransaction();
      const result = await txStorage.run(conn, fn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback().catch(() => {});
      if (attempt < 3 && RETRYABLE.has(err?.code)) continue;
      throw err;
    } finally {
      releasedConnections.add(conn);
      conn.release();
    }
  }
};

// ---- Database ---------------------------------------------------------------------------------
// Creates the database itself when the MySQL account is allowed to (typical on a local install).
// Hosted MySQL (Hostinger, etc.) usually requires creating the database in the control panel first.
export const createDatabaseIfMissing = async () => {
  const cfg = getDbConfig();
  const conn = await mysql.createConnection(await connectionOptions(cfg, { withDatabase: false }));
  try {
    await conn.query(
      'CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      [cfg.database]
    );
  } finally {
    await conn.end();
  }
};

export const closeDB = async () => {
  if (pool) {
    const p = pool;
    pool = null;
    poolPromise = null;
    await p.end();
  }
};

// A plain-language hint for the usual connection problems (shown after the error itself).
export const connectionHint = (err, cfg = getDbConfig()) => {
  const codes = [err?.code, ...(Array.isArray(err?.errors) ? err.errors.map((e) => e?.code) : [])];
  if (codes.includes('ECONNREFUSED')) {
    return `Nothing is accepting MySQL connections at ${cfg.host}:${cfg.port}. Check that MySQL is running and that MYSQL_HOST / MYSQL_PORT in backend/.env are right (a standard MySQL install uses port 3306).`;
  }
  if (codes.includes('ENOTFOUND') || codes.includes('EAI_AGAIN')) return `The host "${cfg.host}" could not be found. Check MYSQL_HOST in backend/.env.`;
  if (codes.includes('ETIMEDOUT')) return `No answer from ${cfg.host}:${cfg.port}. For a hosted database, check that remote access is allowed for this computer/server.`;
  if (codes.includes('ER_ACCESS_DENIED_ERROR')) return 'MySQL rejected the login. Check MYSQL_USER and MYSQL_PASSWORD in backend/.env.';
  if (codes.includes('ER_BAD_DB_ERROR')) return `The database "${cfg.database}" does not exist yet. Run "npm run db:setup" (or start the server) to create it.`;
  if (codes.includes('ER_DBACCESS_DENIED_ERROR')) return `The user "${cfg.user}" may not use the database "${cfg.database}". Grant it access, or create the database in your hosting panel.`;
  return '';
};

export const describeDbError = (err, cfg) => {
  const hint = connectionHint(err, cfg);
  return `${safeErrorMessage(err)}${hint ? `\n   ↳ ${hint}` : ''}`;
};

const connectDB = async () => {
  const cfg = getDbConfig();
  const missing = missingConfig(cfg);
  if (missing.length) {
    console.error(`❌ MySQL Connection Error: database settings are missing (${missing.join(', ')}). Set MYSQL_URL, or MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE in the environment variables.`);
    process.exit(1);
  }

  try {
    // Creates the database if needed and applies any new migrations from db/migrations.
    const { prepareDatabase } = await import('../db/migrate.js');
    await prepareDatabase();
    console.log(`✅ MySQL Connected: ${cfg.host}:${cfg.port}/${cfg.database}`);
  } catch (error) {
    console.error(`❌ MySQL Connection Error: ${describeDbError(error, cfg)}`);
    process.exit(1);
  }
};

export default connectDB;
