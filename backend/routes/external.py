from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from core.spotify import spotify_service
from core.security import get_current_user
from core.database import get_db
from core.models import Album, Song
from sqlalchemy.orm import Session
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/external", tags=["external"])


class SpotifyAlbumSearchResponse(BaseModel):
    id: str
    title: str
    artist: str
    release_year: Optional[int]
    cover_image_url: Optional[str]
    external_url: str


@router.get("/search", response_model=List[SpotifyAlbumSearchResponse])
async def search_spotify_albums(
    q: str,
    current_user_id: int = Depends(get_current_user)
):
    """Buscar álbumes en Spotify"""
    try:
        results = spotify_service.search_albums(q)
        if not results and not spotify_service.sp:
            raise HTTPException(
                status_code=503,
                detail="Servicio de Spotify no configurado. Añade SPOTIFY_CLIENT_ID y SECRET."
            )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/{spotify_id}")
async def import_spotify_album(
    spotify_id: str,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
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
        cover_image_url=details['cover_image_url']
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
