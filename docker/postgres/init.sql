-- =============================================================================
-- ForgeCRM — PostgreSQL Initialization Script
-- Runs once when the container is first started
-- =============================================================================
-- Creates:
--   - Primary database: forgecrm
--   - Test database: forgecrm_test
--   - Extensions required by the application
-- =============================================================================

-- The primary database is created by the POSTGRES_DB environment variable.
-- This script creates the test database and installs extensions.

-- ── Test Database ─────────────────────────────────────────────────────────────
CREATE DATABASE forgecrm_test
    ENCODING 'UTF8'
    LC_COLLATE 'en_US.utf8'
    LC_CTYPE 'en_US.utf8'
    TEMPLATE template0;

COMMENT ON DATABASE forgecrm_test IS 'ForgeCRM automated test database';

-- Grant privileges to the application user
GRANT ALL PRIVILEGES ON DATABASE forgecrm TO forgecrm;
GRANT ALL PRIVILEGES ON DATABASE forgecrm_test TO forgecrm;

-- ── Primary Database Extensions ───────────────────────────────────────────────
\connect forgecrm;

-- UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions (for future use)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Full-text search configuration
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ── Test Database Extensions ──────────────────────────────────────────────────
\connect forgecrm_test;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── Timezone Configuration ────────────────────────────────────────────────────
-- Ensure UTC is used by default (also set in postgresql.conf via env)
ALTER DATABASE forgecrm SET timezone TO 'UTC';
ALTER DATABASE forgecrm_test SET timezone TO 'UTC';

-- ── Summary ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE 'ForgeCRM database initialization complete';
    RAISE NOTICE 'Primary database: forgecrm';
    RAISE NOTICE 'Test database: forgecrm_test';
    RAISE NOTICE 'Extensions installed: uuid-ossp, pgcrypto, unaccent, pg_stat_statements';
END
$$;
