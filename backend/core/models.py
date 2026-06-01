"""
Modelos de base de datos
"""

from core.database import Base
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.sql import func


class User(Base):
    """Modelo de Usuario"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255))
    profile_picture_url = Column(String(500))
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now())


class Album(Base):
    """Modelo de Álbum"""

    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=False)
    release_year = Column(Integer)
    description = Column(String(1000))
    cover_image_url = Column(String(500))
    tags = Column(String(500))  # etiquetas separadas por coma
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now())


class UserFollow(Base):
    """Seguidores entre usuarios"""

    __tablename__ = "user_follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follow"),
    )

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, nullable=False, index=True)
    following_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())


class Song(Base):
    """Modelo de Canción"""

    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=False)
    album_id = Column(Integer, index=True)
    duration = Column(Integer)  # en segundos
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now())


class Review(Base):
    """Modelo de Reseña"""

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    album_id = Column(Integer, index=True)
    song_id = Column(Integer, index=True)
    rating = Column(Float, nullable=False)  # 0-5
    comment = Column(String(1000))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(),
                        onupdate=func.now())
