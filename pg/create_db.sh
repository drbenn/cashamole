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
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255),
    providers JSONB DEFAULT '{}'::jsonb,
    profiles JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"

# --- Unset the password for security after use ---
unset PGPASSWORD

echo "|=============== Database Created ===============|"