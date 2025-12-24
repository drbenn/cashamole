#!/bin/bash

# chmod +x create_db.sh

# Database connection details
DB_NAME="cashamole_db"
DB_USER="postgres"
DB_PASSWORD="pass" # Replace with your actual password
export PGPASSWORD=$DB_PASSWORD

ROOT_PASSWORD="pass"
# Create database
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

psql -U $DB_USER -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS \"users\" (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    providers JSONB DEFAULT '{}'::jsonb,
    profiles JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \"user_login_history\" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_at TIMESTAMP DEFAULT NOW(),
    ip_address INET NOT NULL,
    type VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS  \"user_refresh_tokens\" (
    jti VARCHAR(55) PRIMARY KEY,  -- jwt id to actually reference the token for security APPPARENTLY
    token_hash VARCHAR(255), -- Store the hash of the token, not the token itself, for security
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE \"email_confirmations\" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE \"password_reset_email_confirmations\" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE \"categories\" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    usage_type VARCHAR(20) NOT NULL CHECK (usage_type IN ('transaction', 'asset', 'liability')), 
    sort_order INT NOT NULL DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,        -- Guard for the "Uncategorized" category
    active BOOLEAN DEFAULT TRUE,

    -- Auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE \"transactions\" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id), -- Linked to a 'transaction' category
    transaction_date DATE NOT NULL,  -- date instead of timestamp, basic date is good enough and selected by user anyway via calendar
    type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
    amount NUMERIC(11,2),
    vendor VARCHAR(30),
    note TEXT,
    active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE \"snapshot_headers\" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL, -- Pure calendar date
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optional: Enforce only one snapshot per user per day
    UNIQUE (user_id, snapshot_date)
);

CREATE TABLE \"snapshot_assets\" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Foreign Key to link to the main snapshot
    snapshot_id UUID NOT NULL REFERENCES snapshot_headers(id) ON DELETE CASCADE,
    
    -- Core Item Fields
    category_id UUID NOT NULL REFERENCES categories(id), -- e.g., 'Cash' or 'Investments'
    entity_type VARCHAR(10) NOT NULL DEFAULT 'asset',
    amount NUMERIC(11,2)  NOT NULL DEFAULT 0,
    party VARCHAR(50),
    title VARCHAR(50),
    note TEXT,
    sort_order INT NOT NULL DEFAULT 0, -- Order of items INSIDE the category
    active BOOLEAN DEFAULT TRUE,
    
    -- Asset Specific
    asset_valuation VARCHAR(10) CHECK (asset_valuation IN ('book', 'market')),
    
    -- Auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE \"snapshot_liabilities\" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Foreign Key to link to the main snapshot
    snapshot_id UUID NOT NULL REFERENCES snapshot_headers(id) ON DELETE CASCADE,
    
    -- Core Item Fields
    category_id UUID NOT NULL REFERENCES categories(id),
    entity_type VARCHAR(10) NOT NULL DEFAULT 'liability',
    amount NUMERIC(11,2),
    party VARCHAR(50),
    title VARCHAR(50),
    note TEXT,
    sort_order INT NOT NULL DEFAULT 0, -- Order of items INSIDE the category
    active BOOLEAN DEFAULT TRUE,
    
    -- Liability Specific
    liability_type VARCHAR(10) CHECK (liability_type IN ('short', 'long')),
    liability_maturity_date DATE,
    liability_interest_rate NUMERIC(6,4),
    liability_total_loan_value NUMERIC(11,2),
    
    -- Auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Essential for filtering by User (used in almost every query)
CREATE INDEX idx_categories_user_id ON categories (user_id);
CREATE INDEX idx_transactions_user_id ON transactions (user_id);

-- 2. Essential for joining Transactions to Categories
CREATE INDEX idx_transactions_category_id ON transactions (category_id);

-- 3. Essential for Snapshots
CREATE INDEX idx_snapshot_liabilities_snapshot_id ON snapshot_liabilities (snapshot_id);
CREATE INDEX idx_snapshot_assets_snapshot_id ON snapshot_assets (snapshot_id);

-- 4. Essential for the "Uncategorized" move logic 
-- (Filtering by category_id inside Asset/Liability tables)
CREATE INDEX idx_snapshot_assets_category_id ON snapshot_assets (category_id);
CREATE INDEX idx_snapshot_liabilities_category_id ON snapshot_liabilities (category_id);
"

# --- Unset the password for security after use ---
unset PGPASSWORD

echo "|=============== Database Created ===============|"