# =============================================================================
# ForgeCRM — Makefile
# Developer convenience commands
# =============================================================================

.PHONY: help setup up down restart logs ps build test lint format \
        migrate migrate-create shell-api shell-db seed clean

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE  := \033[36m
GREEN := \033[32m
RESET := \033[0m

## ─── Help ────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@echo "ForgeCRM — Development Commands"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make $(BLUE)<target>$(RESET)\n\n"} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  $(BLUE)%-20s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

## ─── Environment ─────────────────────────────────────────────────────────────

setup: ## First-time local setup
	@echo "$(GREEN)Setting up ForgeCRM development environment...$(RESET)"
	@bash scripts/setup/setup.sh

## ─── Docker ──────────────────────────────────────────────────────────────────

up: ## Start all services
	docker compose up -d

up-build: ## Build and start all services
	docker compose up -d --build

down: ## Stop all services
	docker compose down

down-volumes: ## Stop all services and remove volumes
	docker compose down -v

restart: ## Restart all services
	docker compose restart

restart-api: ## Restart API service only
	docker compose restart api

restart-web: ## Restart web service only
	docker compose restart web

ps: ## Show running services
	docker compose ps

logs: ## Tail all service logs
	docker compose logs -f

logs-api: ## Tail API logs
	docker compose logs -f api

logs-web: ## Tail web logs
	docker compose logs -f web

build: ## Build all Docker images
	docker compose build

## ─── Backend (API) ───────────────────────────────────────────────────────────

test: ## Run backend tests
	docker compose exec api pytest tests/ -v --tb=short

test-cov: ## Run backend tests with coverage
	docker compose exec api pytest tests/ -v --tb=short --cov=app --cov-report=term-missing

lint: ## Run backend linter (ruff)
	docker compose exec api ruff check app/ tests/

format: ## Run backend formatter (black + ruff)
	docker compose exec api black app/ tests/
	docker compose exec api ruff check --fix app/ tests/

typecheck: ## Run mypy type checks
	docker compose exec api mypy app/

shell-api: ## Open shell in API container
	docker compose exec api bash

## ─── Database ────────────────────────────────────────────────────────────────

migrate: ## Run database migrations
	docker compose exec api alembic upgrade head

migrate-create: ## Create a new migration (MSG="description")
	docker compose exec api alembic revision --autogenerate -m "$(MSG)"

migrate-history: ## Show migration history
	docker compose exec api alembic history

migrate-current: ## Show current migration
	docker compose exec api alembic current

migrate-down: ## Rollback one migration
	docker compose exec api alembic downgrade -1

shell-db: ## Open psql shell
	docker compose exec postgres psql -U forgecrm -d forgecrm

seed: ## Seed the database with development data
	docker compose exec api python -m scripts.seed

reset-db: ## Reset the development database
	bash scripts/database/reset_db.sh

## ─── Frontend (Web) ──────────────────────────────────────────────────────────

install-web: ## Install frontend dependencies
	cd apps/web && npm install

lint-web: ## Run ESLint on frontend
	docker compose exec web npm run lint

typecheck-web: ## Run TypeScript type check
	docker compose exec web npm run type-check

build-web: ## Build frontend production bundle
	docker compose exec web npm run build

## ─── Quality ─────────────────────────────────────────────────────────────────

check-all: lint typecheck lint-web typecheck-web ## Run all quality checks

## ─── Cleanup ─────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts and caches
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)Cleaned build artifacts$(RESET)"
