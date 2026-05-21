"""
Configuración de la base de datos — Azure SQL Server
"""

from core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Crear engine (SQL Server en prod, SQLite en tests/CI)
_engine_kwargs = {
    "echo": settings.debug,
    "pool_pre_ping": True,
}
if settings.database_url.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs.update(
        pool_size=5,
        max_overflow=10,
        connect_args={"timeout": 30},
    )

engine = create_engine(settings.database_url, **_engine_kwargs)

# Crear sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


def get_db():
    """Obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
