// Applies new database migrations, or lists them.
//   npm run db:migrate          apply every migration in db/migrations that has not been applied yet
//   npm run db:migrate:status   show which migrations are applied and which are pending
import dotenv from 'dotenv';
import { prepareDatabase, migrationStatus } from '../db/migrate.js';
import { closeDB, getDbConfig, missingConfig, describeDbError } from '../config/db.js';

dotenv.config();

const run = async () => {
  const cfg = getDbConfig();
  const missing = missingConfig(cfg);
  if (missing.length) {
    throw new Error(`MySQL settings are missing (${missing.join(', ')}). Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE (or MYSQL_URL) in backend/.env.`);
  }
  if (process.argv.includes('--status')) {
    const rows = await migrationStatus();
    console.log(`Migrations for "${cfg.database}" on ${cfg.host}:${cfg.port}:\n`);
    for (const r of rows) {
      const state = r.appliedAt ? `applied ${r.appliedAt.toISOString()}${r.changed ? '  (file changed since!)' : ''}` : 'PENDING';
      console.log(`  ${r.file.padEnd(40)} ${state}`);
    }
    const pending = rows.filter((r) => !r.appliedAt).length;
    console.log(pending ? `\n${pending} pending. Run: npm run db:migrate` : '\nDatabase is up to date.');
  } else {
    console.log(`Migrating "${cfg.database}" on ${cfg.host}:${cfg.port}...`);
    await prepareDatabase();
    console.log('✅ Database is up to date.');
  }
  await closeDB();
};

run().catch(async (err) => {
  console.error(`❌ ${describeDbError(err)}`);
  await closeDB().catch(() => {});
  process.exit(1);
});
