import "dotenv/config";
import pg from "pg";
const url = process.env.DIRECTOR_DATABASE_URL;
if (!url) throw new Error("DIRECTOR_DATABASE_URL is required; no database default is permitted.");
export const pool = new pg.Pool({ connectionString: url });
// A PostgreSQL restart invalidates idle sockets; requests fail truthfully until composition reconnects.
pool.on("error", error => console.error(JSON.stringify({ event: "postgres_pool_error", code: (error as { code?: string }).code ?? "UNKNOWN" })));
