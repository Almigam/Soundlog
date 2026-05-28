"""
Tests de integración para el sistema de reseñas.
"""
import pytest
from fastapi import status


@pytest.fixture
def auth_headers(client):
    """Fixture para obtener headers de autenticación."""
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "reviewer@example.com",
            "username": "reviewer",
            "password": "Password123!",
            "full_name": "Reviewer"
        }
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "reviewer", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_album(db_session):
    """Fixture para crear un álbum de prueba."""
    from core.models import Album
    album = Album(title="Test Album", artist="Test Artist", release_year=2023)
    db_session.add(album)
    db_session.commit()
    db_session.refresh(album)
    return album


def test_create_review(client, auth_headers, sample_album):
    """Test de creación de reseña exitosa."""
    response = client.post(
        "/api/v1/reviews/",
        headers=auth_headers,
        json={
            "album_id": sample_album.id,
            "rating": 4.5,
            "comment": "Increíble álbum!"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["rating"] == 4.5
    assert data["comment"] == "Increíble álbum!"


def test_create_review_invalid_rating(client, auth_headers, sample_album):
    """Test de creación con rating fuera de rango."""
    response = client.post(
        "/api/v1/reviews/",
        headers=auth_headers,
        json={
            "album_id": sample_album.id,
            "rating": 6.0,
            "comment": "Malo"
        }
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_album_reviews(client, auth_headers, sample_album):
    """Test de obtención de reseñas de un álbum."""
    # Crear reseña
    client.post(
        "/api/v1/reviews/",
        headers=auth_headers,
        json={
            "album_id": sample_album.id,
            "rating": 5.0,
            "comment": "Perfecto"
        }
    )
    
    response = client.get(f"/api/v1/reviews/album/{sample_album.id}")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert response.json()[0]["comment"] == "Perfecto"


def test_update_review(client, auth_headers, sample_album):
    """Test de actualización de reseña."""
    # Crear
    create_res = client.post(
        "/api/v1/reviews/",
        headers=auth_headers,
        json={
            "album_id": sample_album.id,
            "rating": 3.0,
            "comment": "Regular"
        }
    )
    review_id = create_res.json()["id"]
    
    # Actualizar
    response = client.patch(
        f"/api/v1/reviews/{review_id}",
        headers=auth_headers,
        json={"rating": 4.0, "comment": "Mejor de lo que pensaba"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["rating"] == 4.0
    assert response.json()["comment"] == "Mejor de lo que pensaba"


def test_delete_review(client, auth_headers, sample_album):
    """Test de eliminación de reseña."""
    # Crear
    create_res = client.post(
        "/api/v1/reviews/",
        headers=auth_headers,
        json={
            "album_id": sample_album.id,
            "rating": 1.0,
            "comment": "Borrar"
        }
    )
    review_id = create_res.json()["id"]
    
    # Eliminar
    response = client.delete(
        f"/api/v1/reviews/{review_id}",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verificar que ya no existe
    check = client.get(f"/api/v1/reviews/album/{sample_album.id}")
    assert len(check.json()) == 0
