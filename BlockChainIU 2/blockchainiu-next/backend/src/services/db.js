/* cspell:ignore TIMESTAMPTZ BYTEA BIGINT BOOLEAN NOW sha256 mimetype loan_id owner_id size_bytes verified_at verified_by */
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'iu_docs',
  user: process.env.PGUSER || 'iu_user',
  password: process.env.PGPASSWORD || 'iu_password',
});

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size_bytes BIGINT NOT NULL,
      owner_id TEXT NOT NULL,
      loan_id TEXT,
      sha256 TEXT NOT NULL,
      storage BYTEA NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      verified_at TIMESTAMPTZ,
      verified_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  // Ensure columns exist if table was created earlier without them
  await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS loan_id TEXT`);
  await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_by TEXT`);
}

