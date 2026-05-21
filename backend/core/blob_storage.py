"""
Almacenamiento de archivos en Azure Blob Storage (con fallback local en dev).
"""

import logging
import os
import uuid
from typing import Optional

from azure.core.exceptions import AzureError
from azure.storage.blob import BlobServiceClient, ContentSettings
from core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class BlobStorageService:
    def __init__(self):
        self._client: Optional[BlobServiceClient] = None
        if settings.storage_account_name and settings.storage_account_key:
            account_url = (
                f"https://{settings.storage_account_name}.blob.core.windows.net"
            )
            self._client = BlobServiceClient(
                account_url=account_url,
                credential=settings.storage_account_key,
            )
            logger.info(
                "Azure Blob Storage configurado: %s",
                settings.storage_account_name,
            )
        else:
            logger.warning(
                "Azure Blob Storage no configurado; avatares se guardan en disco local"
            )

    @property
    def is_azure_enabled(self) -> bool:
        return self._client is not None

    def _validate_extension(self, filename: str) -> str:
        extension = os.path.splitext(filename or "")[1].lower()
        if extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise ValueError("Formato de imagen no soportado")
        return extension

    def upload_profile_picture(
        self, file_content: bytes, original_filename: str
    ) -> str:
        """Sube avatar y devuelve URL pública."""
        extension = self._validate_extension(original_filename)
        blob_name = f"{uuid.uuid4()}{extension}"

        if self._client:
            return self._upload_to_azure(
                container=settings.profile_pictures_container,
                blob_name=blob_name,
                data=file_content,
                extension=extension,
            )
        return self._upload_locally(blob_name, file_content)

    def delete_profile_picture(self, url: str) -> None:
        """Elimina avatar anterior si es de nuestro storage."""
        if not url:
            return
        try:
            if self._client and settings.storage_account_name in url:
                container = settings.profile_pictures_container
                prefix = f"/{container}/"
                if prefix in url:
                    blob_name = url.split(prefix, 1)[1]
                    blob_client = self._client.get_blob_client(
                        container=container, blob=blob_name
                    )
                    blob_client.delete_blob()
            elif url.startswith("/uploads/"):
                local_path = url.lstrip("/")
                if os.path.exists(local_path):
                    os.remove(local_path)
        except (AzureError, OSError) as e:
            logger.warning("No se pudo eliminar avatar anterior: %s", e)

    def _upload_to_azure(
        self,
        container: str,
        blob_name: str,
        data: bytes,
        extension: str,
    ) -> str:
        blob_client = self._client.get_blob_client(
            container=container, blob=blob_name
        )
        content_settings = ContentSettings(
            content_type=CONTENT_TYPES.get(extension, "application/octet-stream")
        )
        blob_client.upload_blob(
            data,
            overwrite=True,
            content_settings=content_settings,
        )
        return blob_client.url

    def _upload_locally(self, blob_name: str, data: bytes) -> str:
        os.makedirs("uploads/avatars", exist_ok=True)
        filepath = os.path.join("uploads", "avatars", blob_name)
        with open(filepath, "wb") as f:
            f.write(data)
        return f"/uploads/avatars/{blob_name}"


blob_storage = BlobStorageService()
