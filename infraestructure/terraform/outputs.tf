#Archivo de configuración de Terraform para definir los outputs del módulo principal.
output "resource_group_name" {
  description = "Nombre del Resource Group creado"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Región donde se desplegó el Resource Group"
  value       = azurerm_resource_group.main.location
}
