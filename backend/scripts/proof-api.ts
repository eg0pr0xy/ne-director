import 'dotenv/config';
import { migrateDatabase } from '../persistence/migration-runner.js';
import { createProofPool } from '../persistence/proof-db.js';
import { createDirectorApp } from '../server.js';

const pool = createProofPool();
await migrateDatabase(pool);
createDirectorApp(pool).listen(Number(process.env.DIRECTOR_PORT ?? 4600), '127.0.0.1');
