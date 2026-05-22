#!/usr/bin/env python3
"""
Ejecuta las mismas comprobaciones que GitHub Actions (flake8 + pytest).
Uso: python scripts/run_ci_checks.py
"""

import os
import subprocess
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run(cmd: list[str]) -> int:
    print(f"\n>> {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=BACKEND_DIR)


def main() -> int:
    os.chdir(BACKEND_DIR)

    print("\n>> Instalando dependencias de test...")
    install_code = subprocess.call(
        [sys.executable, "-m", "pip", "install", "-q", "-r", "requirements-dev.txt"],
        cwd=BACKEND_DIR,
    )
    if install_code != 0:
        return install_code

    os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
    os.environ.setdefault("SECRET_KEY", "test-secret-key-only-for-ci-32chars!!")
    os.environ.setdefault("ENVIRONMENT", "testing")
    os.environ.setdefault("KEYVAULT_URL", "")

    flake8_code = run(
        [
            sys.executable,
            "-m",
            "flake8",
            ".",
            "--config=.flake8",
        ]
    )
    if flake8_code != 0:
        return flake8_code

    return run(
        [
            sys.executable,
            "-m",
            "pytest",
            "tests/",
            "-v",
            "--tb=short",
        ]
    )


if __name__ == "__main__":
    raise SystemExit(main())
