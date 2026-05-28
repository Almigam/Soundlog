"""
Tests de integración para el flujo de autenticación.
"""
import pytest
from fastapi import status


def test_register_user(client):
    """Test de registro de usuario exitoso."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "Password123!",
            "full_name": "Test User"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data


def test_register_duplicate_email(client):
    """Test de registro con email duplicado."""
    # Primer registro
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "username": "user1",
            "password": "Password123!",
            "full_name": "User 1"
        }
    )
    
    # Segundo registro con mismo email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "username": "user2",
            "password": "Password123!",
            "full_name": "User 2"
        }
    )
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "email ya está registrado" in response.json()["detail"]


def test_login_success(client):
    """Test de login exitoso."""
    # Registrar primero
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "username": "loginuser",
            "password": "Password123!",
            "full_name": "Login User"
        }
    )
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "loginuser",
            "password": "Password123!"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    """Test de login con contraseña incorrecta."""
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong@example.com",
            "username": "wronguser",
            "password": "Password123!",
            "full_name": "Wrong User"
        }
    )
    
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "wronguser",
            "password": "WrongPassword123"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
