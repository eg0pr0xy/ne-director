import { pool } from "./db.js";
import { migrateDatabase } from "./migration-runner.js";
await migrateDatabase(pool);
await pool.end();
