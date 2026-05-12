# ─────────────────────────────────────────────────────────────
#  SOUNDLOG — variables.tf
# ─────────────────────────────────────────────────────────────

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

variable "github_managed_identity_principal_id" {
  type        = string
  description = "Principal ID de la Managed Identity usada por GitHub Actions"
}

variable "spotify_client_id" {
  type        = string
  description = "Client ID de la API de Spotify"
  default     = ""
}

variable "spotify_client_secret" {
  type        = string
  description = "Client Secret de la API de Spotify"
  sensitive   = true
  default     = ""
}
