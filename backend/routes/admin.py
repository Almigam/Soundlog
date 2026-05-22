"""
Rutas administrativas (seed, mantenimiento).
"""

import logging

from core.config import settings
from core.database import get_db
from core.models import Album, Song
from core.seed_data import SAMPLE_ALBUMS
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def seed_catalog(db: Session) -> dict:
    """Inserta álbumes y canciones de ejemplo si el catálogo está vacío."""
    existing = db.query(Album).count()
    if existing > 0:
        return {
            "seeded": False,
            "message": "El catálogo ya tiene contenido",
            "albums_count": existing,
        }

    albums_created = 0
    songs_created = 0

    for item in SAMPLE_ALBUMS:
        album = Album(
            title=item["title"],
            artist=item["artist"],
            release_year=item["release_year"],
            description=item["description"],
            cover_image_url=item["cover_image_url"],
        )
        db.add(album)
        db.flush()

        for track in item["tracks"]:
            db.add(
                Song(
                    title=track["title"],
                    artist=track["artist"],
                    album_id=album.id,
                    duration=track["duration"],
                )
            )
            songs_created += 1

        albums_created += 1

    db.commit()
    logger.info(
        "Catálogo inicializado: %s álbumes, %s canciones",
        albums_created,
        songs_created,
    )
    return {
        "seeded": True,
        "message": "Catálogo de ejemplo creado",
        "albums_count": albums_created,
        "songs_count": songs_created,
    }


@router.post("/seed-catalog")
async def seed_catalog_endpoint(db: Session = Depends(get_db)):
    """
    Poblar BD con álbumes de ejemplo.
    Permitido en desarrollo; en producción solo si el catálogo está vacío.
    """
    if settings.is_production:
        count = db.query(Album).count()
        if count > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seed no permitido: el catálogo ya tiene datos",
            )

    return seed_catalog(db)
