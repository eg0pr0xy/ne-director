import assert from 'node:assert/strict';
import test from 'node:test';
import { ProofDatabaseRequiredError, proofDatabaseUrl } from '../persistence/proof-db.js';

const original = process.env.DIRECTOR_PROOF_DATABASE_URL;
test('proof database contract never falls back to the normal database URL', () => {
  delete process.env.DIRECTOR_PROOF_DATABASE_URL; process.env.DIRECTOR_DATABASE_URL = 'postgres://user:password@localhost:55434/ne_director';
  assert.throws(() => proofDatabaseUrl(), (error: unknown) => error instanceof ProofDatabaseRequiredError && error.code === 'PROOF_DATABASE_REQUIRED');
});

test('proof database contract accepts only a disposable _proof database', () => {
  process.env.DIRECTOR_PROOF_DATABASE_URL = 'postgres://user:password@localhost:55434/ne_director';
  assert.throws(() => proofDatabaseUrl(), (error: unknown) => error instanceof ProofDatabaseRequiredError);
  process.env.DIRECTOR_PROOF_DATABASE_URL = 'postgres://user:password@localhost:55435/ne_director_proof';
  assert.equal(proofDatabaseUrl().endsWith('/ne_director_proof'), true);
  if (original === undefined) delete process.env.DIRECTOR_PROOF_DATABASE_URL; else process.env.DIRECTOR_PROOF_DATABASE_URL = original;
});
