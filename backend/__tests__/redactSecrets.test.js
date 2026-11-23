import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mysql from 'mysql2/promise';
import { redactSecrets, safeErrorMessage } from '../utils/redactSecrets.js';
import { errorHandler } from '../middleware/errorMiddleware.js';
import { getDbConfig } from '../config/db.js';

const PASSWORD = 'S3cr3t%40Pass';      // as written in a URI (URL-encoded "@")
const DECODED = 'S3cr3t@Pass';
const MYSQL_PASSWORD = 'My5ql-Pa55word!';

describe('redactSecrets', () => {
  const saved = {};
  const keys = ['MYSQL_URL', 'MYSQL_PASSWORD'];
  before(() => {
    for (const k of keys) saved[k] = process.env[k];
    process.env.MYSQL_URL = `mysql://shopuser:${PASSWORD}@db.example.com:3306/shop`;
    process.env.MYSQL_PASSWORD = MYSQL_PASSWORD;
  });
  after(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('masks user:password in mysql:// and mysql2:// addresses', () => {
    const out = redactSecrets('failed for mysql://u:p@db:3306/x and mysql2://c:d@localhost:3306/y');
    assert.strictEqual(out, 'failed for mysql://***:***@db:3306/x and mysql2://***:***@localhost:3306/y');
  });

  it('masks configured passwords even when they appear on their own, raw or decoded', () => {
    const out = redactSecrets(`bad password "${PASSWORD}" / "${DECODED}" / "${MYSQL_PASSWORD}"`);
    assert.ok(!out.includes(PASSWORD) && !out.includes(DECODED) && !out.includes(MYSQL_PASSWORD), out);
  });

  it('leaves ordinary messages unchanged', () => {
    assert.strictEqual(redactSecrets('Product not found'), 'Product not found');
    assert.strictEqual(safeErrorMessage(new Error('Invalid email')), 'Invalid email');
    assert.strictEqual(redactSecrets(undefined), '');
  });

  it('hides credentials in real MySQL driver errors', async () => {
    const attempts = [
      // nothing listens on port 1, so the driver fails to connect
      () => mysql.createConnection({ host: '127.0.0.1', port: 1, user: 'shopuser', password: MYSQL_PASSWORD, database: 'shop', connectTimeout: 2000 }),
      () => mysql.createConnection({ uri: `mysql://shopuser:${PASSWORD}@127.0.0.1:1/shop`, connectTimeout: 2000 }),
      // a malformed connection URL
      () => { process.env.MYSQL_URL = `mysql://shopuser:${PASSWORD}@db.example.com:notaport/shop`; return getDbConfig(); }
    ];
    try {
      for (const attempt of attempts) {
        let error;
        try {
          const conn = await attempt();
          await conn?.end?.();
        } catch (e) {
          error = e;
        }
        assert.ok(error, 'expected the connection attempt to fail');
        const safe = safeErrorMessage(error) + redactSecrets(error.stack);
        assert.ok(!safe.includes(PASSWORD) && !safe.includes(DECODED) && !safe.includes(MYSQL_PASSWORD), `password leaked: ${safe}`);
      }
    } finally {
      process.env.MYSQL_URL = `mysql://shopuser:${PASSWORD}@db.example.com:3306/shop`;
    }
  });

  it('global error handler masks credentials in the log and the response', () => {
    const logged = [];
    const origError = console.error;
    console.error = (...a) => logged.push(a.join(' '));
    let body;
    const res = { statusCode: 500, status() { return this; }, json(b) { body = b; } };
    try {
      errorHandler(new Error(`connect failed: mysql://shopuser:${PASSWORD}@x.net (password ${MYSQL_PASSWORD})`), {}, res, () => {});
    } finally {
      console.error = origError;
    }
    const everything = logged.join('\n') + JSON.stringify(body);
    assert.ok(!everything.includes(PASSWORD) && !everything.includes(DECODED) && !everything.includes(MYSQL_PASSWORD), everything);
    assert.ok(body.message.includes('mysql://***:***@x.net'));
  });
});
