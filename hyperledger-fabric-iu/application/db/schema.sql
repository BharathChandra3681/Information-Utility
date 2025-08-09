CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  org TEXT NOT NULL,
  fabric_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loans
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  on_chain_tx_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents (store content as BYTEA)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id TEXT UNIQUE NOT NULL,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  sha256_hash TEXT NOT NULL,
  content BYTEA NOT NULL,
  metadata_json JSONB,
  committed BOOLEAN NOT NULL DEFAULT false,
  audit_mirrored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KYC Form-C (store minimal fields only)
CREATE TABLE IF NOT EXISTS kyc_formc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_id TEXT UNIQUE NOT NULL,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  party_id TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  committed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_loan ON documents(loan_id);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_kyc_loan ON kyc_formc(loan_id);
