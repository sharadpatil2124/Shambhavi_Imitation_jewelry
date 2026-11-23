import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { loadMigrations, MIGRATIONS_DIR } from '../db/migrate.js';

const EXPECTED_TABLES = ['users', 'user_addresses', 'categories', 'products', 'carts', 'cart_items', 'wishlists',
  'wishlist_items', 'orders', 'order_items', 'reviews', 'settings', 'enquiries', 'coupons', 'banners'];

const tempDir = async (files) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'migrations-'));
  for (const [name, sql] of Object.entries(files)) await fs.writeFile(path.join(dir, name), sql);
  return dir;
};

describe('Migration files (no database needed)', () => {
  it('are numbered, in order, and create every table the app uses', async () => {
    const migrations = await loadMigrations();
    assert.deepStrictEqual(migrations.map((m) => m.version), ['001', '002', '003', '004', '005', '006']);
    const created = migrations.flatMap((m) => [...m.sql.matchAll(/^CREATE TABLE IF NOT EXISTS (\w+)/gm)].map((x) => x[1]));
    assert.deepStrictEqual([...created].sort(), [...EXPECTED_TABLES].sort());
  });

  it('only reference tables created by the same or an earlier migration', async () => {
    const seen = new Set();
    for (const m of await loadMigrations()) {
      for (const [, t] of m.sql.matchAll(/^CREATE TABLE IF NOT EXISTS (\w+)/gm)) seen.add(t);
      for (const [, ref] of m.sql.matchAll(/REFERENCES (\w+)/g)) assert.ok(seen.has(ref), `${m.file} references ${ref} before it exists`);
    }
  });

  it('give the same checksum for Windows (CRLF) and Linux (LF) line endings', async () => {
    const sql = 'CREATE TABLE IF NOT EXISTS t (id INT);\n';
    const a = await loadMigrations(await tempDir({ '001_a.sql': sql }));
    const b = await loadMigrations(await tempDir({ '001_a.sql': sql.replace(/\n/g, '\r\n') }));
    assert.strictEqual(a[0].checksum, b[0].checksum);
  });

  it('reject badly named or duplicate-numbered files', async () => {
    await assert.rejects(loadMigrations(await tempDir({ 'create_users.sql': '' })), /must be named like/);
    await assert.rejects(loadMigrations(await tempDir({ '001_a.sql': '', '01_b.sql': '' })), /Two migration files have the number/);
  });
});

// Runs only when a test database is given, e.g.
//   MYSQL_TEST_URL=mysql://root:password@localhost:3306/shambhavi_test npm test
// Uses (and wipes) a database named "<that name>_migrations".
const TEST_URL = process.env.MYSQL_TEST_URL;

describe('Running migrations against a real database', { skip: !TEST_URL && 'set MYSQL_TEST_URL to run' }, () => {
  let db; let migrate;
  const quiet = { log: () => {} };
  const tables = async () => (await db.query(
    'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()'
  )).map((r) => r.name).sort();

  before(async () => {
    const url = new URL(TEST_URL);
    url.pathname = `/${url.pathname.slice(1)}_migrations`;
    process.env.MYSQL_URL = url.toString();
    delete process.env.MYSQL_HOST;
    db = await import('../config/db.js');
    migrate = await import('../db/migrate.js');
    await migrate.prepareDatabase(quiet);
    await db.query('DROP DATABASE ??', [db.getDbConfig().database]);
    await db.closeDB();
  });
  after(async () => { await db?.closeDB(); });

  it('creates the database and all tables on a fresh install', async () => {
    await migrate.prepareDatabase(quiet);
    assert.deepStrictEqual(await tables(), [...EXPECTED_TABLES, 'schema_migrations'].sort());
    const status = await migrate.migrationStatus();
    assert.strictEqual(status.length, 6);
    assert.ok(status.every((s) => s.appliedAt instanceof Date && !s.changed));
  });

  it('does nothing when run again, and keeps the data', async () => {
    await db.query("INSERT INTO categories (id, name, created_at, updated_at) VALUES ('0123456789abcdef01234567', 'Rings', NOW(3), NOW(3))");
    assert.deepStrictEqual(await migrate.runMigrations(quiet), []);
    const [{ n }] = await db.query('SELECT COUNT(*) AS n FROM categories');
    assert.strictEqual(Number(n), 1);
  });

  it('adopts a database whose tables were created by hand (e.g. in phpMyAdmin)', async () => {
    await db.query('DROP TABLE schema_migrations');
    const applied = await migrate.runMigrations(quiet);
    assert.strictEqual(applied.length, 6);
    const [{ n }] = await db.query('SELECT COUNT(*) AS n FROM categories');
    assert.strictEqual(Number(n), 1);
  });

  it('applies only a newly added migration file', async () => {
    const files = {};
    for (const m of await loadMigrations()) files[m.file] = m.sql;
    files['007_add_gift_note.sql'] = 'ALTER TABLE orders ADD COLUMN gift_note TEXT NULL;';
    const dir = await tempDir(files);
    assert.deepStrictEqual(await migrate.runMigrations({ ...quiet, dir }), ['007_add_gift_note.sql']);
    const cols = (await db.query("SHOW COLUMNS FROM orders LIKE 'gift_note'")).length;
    assert.strictEqual(cols, 1);
    assert.deepStrictEqual(await migrate.runMigrations({ ...quiet, dir }), []);
  });

  it('warns about (and does not re-run) an applied file that was edited', async () => {
    const files = {};
    for (const m of await loadMigrations()) files[m.file] = m.sql;
    files['001_create_users.sql'] += '\n-- edited later\n';
    const warnings = [];
    const applied = await migrate.runMigrations({ log: (msg) => warnings.push(msg), dir: await tempDir(files) });
    assert.deepStrictEqual(applied, []);
    assert.ok(warnings.some((w) => w.includes('001_create_users.sql was changed')), warnings.join('\n'));
  });

  it('is safe when several servers start at the same moment', async () => {
    await db.query('DROP TABLE schema_migrations');
    const results = await Promise.all([1, 2, 3].map(() => migrate.runMigrations(quiet)));
    assert.strictEqual(results.flat().length, 6);
  });

  it('reports a failing migration by file name', async () => {
    const dir = await tempDir({ '001_broken.sql': 'CREATE TABLE IF NOT EXISTS broken (' });
    await db.query("DELETE FROM schema_migrations WHERE version = '001'");
    await assert.rejects(migrate.runMigrations({ ...quiet, dir }), /Migration 001_broken\.sql failed/);
  });
});
