-- Create import schema
CREATE SCHEMA IF NOT EXISTS import;

-- Create users table for importing test data
CREATE TABLE IF NOT EXISTS import.users (
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL,
    password text NOT NULL,
    username text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    cc text DEFAULT 'US'
); 