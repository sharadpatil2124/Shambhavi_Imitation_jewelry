// Database migrations: numbered .sql files in db/migrations, applied in order, each exactly once.
//
//   db/migrations/001_create_users.sql
//   db/migrations/002_create_catalog.sql
//   ...
//
// Applied files are recorded in the table schema_migrations (version, name, checksum, applied_at).
// The server applies any new files when it starts; `npm run db:migrate` does the same by hand and
// `npm run db:migrate:status` lists what has been applied.
//
// To change the database later, add a new file with the next number (e.g. 007_add_gift_wrap.sql).
// Never edit a file that has already been applied: the runner warns when one has changed.
// MySQL cannot undo table changes if a file fails halfway, so write each file so that it is safe to
// run again (CREATE TABLE IF NOT EXISTS, and so on).
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { getDbConfig, connectionOptions, createDatabaseIfMissing, query, closeDB } from '../config/db.js';

export const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
const FILE_NAME = /^(\d+)_([A-Za-z0-9_-]+)\.sql$/;

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    checksum CHAR(64) NOT NULL,
    applied_at DATETIME(3) NOT NULL,
    PRIMARY KEY (version)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

// Line endings are normalised first, so a checkout on Windows (CRLF) has the same checksum as on Linux.
const checksumOf = (sql) => crypto.createHash('sha256').update(sql.replace(/\r\n/g, '\n').trim()).digest('hex');

// The migration files, sorted by number.
export const loadMigrations = async (dir = MIGRATIONS_DIR) => {
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql'));
  const migrations = [];
  for (const file of files) {
    const match = FILE_NAME.exec(file);
    if (!match) throw new Error(`Migration file "${file}" must be named like 007_short_description.sql`);
    const sql = await fs.readFile(path.join(dir, file), 'utf8');
    migrations.push({ version: match[1], name: match[2], file, sql, checksum: checksumOf(sql) });
  }
  migrations.sort((a, b) => Number(a.version) - Number(b.version));
  for (let i = 1; i < migrations.length; i += 1) {
    if (Number(migrations[i].version) === Number(migrations[i - 1].version)) {
      throw new Error(`Two migration files have the number ${migrations[i].version}: ${migrations[i - 1].file} and ${migrations[i].file}`);
    }
  }
  return migrations;
};

// A separate connection that may run a whole .sql file (several statements) at once.
const migrationConnection = async () => {
  const cfg = getDbConfig();
  return mysql.createConnection({ ...(await connectionOptions(cfg)), multipleStatements: true });
};

const lockName = () => `migrations:${getDbConfig().database}`.slice(0, 64);

const appliedMigrations = async (conn) => {
  const [rows] = await conn.query('SELECT version, name, checksum, applied_at FROM schema_migrations');
  return new Map(rows.map((r) => [String(Number(r.version)), r]));
};

// Applies every migration that has not been applied yet. Returns the files applied by this run.
export const runMigrations = async ({ log = console.log, dir = MIGRATIONS_DIR } = {}) => {
  const migrations = await loadMigrations(dir);
  const conn = await migrationConnection();
  const appliedNow = [];
  try {
    await conn.query(CREATE_MIGRATIONS_TABLE);

    // Only one server or script migrates at a time (e.g. two instances starting together).
    const [[{ locked }]] = await conn.query('SELECT GET_LOCK(?, 60) AS locked', [lockName()]);
    if (locked !== 1) throw new Error('Another process has been running database migrations for over a minute. Try again shortly.');

    try {
      const applied = await appliedMigrations(conn);
      for (const m of migrations) {
        const done = applied.get(String(Number(m.version)));
        if (done) {
          if (done.checksum !== m.checksum) {
            log(`⚠️ Migration ${m.file} was changed after it was applied on ${done.applied_at.toISOString()}. The change is NOT applied; put it in a new migration file instead.`);
          }
          continue;
        }
        log(`⏳ Applying migration ${m.file}...`);
        try {
          await conn.query(m.sql);
        } catch (err) {
          err.message = `Migration ${m.file} failed: ${err.message}`;
          throw err;
        }
        await conn.query(
          'INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)',
          [m.version, m.name, m.checksum, new Date()]
        );
        appliedNow.push(m.file);
      }
    } finally {
      await conn.query('SELECT RELEASE_LOCK(?)', [lockName()]).catch(() => {});
    }
  } finally {
    await conn.end();
  }
  return appliedNow;
};

// Every migration file with the date it was applied (or null when still pending).
export const migrationStatus = async ({ dir = MIGRATIONS_DIR } = {}) => {
  const migrations = await loadMigrations(dir);
  const conn = await migrationConnection();
  try {
    await conn.query(CREATE_MIGRATIONS_TABLE);
    const applied = await appliedMigrations(conn);
    return migrations.map((m) => {
      const done = applied.get(String(Number(m.version)));
      return { file: m.file, appliedAt: done ? done.applied_at : null, changed: Boolean(done && done.checksum !== m.checksum) };
    });
  } finally {
    await conn.end();
  }
};

// Connects, creates the database if it does not exist yet (when the account is allowed to),
// then applies any new migrations.
export const prepareDatabase = async ({ log = console.log } = {}) => {
  const cfg = getDbConfig();
  try {
    await query('SELECT 1');
  } catch (err) {
    if (err?.code !== 'ER_BAD_DB_ERROR') throw err;
    await closeDB();
    await createDatabaseIfMissing();
    log(`ℹ️ Created MySQL database "${cfg.database}".`);
    await query('SELECT 1');
  }
  const applied = await runMigrations({ log });
  if (applied.length) log(`✅ Applied ${applied.length} migration(s).`);
  return cfg;
};
