CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    providers JSONB DEFAULT '{}'::jsonb,
    profiles JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_login_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMP DEFAULT NOW(),
  ip_address INET NOT NULL,
  type VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS  user_refresh_tokens (
  token_hash VARCHAR(255) PRIMARY KEY, -- Store the hash of the token, not the token itself, for security
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_confirmations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE password_reset_email_confirmations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_date TIMESTAMP NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(11,2),
    category VARCHAR(30),
    vendor VARCHAR(30),
    note TEXT,
    active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE snapshots (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMP NOT NULL,
    category VARCHAR(20) NOT NULL,
    amount NUMERIC(11,2),
    party VARCHAR(30),
    title VARCHAR(30),
    note TEXT,
    active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    asset_valuation VARCHAR(10),
    liability_type VARCHAR(10),
    liability_interest_rate NUMERIC(4,4),
    liability_total_loan_value NUMERIC(11,2)
);