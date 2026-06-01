"""
Rutas de Usuarios
"""

import logging
from typing import List

from core.blob_storage import blob_storage
from core.database import get_db
from core.models import User, UserFollow
from core.schemas import UserResponse, UserUpdate
from core.security import get_current_user
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Subir foto de perfil a Azure Blob (o disco local en desarrollo)."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre de archivo requerido",
        )

    try:
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Archivo vacío",
            )
        picture_url = blob_storage.upload_profile_picture(
            content, file.filename
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Error subiendo avatar: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar imagen: {str(e)}",
        )

    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if user.profile_picture_url:
        blob_storage.delete_profile_picture(user.profile_picture_url)

    user.profile_picture_url = picture_url
    db.commit()
    db.refresh(user)

    return {"profile_picture_url": picture_url}


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Obtener perfil del usuario autenticado"""
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )
    return user


@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
):
    """Buscar usuarios por nombre de usuario"""
    term = f"%{q.strip().lower()}%"
    users = (
        db.query(User)
        .filter(
            or_(
                func.lower(User.username).like(term),
                func.lower(User.full_name).like(term),
            )
        )
        .limit(20)
        .all()
    )
    return users


@router.post("/{username}/follow", status_code=status.HTTP_201_CREATED)
async def follow_user(
    username: str,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if target.id == current_user_id:
        raise HTTPException(status_code=400, detail="No puedes seguirte a ti mismo")

    existing = (
        db.query(UserFollow)
        .filter(
            UserFollow.follower_id == current_user_id,
            UserFollow.following_id == target.id,
        )
        .first()
    )
    if existing:
        return {"message": "Ya sigues a este usuario"}

    db.add(UserFollow(follower_id=current_user_id, following_id=target.id))
    db.commit()
    return {"message": f"Ahora sigues a {username}"}


@router.delete("/{username}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
    username: str,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    follow = (
        db.query(UserFollow)
        .filter(
            UserFollow.follower_id == current_user_id,
            UserFollow.following_id == target.id,
        )
        .first()
    )
    if not follow:
        raise HTTPException(status_code=404, detail="No sigues a este usuario")

    db.delete(follow)
    db.commit()


@router.get("/{username}/followers/count")
async def followers_count(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    count = db.query(UserFollow).filter(UserFollow.following_id == user.id).count()
    return {"username": username, "followers_count": count}


@router.get("/{username}", response_model=UserResponse)
async def get_user_by_username(username: str, db: Session = Depends(get_db)):
    """Obtener perfil público de un usuario por username"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )
    return user


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    updates: UserUpdate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar perfil del usuario autenticado"""
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Eliminar cuenta del usuario autenticado"""
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )
    db.delete(user)
    db.commit()
