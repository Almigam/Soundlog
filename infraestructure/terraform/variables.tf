variable "sql_admin_password" {
  type        = string
  description = "Password del administrador del SQL Server"
  sensitive   = true
}

variable "jwt_secret_key" {
  type        = string
  description = "Clave secreta para firmar los tokens JWT"
  sensitive   = true
}
