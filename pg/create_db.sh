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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    providers JSONB DEFAULT '{}'::jsonb,
    profiles JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \"password_resets\" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    reset_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS \"user_login_history\" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL ON DELETE CASCADE,
    login_at TIMESTAMP DEFAULT NOW(),
    ip_address INET NOT NULL,
    type VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS  \"user_refresh_tokens\" (
    token_hash VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL  ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"

# --- Unset the password for security after use ---
unset PGPASSWORD

echo "|=============== Database Created ===============|"