# 801 — Operational Runbook & Incident Management

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen / Approved

**Document Type:** Operations & Disaster Recovery Runbook

---

# 1. Purpose

This runbook provides standard operating procedures for operating, monitoring, scaling, backing up, restoring, and responding to incidents in ForgeCRM production environments.

---

# 2. Deployment Procedures

## 2.1 Starting Production Environment
```bash
# Start production containers using production compose override
docker compose -f docker-compose.prod.yml up -d
```

## 2.2 Applying Database Migrations
```bash
# Execute database migration script
python scripts/database/migrate.py
```

## 2.3 Production Smoke Verification
```bash
# Run automated production smoke tests against local or remote deployment
python scripts/deployment/smoke_test.py http://localhost:8000
```

---

# 3. Incident Management & Recovery

## 3.1 Service Health Probes
- **Liveness Probe**: `GET http://localhost:8000/health/live` (confirms process is running)
- **Readiness Probe**: `GET http://localhost:8000/health/ready` (confirms PostgreSQL & Redis reachable)
- **Metrics Probe**: `GET http://localhost:8000/health/metrics` (Prometheus metrics)

## 3.2 High Error Rate / High Latency
1. Inspect container logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f --tail=100 api
   ```
2. Verify Redis and PostgreSQL resource utilization:
   ```bash
   docker stats forgecrm_postgres_prod forgecrm_redis_prod
   ```
3. Restart degraded container:
   ```bash
   docker compose -f docker-compose.prod.yml restart api
   ```

## 3.3 Database Backup & Disaster Recovery
- **Backup**:
  ```bash
  python scripts/database/backup.py --action backup
  ```
- **Restore**:
  ```bash
  python scripts/database/backup.py --action restore --file ./backups/forgecrm_backup_YYYYMMDD_HHMMSS.sql.gz
  ```

---

# 4. Emergency Rollback Strategy

In the event of a critical deployment failure:
1. Revert Git tag to previous release tag.
2. Re-deploy previous production container image.
3. If database schema rollback is required:
   ```bash
   cd apps/api
   alembic downgrade -1
   ```
4. Execute smoke tests to verify recovery.
