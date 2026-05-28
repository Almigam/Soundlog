"""
Configuración compartida de pytest (misma que GitHub Actions).
"""
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Asegurar imports de core/ y routes/ en CI (Linux) y local
_BACKEND_ROOT = Path(__file__).resolve().parent.parent

if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

# Configurar variables de entorno antes de importar core/main
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-only-for-ci-32chars!!")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("KEYVAULT_URL", "")

# Ahora sí, imports locales del proyecto
from core.database import Base, get_db  # noqa: E402
from main import app  # noqa: E402

# Base de datos de test en memoria con StaticPool para mantener la conexión
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Sesión de base de datos fresca para cada test."""
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Limpiar tablas para el siguiente test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Cliente HTTP que utiliza la base de datos de test."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    # Limpiar overrides al terminar el test
    app.dependency_overrides.clear()
