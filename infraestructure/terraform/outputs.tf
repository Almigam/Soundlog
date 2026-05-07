#Archivo de configuración de Terraform para definir los outputs del módulo principal.
output "resource_group_name" {
  description = "Nombre del Resource Group"
  value       = azurerm_resource_group.main.name
}

output "frontend_url" {
  description = "URL del sitio web estático (frontend)"
  value       = azurerm_storage_account.frontend.primary_web_endpoint
}

output "backend_url" {
  description = "URL del App Service (backend)"
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "sql_server_fqdn" {
  description = "FQDN del SQL Server"
  value       = azurerm_mssql_server.main.fully_qualified_domain_name
}

output "key_vault_uri" {
  description = "URI del Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "images_storage_url" {
  description = "URL base del storage de imágenes"
  value       = azurerm_storage_account.images.primary_blob_endpoint
}
