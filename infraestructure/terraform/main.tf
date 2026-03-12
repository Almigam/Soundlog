resource "azurerm_resource_group" "main" {
  name     = "rg-soundlog-dev"
  location = "francecentral"

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}

resource "azurerm_storage_account" "frontend" {
  name = "soundlogdevfrontend"
  resource_group_name = azurerm_resource_group.main.name
  location = azurerm_resource_group.main.location
  account_tier= "Standard"
  account_replication_type = "LRS"
  account_kind = "StorageV2"

  https_traffic_only_enabled = true
  min_tls_version = "TLS1_2"

  static_website {
    index_document = "index.html"
    error_404_document = "404.html"
  }

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}