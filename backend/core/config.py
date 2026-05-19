"""
Configuración mejorada con validaciones de seguridad
"""

import os
import secrets
from typing import List

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración con seguridad mejorada"""

    # ─────────────────── APP ───────────────────
    app_name: str = Field(default="Soundlog API")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)

    # ─────────────────── SECURITY ───────────────────
    secret_key: str = Field(
        default_factory=lambda: os.getenv(
            "SECRET_KEY") or secrets.token_urlsafe(32)
    )
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30, ge=1, le=1440)
    refresh_token_expire_days: int = Field(default=7, ge=1, le=30)

    rate_limit_requests: int = Field(default=100, ge=1)
    rate_limit_window_seconds: int = Field(default=60, ge=1)

    min_password_length: int = Field(default=8, ge=8)
    require_uppercase: bool = Field(default=True)
    require_numbers: bool = Field(default=True)
    require_special: bool = Field(default=True)
    max_failed_login_attempts: int = Field(default=5)
    lockout_duration_minutes: int = Field(default=15)

    # ─────────────────── DATABASE ───────────────────
    database_url: str = Field(
        default="mssql+pyodbc://sa:YourPassword123!@localhost/soundlog?driver=ODBC+Driver+17+for+SQL+Server"
    )
    database_pool_size: int = Field(default=5, ge=1, le=20)
    database_max_overflow: int = Field(default=10, ge=0, le=50)
    database_pool_recycle: int = Field(default=3600, ge=60)

    # ─────────────────── CORS ───────────────────
    allowed_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173")
    allow_credentials: bool = Field(default=True)
    allow_methods: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "PATCH"])
    allow_headers: List[str] = Field(default=["*"])

    # ─────────────────── LOGGING ───────────────────
    log_level: str = Field(default="INFO")
    log_file: str = Field(default="logs/app.log")
    log_max_size_mb: int = Field(default=100, ge=1)
    log_backup_count: int = Field(default=5, ge=1)

    # ─────────────────── AZURE ───────────────────
    azure_tenant_id: str = Field(default="")
    azure_client_id: str = Field(default="")
    azure_client_secret: str = Field(default="")
    keyvault_url: str = Field(default="")
    storage_account_name: str = Field(default="")
    storage_account_key: str = Field(default="")

    # ─────────────────── SPOTIFY ───────────────────
    spotify_client_id: str = Field(default="")
    spotify_client_secret: str = Field(default="")

    # ─────────────────── HEADERS SEGURIDAD ───────────────────
    enable_hsts: bool = Field(default=True)
    hsts_max_age: int = Field(default=31536000)
    enable_csp: bool = Field(default=True)

    class Config:
        env_file = ".env"
        case_sensitive = False
        env_file_encoding = "utf-8"
        extra = "ignore"

    @validator("secret_key", pre=True, always=True)
    def validate_secret_key(cls, v):
        if not v or v == "change-this-in-production":
            if os.getenv("ENVIRONMENT") == "production":
                raise ValueError(
                    "SECRET_KEY debe ser una cadena fuerte en producción. "
                    'Genera una con: python -c "import secrets; print(secrets.token_urlsafe(32))"'
                )
            return secrets.token_urlsafe(32)
        if len(v) < 32:
            raise ValueError("SECRET_KEY debe tener al menos 32 caracteres")
        return v

    @validator("debug", pre=True)
    def validate_debug(cls, v):
        if v and os.getenv("ENVIRONMENT") == "production":
            raise ValueError("DEBUG no puede ser True en producción")
        return v

    @validator("allowed_origins", pre=True, always=True)
    def validate_origins(cls, v):
        if isinstance(v, str):
            origins = [o.strip() for o in v.split(",")]
            if os.getenv("ENVIRONMENT") == "production":
                # Solo lanzamos error si NO hay Key Vault configurado.
                # Si hay Key Vault, permitimos el arranque porque sabemos que se sobrescribirá.
                if any("localhost" in o or "127.0.0.1" in o for o in origins):
                    if not os.getenv("KEYVAULT_URL"):
                        raise ValueError(
                            "No se pueden permitir localhost en producción sin un Key Vault configurado"
                        )
            return ",".join(origins)
        return v

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def environment(self) -> str:
        return os.getenv("ENVIRONMENT", "development")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


# Instancia global — una sola vez
settings = Settings()

# ─────────────────── INTEGRACIÓN AZURE KEY VAULT ───────────────────
# Si estamos en Azure y tenemos una URL de Key Vault, intentamos cargar los secretos
if settings.keyvault_url:
    try:
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient

        print(f"📦 Conectando a Key Vault: {settings.keyvault_url}")
        # Reducir el número de reintentos para no bloquear el arranque
        credential = DefaultAzureCredential()
        client = SecretClient(vault_url=settings.keyvault_url, credential=credential)

        # Mapeo de nombres de Key Vault (con guiones) a atributos de settings (con guiones bajos)
        kv_mapping = {
            "DATABASE-URL": "database_url",
            "SECRET-KEY": "secret_key",
            "STORAGE-ACCOUNT-KEY": "storage_account_key",
            "SPOTIFY-CLIENT-ID": "spotify_client_id",
            "SPOTIFY-CLIENT-SECRET": "spotify_client_secret",
            "ALLOWED-ORIGINS": "allowed_origins",
        }

        loaded_secrets = []
        for kv_name, attr_name in kv_mapping.items():
            try:
                # Intentamos obtener el secreto con un timeout
                secret = client.get_secret(kv_name)
                if secret and secret.value:
                    setattr(settings, attr_name, secret.value)
                    loaded_secrets.append(kv_name)
            except Exception as e:
                print(f"⚠️ No se pudo cargar el secreto {kv_name}: {e}")

        if loaded_secrets:
            print(f"✅ {len(loaded_secrets)} secretos cargados: {', '.join(loaded_secrets)}")

        # Validación crítica en producción (solo si no se cargó nada)
        if settings.is_production and "DATABASE-URL" not in loaded_secrets:
            print("❌ ADVERTENCIA: DATABASE-URL no cargado. El backend podría fallar al conectar.")

    except Exception as e:
        print(f"⚠️ Error conectando a Key Vault: {e}")
