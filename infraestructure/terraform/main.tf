resource "azurerm_resource_group" "main" {
  name     = "rg-soundlog-dev"
  location = "westeurope"

  tags = {
    project    = "soundlog"
    managed_by = "terraform"
  }
}