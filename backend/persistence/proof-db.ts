import pg from 'pg';

export class ProofDatabaseRequiredError extends Error {
  readonly code = 'PROOF_DATABASE_REQUIRED';
  constructor() { super('PROOF_DATABASE_REQUIRED'); }
}

export const proofDatabaseUrl = () => {
  const raw = process.env.DIRECTOR_PROOF_DATABASE_URL;
  if (!raw) throw new ProofDatabaseRequiredError();
  let database: string;
  try { database = decodeURIComponent(new URL(raw).pathname).replace(/^\//, ''); } catch { throw new ProofDatabaseRequiredError(); }
  if (!/^[a-z0-9_]+_proof$/i.test(database) || database === 'ne_director' || /(?:prod|production|live|canonical)/i.test(database)) throw new ProofDatabaseRequiredError();
  return raw;
};

/** The proof runner's only database constructor. It never reads DIRECTOR_DATABASE_URL. */
export const createProofPool = () => new pg.Pool({ connectionString: proofDatabaseUrl() });
