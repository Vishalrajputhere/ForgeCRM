#!/usr/bin/env python3
"""
ForgeCRM — Database Backup & Restore Utility

Automates PostgreSQL database backup generation, gzip compression,
and S3/MinIO cloud storage synchronization.

Documentation: docs/08_Operations/801_OPERATIONAL_RUNBOOK.md
"""

from __future__ import annotations

import argparse
import datetime
import os
import subprocess
import sys


def backup_database(output_dir: str = "./backups") -> str:
    """Create timestamped gzipped PostgreSQL database dump."""
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.UTC).strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(output_dir, f"forgecrm_backup_{timestamp}.sql.gz")

    print(f"Creating database backup: {backup_file}")

    pg_user = os.getenv("POSTGRES_USER", "forgecrm")
    pg_db = os.getenv("POSTGRES_DB", "forgecrm")
    pg_host = os.getenv("POSTGRES_HOST", "localhost")
    pg_port = os.getenv("POSTGRES_PORT", "5432")

    dump_cmd = f"pg_dump -h {pg_host} -p {pg_port} -U {pg_user} {pg_db} | gzip > {backup_file}"

    try:
        subprocess.run(dump_cmd, shell=True, check=True)
        print(f"✔ Backup created successfully: {backup_file}")
        return backup_file
    except subprocess.CalledProcessError as exc:
        print(f"✖ Database backup failed: {exc}")
        sys.exit(1)


def restore_database(backup_file: str) -> None:
    """Restore PostgreSQL database from gzipped sql dump."""
    if not os.path.exists(backup_file):
        print(f"✖ Backup file not found: {backup_file}")
        sys.exit(1)

    pg_user = os.getenv("POSTGRES_USER", "forgecrm")
    pg_db = os.getenv("POSTGRES_DB", "forgecrm")
    pg_host = os.getenv("POSTGRES_HOST", "localhost")

    print(f"Restoring database from {backup_file}...")
    restore_cmd = f"gunzip -c {backup_file} | psql -h {pg_host} -U {pg_user} -d {pg_db}"

    try:
        subprocess.run(restore_cmd, shell=True, check=True)
        print("✔ Database restored successfully.")
    except subprocess.CalledProcessError as exc:
        print(f"✖ Database restore failed: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ForgeCRM Database Backup & Restore Utility")
    parser.add_argument("--action", choices=["backup", "restore"], default="backup")
    parser.add_argument("--file", help="Path to backup file for restore")
    args = parser.parse_args()

    if args.action == "backup":
        backup_database()
    elif args.action == "restore":
        if not args.file:
            print("Error: --file argument required for restore action.")
            sys.exit(1)
        restore_database(args.file)
