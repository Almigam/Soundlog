import logging

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from core.spotify import spotify_service
from core.security import get_current_user
from core.database import get_db
from core.models import Album, Song
from sqlalchemy.orm import Session
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/external", tags=["external"])


class SpotifyAlbumSearchResponse(BaseModel):
    id: str
    title: str
    artist: str
    release_year: Optional[int]
    cover_image_url: Optional[str]
    external_url: str


@router.get(
    "/search",
    response_model=List[SpotifyAlbumSearchResponse],
    dependencies=[Depends(get_current_user)],
)
async def search_spotify_albums(q: str):
    """Buscar álbumes en Spotify"""
    query = (q or "").strip()
    if len(query) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La búsqueda debe tener al menos 2 caracteres",
        )

    if not spotify_service.sp:
        raise HTTPException(
            status_code=503,
            detail=(
                "Servicio de Spotify no configurado. "
                "Configura SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET."
            ),
        )

    try:
        results = spotify_service.search_albums(query)
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error buscando en Spotify: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/import/{spotify_id}",
    dependencies=[Depends(get_current_user)],
)
async def import_spotify_album(
    spotify_id: str,
    db: Session = Depends(get_db),
):
    """Importar un álbum y sus canciones desde Spotify a nuestra BD"""
    # 1. Obtener detalles de Spotify
    details = spotify_service.get_album_details(spotify_id)
    if not details:
        raise HTTPException(status_code=404, detail="Álbum no encontrado en Spotify")

    # 2. Verificar si ya existe (por título y artista para simplificar)
    existing_album = db.query(Album).filter(
        Album.title == details['title'],
        Album.artist == details['artist']
    ).first()

    if existing_album:
        return {"message": "El álbum ya existe", "id": existing_album.id}

    # 3. Crear el álbum
    db_album = Album(
        title=details['title'],
        artist=details['artist'],
        release_year=details['release_year'],
        description=details['description'],
        cover_image_url=details['cover_image_url'],
        tags=details.get('tags') or None,
    )
    db.add(db_album)
    db.commit()
    db.refresh(db_album)

    # 4. Crear las canciones
    for track in details['tracks']:
        db_song = Song(
            title=track['title'],
            artist=track['artist'],
            album_id=db_album.id,
            duration=track['duration']
        )
        db.add(db_song)

    db.commit()

    return {"message": "Álbum importado con éxito", "id": db_album.id}
