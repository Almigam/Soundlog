import logging
import redis
from core.config import settings

logger = logging.getLogger(__name__)

# Cliente Redis global
try:
    redis_client = redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        socket_timeout=5,
    )
    # Probar conexión de forma perezosa
    # redis_client.ping()
except Exception as e:
    logger.error(f"Error inicializando Redis: {e}")
    redis_client = None


def get_redis():
    """Obtener cliente Redis si está disponible"""
    return redis_client
