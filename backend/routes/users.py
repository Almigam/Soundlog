"""
Rutas de Usuarios
"""

from core.database import get_db
from core.models import User
from core.schemas import UserResponse, UserUpdate
from core.security import get_current_user
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
import shutil
import os
import uuid

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subir foto de perfil localmente"""
    # 1. Validar extensión
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de imagen no soportado"
        )

    # 2. Generar nombre único
    filename = f"{uuid.uuid4()}{extension}"
    filepath = os.path.join("uploads", "avatars", filename)

    # 3. Guardar archivo
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar archivo: {str(e)}"
        )

    # 4. Actualizar usuario en BD
    user = db.query(User).filter(User.id == current_user_id).first()

    # Borrar anterior si existe y es local
    if user.profile_picture_url and user.profile_picture_url.startswith("/uploads/"):
        old_path = user.profile_picture_url.lstrip("/")
        if os.path.exists(old_path):
            os.remove(old_path)

    relative_url = f"/uploads/avatars/{filename}"
    user.profile_picture_url = relative_url
    db.commit()
    db.refresh(user)

    return {"profile_picture_url": relative_url}


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

    # Solo actualizar los campos que vienen en el request
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
