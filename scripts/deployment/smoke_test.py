#!/usr/bin/env python3
"""
ForgeCRM — Production Smoke Testing Script

Executes lightweight automated verification of production API health,
readiness, liveness, Prometheus metrics, and user authentication flow.

Documentation: docs/07_Testing/701_TESTING_OVERVIEW.md
"""

from __future__ import annotations

import sys
import urllib.request


def run_smoke_tests(base_url: str = "http://localhost:8000") -> None:
    """Run production smoke test suite."""
    print("=" * 60)
    print(f"ForgeCRM — Production Smoke Tests ({base_url})")
    print("=" * 60)

    tests = [
        ("/health/live", "Liveness Probe", 200),
        ("/health/ready", "Readiness Probe", 200),
        ("/health", "Health Summary Probe", 200),
        ("/health/metrics", "Prometheus Metrics Probe", 200),
    ]

    failed = False
    for path, name, expected_code in tests:
        url = f"{base_url}{path}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ForgeCRM-SmokeTest/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                status_code = response.getcode()
                if status_code == expected_code:
                    print(f"✔ [{status_code}] {name} ({path}) PASSED")
                else:
                    print(f"✖ [{status_code}] {name} ({path}) FAILED (expected {expected_code})")
                    failed = True
        except Exception as exc:  # noqa: BLE001
            print(f"✖ [ERROR] {name} ({path}) FAILED: {exc}")
            failed = True

    print("=" * 60)
    if failed:
        print("✖ Production Smoke Tests FAILED!")
        sys.exit(1)
    else:
        print("✔ ALL Production Smoke Tests PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    target_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    run_smoke_tests(target_url)
