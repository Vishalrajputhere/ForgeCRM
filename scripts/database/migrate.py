#!/usr/bin/env python3
"""
ForgeCRM — Production Database Migration Automation Script

Executes Alembic migrations to apply pending schema changes cleanly before application startup.

Documentation: docs/02_Database/201_DATABASE_OVERVIEW.md
"""

from __future__ import annotations

import os
import subprocess
import sys


def run_migrations() -> None:
    """Run Alembic database migration upgrade to head."""
    print("=" * 60)
    print("ForgeCRM — Running Database Migrations")
    print("=" * 60)

    api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "apps", "api"))
    
    try:
        res = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=api_dir,
            check=True,
            capture_output=True,
            text=True,
        )
        print(res.stdout)
        print("✔ Database migrations applied successfully to HEAD.")
    except subprocess.CalledProcessError as exc:
        print(f"✖ Migration failed with exit code {exc.returncode}")
        print(exc.stderr)
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
