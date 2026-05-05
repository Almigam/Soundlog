resource "azurerm_resource_group" "main" {
  name     = "rg-soundlog-dev"
  location = "francecentral"

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}
#Frontend estático
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
    error_404_document = "404.html"
  }

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

#Storage account para las imágenes: Fotos perfil y portadas álbumes, singles
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

#Contenedores
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

resource "azurerm_mssql_server" "main" {
  name                         = "soundlog-sql-server"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_admin_password

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

resource "azurerm_service_plan" "backend_plan" {
  name                = "soundlog-backend-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B1"

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

  site_config {
    application_stack {
      python_version = "3.10"
    }
  }

  app_settings = {
    "WEBSITE_RUN_FROM_PACKAGE" = "1"
    "DATABASE_URL" = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Database=soundlog;User ID=sqladmin;Password=${var.sql_admin_password};Encrypt=true;Connection Timeout=30;"
  }

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}
