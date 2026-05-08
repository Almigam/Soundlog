"""
Esquemas Pydantic para validación mejorados
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator


# ──────────────────── AUTH ────────────────────
class UserBase(BaseModel):
    """Schema base para usuario"""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=30)
    full_name: Optional[str] = Field(None, max_length=255)

    @validator("username")
    def validate_username(cls, v):
        import re

        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError(
                "Username solo puede contener letras, números, guiones y guiones bajos"
            )
        return v


class UserCreate(UserBase):
    """Schema para crear usuario con validación de contraseña"""

    password: str = Field(..., min_length=8, max_length=128)

    @validator("password")
    def validate_password(cls, v):
        import re

        if not re.search(r"[A-Z]", v):
            raise ValueError(
                "La contraseña debe contener al menos una mayúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe contener al menos un número")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError(
                "La contraseña debe contener al menos un carácter especial"
            )
        return v


class UserUpdate(BaseModel):
    """Schema para actualizar usuario"""

    full_name: Optional[str] = Field(None, max_length=255)


class UserResponse(UserBase):
    """Schema de respuesta para usuario (sin password)"""

    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema de respuesta con tokens"""

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 1800


# ──────────────────── ÁLBUMES ────────────────────
class AlbumBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    artist: str = Field(..., min_length=1, max_length=255)
    release_year: Optional[int] = Field(None, ge=1900, le=2100)
    description: Optional[str] = Field(None, max_length=1000)
    cover_image_url: Optional[str] = Field(None, max_length=500)

    @validator("description")
    def sanitize_description(cls, v):
        if v:
            v = "".join(char for char in v if ord(
                char) >= 32 or char in "\n\t")
        return v


class AlbumCreate(AlbumBase):
    pass


class AlbumUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    artist: Optional[str] = Field(None, min_length=1, max_length=255)
    release_year: Optional[int] = Field(None, ge=1900, le=2100)
    description: Optional[str] = Field(None, max_length=1000)
    cover_image_url: Optional[str] = Field(None, max_length=500)


class AlbumResponse(AlbumBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────── CANCIONES ────────────────────
class SongBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    artist: str = Field(..., min_length=1, max_length=255)
    album_id: Optional[int] = Field(None, ge=1)
    duration: Optional[int] = Field(None, ge=0, le=3600)


class SongCreate(SongBase):
    pass


class SongUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    artist: Optional[str] = Field(None, min_length=1, max_length=255)
    album_id: Optional[int] = Field(None, ge=1)
    duration: Optional[int] = Field(None, ge=0, le=3600)


class SongResponse(SongBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────── RESEÑAS ────────────────────
class ReviewBase(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)

    @validator("comment")
    def sanitize_comment(cls, v):
        if v:
            v = v.strip()
            v = "".join(char for char in v if ord(
                char) >= 32 or char in "\n\t")
            v = v[:1000]
        return v


class ReviewCreate(ReviewBase):
    """Schema para crear reseña — exactamente uno de album_id o song_id es obligatorio"""

    album_id: Optional[int] = None
    song_id: Optional[int] = None

    @validator("song_id", always=True)
    def validate_one_target(cls, song_id, values):
        album_id = values.get("album_id")
        if album_id is None and song_id is None:
            raise ValueError("Debes especificar album_id o song_id")
        if album_id is not None and song_id is not None:
            raise ValueError("Especifica solo album_id o song_id, no ambos")
        return song_id


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    album_id: Optional[int] = None
    song_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
