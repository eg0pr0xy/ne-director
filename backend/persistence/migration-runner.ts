import { readdir, readFile } from 'node:fs/promises';
import type { Pool } from 'pg';

const dir = new URL('../migrations/', import.meta.url);

export async function migrateDatabase(target: Pool) {
  for (const name of (await readdir(dir)).filter(x => x.endsWith('.sql')).sort()) {
    const exists = await target.query('select 1 from director_schema_migrations where name=$1', [name]).catch(() => ({ rowCount: 0 }));
    if (!exists.rowCount) {
      await target.query('begin');
      try { await target.query(await readFile(new URL(name, dir), 'utf8')); await target.query('insert into director_schema_migrations(name) values($1)', [name]); await target.query('commit'); }
      catch (error) { await target.query('rollback'); throw error; }
    }
  }
}
