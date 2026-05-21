"""
Configuración compartida de pytest (misma que GitHub Actions).
"""

import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-only-for-ci-32chars!!")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("KEYVAULT_URL", "")


@pytest.fixture
def client():
    """Cliente HTTP de integración para la API."""
    from fastapi.testclient import TestClient
    from main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_session():
    """Sesión aislada en SQLite en memoria (tests unitarios)."""
    from core.database import Base
    from core.models import Album, Song  # noqa: F401

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
