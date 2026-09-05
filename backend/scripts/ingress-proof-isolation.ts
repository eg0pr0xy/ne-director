import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { pool } from '../persistence/db.js';
import { proofDatabaseUrl } from '../persistence/proof-db.js';

const fingerprint = async () => (await pool.query(`select
  (select count(*)::int from director_connections) as connections,
  (select count(*)::int from director_source_accounts) as accounts,
  (select count(*)::int from director_communication_source_records) as communications,
  (select count(*)::int from director_schedule_source_records) as schedule,
  (select count(*)::int from director_events) as events`)).rows[0];
const runProof = (env: NodeJS.ProcessEnv) => new Promise<{ code: number | null; output: string }>((resolve, reject) => {
  const child = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'backend/scripts/ingress-proof.ts'], { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'] });
  const output: Buffer[] = []; child.stdout.on('data', value => output.push(Buffer.from(value))); child.stderr.on('data', value => output.push(Buffer.from(value)));
  child.once('error', reject); child.once('close', code => resolve({ code, output: Buffer.concat(output).toString('utf8') }));
});

proofDatabaseUrl();
const before = await fingerprint();
const withoutProof = { ...process.env }; delete withoutProof.DIRECTOR_PROOF_DATABASE_URL;
const refused = await runProof(withoutProof);
assert.notEqual(refused.code, 0); assert.match(refused.output, /PROOF_DATABASE_REQUIRED/); assert.deepEqual(await fingerprint(), before);
const accepted = await runProof({ ...process.env });
assert.equal(accepted.code, 0); assert.deepEqual(await fingerprint(), before);
console.log(JSON.stringify({ proofRefusal: 'PROOF_DATABASE_REQUIRED', canonicalUnchanged: true }));
await pool.end();
