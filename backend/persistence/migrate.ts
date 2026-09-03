import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./db.js";
const dir = new URL("../migrations/", import.meta.url);
for (const name of (await readdir(dir)).filter(x => x.endsWith(".sql")).sort()) {
  const exists = await pool.query("select 1 from director_schema_migrations where name=$1", [name]).catch(() => ({ rowCount: 0 }));
  if (!exists.rowCount) { await pool.query("begin"); try { await pool.query(await readFile(new URL(name, dir), "utf8")); await pool.query("insert into director_schema_migrations(name) values($1)", [name]); await pool.query("commit"); } catch (e) { await pool.query("rollback"); throw e; } }
}
await pool.end();
