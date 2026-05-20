# ─────────────────────────────────────────────────────────────
#  SOUNDLOG — main.tf
#  Infraestructura completa en Azure (francecentral)
# ─────────────────────────────────────────────────────────────

# Datos de la suscripción actual — necesarios para Key Vault
data "azurerm_client_config" "current" {}

# ──────────────────────────────────────────────
#  RESOURCE GROUP
# ──────────────────────────────────────────────
resource "azurerm_resource_group" "main" {
  name     = "rg-soundlog-dev"
  location = "francecentral"

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# ──────────────────────────────────────────────
#  STORAGE — Frontend estático
# ──────────────────────────────────────────────
resource "azurerm_storage_account" "frontend" {
  name                     = "soundlogdevfrontend"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"

  https_traffic_only_enabled = true
  min_tls_version            = "TLS1_2"

  static_website {
    index_document     = "index.html"
    error_404_document = "index.html"
  }

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# ──────────────────────────────────────────────
#  STORAGE — Imágenes (portadas, fotos perfil)
# ──────────────────────────────────────────────
resource "azurerm_storage_account" "images" {
  name                     = "soundlogdevimages"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"

  https_traffic_only_enabled = true
  min_tls_version            = "TLS1_2"

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

resource "azurerm_storage_container" "profile_pictures" {
  name                  = "profile-pictures"
  storage_account_name  = azurerm_storage_account.images.name
  container_access_type = "blob"
}

resource "azurerm_storage_container" "album_covers" {
  name                  = "album-covers"
  storage_account_name  = azurerm_storage_account.images.name
  container_access_type = "blob"
}

# ──────────────────────────────────────────────
#  SQL SERVER + DATABASE
# ──────────────────────────────────────────────
resource "azurerm_mssql_server" "main" {
  name                         = "soundlog-sql-server"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_admin_password

  # Permite que los servicios de Azure accedan al servidor
  # (necesario para que el App Service se conecte)
  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# Regla de firewall — permite acceso desde otros servicios Azure
resource "azurerm_mssql_firewall_rule" "azure_services" {
  name      = "AllowAzureServices"
  server_id = azurerm_mssql_server.main.id

  # 0.0.0.0 → 0.0.0.0 es la convención de Azure para "servicios internos"
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# La base de datos en sí (estaba faltando)
resource "azurerm_mssql_database" "main" {
  name      = "soundlog"
  server_id = azurerm_mssql_server.main.id
  sku_name  = "Basic"  # ~5€/mes, suficiente para desarrollo universitario

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# ──────────────────────────────────────────────
#  APP SERVICE — Backend FastAPI
# ──────────────────────────────────────────────
resource "azurerm_service_plan" "backend_plan" {
  name                = "soundlog-backend-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B1"  # ~13€/mes

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

resource "azurerm_linux_web_app" "backend" {
  name                = "soundlog-backend"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.backend_plan.id
  https_only          = true

  # Managed Identity — para que el App Service lea del Key Vault
  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
    always_on        = true
    app_command_line = "bash ./startup.sh"
  }

  app_settings = {
    "KEYVAULT_URL"                   = azurerm_key_vault.main.vault_uri
    "ENVIRONMENT"                    = "production"
    "WEBSITES_PORT"                  = "8000"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
    "ENABLE_ORYX_BUILD"              = "true"
    "SECRET_KEY"                     = var.jwt_secret_key # Fallback para evitar crash en validación
    "PYTHON_ENABLE_GUNICORN_MULTI_HTTP_SERVER_CONFIG" = "true"
    "WEBSITES_CONTAINER_START_TIME_LIMIT" = "600"
  }

  logs {
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
    application_logs {
      file_system_level = "Information"
    }
  }

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# ──────────────────────────────────────────────
#  KEY VAULT
# ──────────────────────────────────────────────
resource "azurerm_key_vault" "main" {
  name                = "soundlog-dev-kv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  soft_delete_retention_days = 7
  purge_protection_enabled   = false

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# Permiso 1 — El ejecutor de Terraform (GitHub Actions / Local)
resource "azurerm_key_vault_access_policy" "terraform_executor" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = ["Get", "Set", "Delete", "List", "Purge"]
}
# Permiso 2 — El App Service (Managed Identity) puede leer secretos
# NOTA: Este recurso solo funciona tras el primer apply que añade la identity
# al App Service. Ver instrucciones de despliegue en README.
resource "azurerm_key_vault_access_policy" "app_service" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.backend.identity[0].principal_id

  secret_permissions = ["Get", "List"]

  depends_on = [azurerm_linux_web_app.backend]
}

# ──────────────────────────────────────────────
#  SECRETOS EN KEY VAULT
# ──────────────────────────────────────────────

# Connection string completa — FastAPI la lee para conectarse a SQL
resource "azurerm_key_vault_secret" "database_url" {
  name         = "DATABASE-URL"
  key_vault_id = azurerm_key_vault.main.id

  value = "mssql+pyodbc://sqladmin:${var.sql_admin_password}@${azurerm_mssql_server.main.fully_qualified_domain_name}/soundlog?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes"

  depends_on = [
    azurerm_key_vault.main,
    azurerm_key_vault_access_policy.terraform_executor
  ]

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# Clave JWT para firmar tokens de autenticación
resource "azurerm_key_vault_secret" "secret_key" {
  name         = "SECRET-KEY"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.jwt_secret_key

  depends_on = [
    azurerm_key_vault.main,
    azurerm_key_vault_access_policy.terraform_executor
  ]

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# Clave del Storage de imágenes — para que el backend suba archivos
resource "azurerm_key_vault_secret" "storage_key" {
  name         = "STORAGE-ACCOUNT-KEY"
  key_vault_id = azurerm_key_vault.main.id
  value        = azurerm_storage_account.images.primary_access_key

  depends_on = [
    azurerm_key_vault.main,
    azurerm_key_vault_access_policy.terraform_executor
  ]

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# Orígenes permitidos (CORS) — dinámico desde el storage del frontend
resource "azurerm_key_vault_secret" "allowed_origins" {
  name         = "ALLOWED-ORIGINS"
  key_vault_id = azurerm_key_vault.main.id
  # Quitamos la barra final de la URL del storage para que coincida con el estándar de CORS
  value        = trimsuffix(azurerm_storage_account.frontend.primary_web_endpoint, "/")

  depends_on = [
    azurerm_key_vault.main,
    azurerm_key_vault_access_policy.terraform_executor
  ]

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

# Spotify API Secrets
resource "azurerm_key_vault_secret" "spotify_id" {
  name         = "SPOTIFY-CLIENT-ID"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.spotify_client_id

  depends_on = [
    azurerm_key_vault.main,
    azurerm_key_vault_access_policy.terraform_executor
  ]
}

resource "azurerm_key_vault_secret" "spotify_secret" {
  name         = "SPOTIFY-CLIENT-SECRET"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.spotify_client_secret

  depends_on = [
    azurerm_key_vault.main,
    azurerm_key_vault_access_policy.terraform_executor
  ]
}

# ──────────────────────────────────────────────
#  PERMISOS — Managed Identity → Blob Storage
# ──────────────────────────────────────────────

# La Managed Identity de GitHub Actions necesita poder
# subir archivos al Blob Storage del frontend
resource "azurerm_role_assignment" "github_storage_frontend" {
  scope                = azurerm_storage_account.frontend.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = var.github_managed_identity_principal_id
}
