#!/usr/bin/env bash
# =============================================================================
# ForgeCRM — Reset Development Database
# =============================================================================
# WARNING: This destroys all data in the development database.
#          Do NOT run this in staging or production.
# =============================================================================

set -euo pipefail

echo "⚠️  This will DESTROY all data in the development database."
read -r -p "Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "Resetting development database..."

# Drop and recreate the database
docker compose exec -T postgres psql -U forgecrm -d postgres <<'SQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'forgecrm' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS forgecrm;

CREATE DATABASE forgecrm
    ENCODING 'UTF8'
    LC_COLLATE 'en_US.utf8'
    LC_CTYPE 'en_US.utf8'
    TEMPLATE template0;

GRANT ALL PRIVILEGES ON DATABASE forgecrm TO forgecrm;
SQL

# Reconnect and install extensions
docker compose exec -T postgres psql -U forgecrm -d forgecrm <<'SQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;
ALTER DATABASE forgecrm SET timezone TO 'UTC';
SQL

# Run migrations
echo "Running migrations..."
docker compose exec api alembic upgrade head

echo "✅ Database reset complete"
