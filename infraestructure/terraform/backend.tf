#El estado de Terraform se guarda en Azure Storage.
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-soundlog-tfstate"
    storage_account_name = "soundlogtfstate"   
    container_name       = "tfstate"
    key                  = "soundlog.terraform.tfstate"
    use_oidc              = true
    use_azuread_auth      = true
    tenant_id             = "78f3a279-48c8-4670-9162-a63c451c9fae"   # tu tenant real
    client_id             = "63dc30b6-de60-4833-8c4b-85cf39ae167c"   # clientId de la Managed Identity
  }
}

