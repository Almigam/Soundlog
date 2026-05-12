"""
Soundlog API — Backend principal con seguridad mejorada
"""

from core.config import settings
from core.logging_config import setup_logging
from core.security_middleware import (
    AuditLoggingMiddleware,
    InputSanitizationMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
)
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from routes import albums, auth, reviews, songs, users, external

# Cargar variables de ambiente
load_dotenv()

# Configurar logging
logger = setup_logging(
    log_file=settings.log_file,
    level=settings.log_level,
    max_size_mb=settings.log_max_size_mb,
    backup_count=settings.log_backup_count,
)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.app_name,
    description="API para reseñar álbumes y canciones",
    version=settings.app_version,
    # Swagger desactivado en producción
    docs_url="/api/docs" if not settings.is_production else None,
    openapi_url="/api/openapi.json" if not settings.is_production else None,
)

# ──────────────────── MIDDLEWARE (orden importa) ────────────────────

# 1. Hosts de confianza — solo hostnames, sin protocolo ni puerto
#    En producción cambiar a: ["tudominio.com", "*.azurewebsites.net"]
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],  # permisivo en dev; restringir en prod
)

# 2. CORS — orígenes permitidos leídos de config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=settings.allow_credentials,
    allow_methods=settings.allow_methods,
    allow_headers=settings.allow_headers,
)

# 3. Headers de seguridad HTTP
app.add_middleware(SecurityHeadersMiddleware)

# 4. Rate limiting por IP
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=settings.rate_limit_requests,
)

# 5. Audit logging de requests/responses
app.add_middleware(AuditLoggingMiddleware)

# 6. Sanitización de inputs (tamaño de payload y métodos HTTP)
app.add_middleware(InputSanitizationMiddleware)

# ──────────────────── ROUTERS ────────────────────
app.include_router(auth.router)  # /api/v1/auth
app.include_router(users.router)  # /api/v1/users
app.include_router(albums.router)  # /api/v1/albums
app.include_router(songs.router)  # /api/v1/songs
app.include_router(reviews.router)  # /api/v1/reviews
app.include_router(external.router)  # /api/v1/external


# ──────────────────── HEALTH CHECKS ────────────────────
@app.get("/", tags=["root"])
async def root():
    """Endpoint raíz"""
    return {
        "message": "Bienvenido a Soundlog API",
        "version": settings.app_version,
        "status": "online",
        "environment": settings.environment,
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check para Azure App Service"""
    import datetime

    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


@app.get("/ready", tags=["health"])
async def readiness_check():
    """Readiness probe — verifica conexión a la BD"""
    import logging

    log = logging.getLogger(__name__)
    try:
        from core.database import SessionLocal
        from sqlalchemy import text

        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready"}
    except Exception as e:
        log.error(f"Readiness check failed: {e}")
        return {"status": "not_ready", "error": str(e)}


# ──────────────────── ERROR HANDLERS ────────────────────
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Captura excepciones no manejadas"""
    import logging
    import uuid

    logging.getLogger(__name__).error(
        f"Unhandled exception: {exc}", exc_info=True)
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor",
            "error_id": uuid.uuid4().hex[:8],
        },
    )


# ──────────────────── ENTRY POINT ────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=not settings.is_production,
        log_level=settings.log_level.lower(),
    )
