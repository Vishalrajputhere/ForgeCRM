#!/usr/bin/env bash
# =============================================================================
# ForgeCRM — First-Time Setup Script
# =============================================================================
# Usage: bash scripts/setup/setup.sh
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
RESET='\033[0m'

info()    { echo -e "${BLUE}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*"; exit 1; }

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${RESET}"
echo -e "${BLUE}║       ForgeCRM — Local Setup          ║${RESET}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${RESET}"
echo ""

# ── Check Prerequisites ───────────────────────────────────────────────────────

info "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || error "Docker is not installed. Please install Docker Desktop."
command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || error "Docker Compose is not available."

success "Docker and Docker Compose are available"

# ── Setup Environment ─────────────────────────────────────────────────────────

if [ ! -f .env ]; then
    info "Creating .env from .env.example..."
    cp .env.example .env
    success ".env created — please review and update values before production use"
else
    warn ".env already exists — skipping"
fi

# ── Create Required Directories ───────────────────────────────────────────────

info "Creating required directories..."

mkdir -p \
    apps/api \
    apps/web \
    docker/nginx \
    docker/postgres \
    infrastructure \
    scripts/setup \
    scripts/database \
    scripts/deployment \
    scripts/development \
    planning \
    standards \
    .github/workflows

success "Directory structure created"

# ── Pull Docker Images ────────────────────────────────────────────────────────

info "Pulling Docker images (this may take a few minutes)..."
docker compose pull --ignore-pull-failures 2>/dev/null || warn "Some images could not be pulled — they will be built locally"

# ── Build Docker Images ───────────────────────────────────────────────────────

info "Building Docker images..."
docker compose build --parallel

success "Docker images built"

# ── Start Services ────────────────────────────────────────────────────────────

info "Starting services..."
docker compose up -d postgres redis minio

info "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U forgecrm -d forgecrm >/dev/null 2>&1; then
        success "PostgreSQL is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        error "PostgreSQL did not become ready in time"
    fi
    sleep 2
done

info "Waiting for Redis to be ready..."
for i in $(seq 1 15); do
    if docker compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        success "Redis is ready"
        break
    fi
    if [ "$i" -eq 15 ]; then
        warn "Redis is not yet ready — continuing"
    fi
    sleep 2
done

# ── Run Migrations ────────────────────────────────────────────────────────────

info "Starting API service for migrations..."
docker compose up -d api

info "Waiting for API to be ready..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8000/health/live >/dev/null 2>&1; then
        success "API is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        warn "API did not respond in time — run migrations manually with: make migrate"
    fi
    sleep 3
done

info "Running database migrations..."
docker compose exec api alembic upgrade head && success "Migrations complete" || warn "No migrations to run yet"

# ── Start All Services ────────────────────────────────────────────────────────

info "Starting all services..."
docker compose up -d

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║          ForgeCRM Setup Complete! 🎉              ║${RESET}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════╣${RESET}"
echo -e "${GREEN}║  Frontend:     http://localhost:3000              ║${RESET}"
echo -e "${GREEN}║  API:          http://localhost:8000              ║${RESET}"
echo -e "${GREEN}║  API Docs:     http://localhost:8000/docs         ║${RESET}"
echo -e "${GREEN}║  MinIO:        http://localhost:9001              ║${RESET}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${RESET}"
echo ""
echo "  Run 'make help' to see all available commands"
echo "  Run 'make logs' to tail service logs"
echo ""
