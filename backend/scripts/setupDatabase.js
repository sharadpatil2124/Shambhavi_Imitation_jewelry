// Creates the MySQL database (when the account is allowed to), applies all migrations, then shows the tables.
// Safe to run any number of times: existing tables and data are never changed.
//   npm run db:setup
import dotenv from 'dotenv';
import { query, closeDB, describeDbError } from '../config/db.js';
import { prepareDatabase } from '../db/migrate.js';

dotenv.config();

const run = async () => {
  const cfg = await prepareDatabase();
  console.log(`✅ MySQL database "${cfg.database}" on ${cfg.host}:${cfg.port} is ready.\n`);

  const tables = await query(
    'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name',
    [cfg.database]
  );
  for (const { name } of tables) {
    const [{ n }] = await query(`SELECT COUNT(*) AS n FROM \`${name}\``);
    console.log(`  ${String(name).padEnd(16)} ${n} row(s)`);
  }
  await closeDB();
};

run().catch(async (err) => {
  console.error(`❌ Database setup failed: ${describeDbError(err)}`);
  await closeDB().catch(() => {});
  process.exit(1);
});
