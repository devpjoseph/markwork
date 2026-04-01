"""Pytest configuration for backend unit tests."""
import os
import sys

# Make src importable without installing the package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Provide minimal env vars so pydantic-settings doesn't fail on import
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test_secret_key_for_unit_tests_only")
