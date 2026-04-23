# 🔐 Managed Identity & Key Vault Setup

**Próxima fase después del despliegue inicial**

Una vez que tu infraestructura básica está funcionando en Azure, puedes mejorar la seguridad implementando Managed Identities y Key Vault para eliminar secrets de los app settings.

---

## 📚 Tabla de Contenidos

1. [Conceptos](#conceptos)
2. [Crear Managed Identity](#crear-managed-identity)
3. [Configurar Key Vault](#configurar-key-vault)
4. [Migrar Secrets](#migrar-secrets)
5. [Testing](#testing)

---

## 📖 Conceptos

### ¿Qué es Managed Identity?

- **Sin credenciales hardcodeadas** ✅
- Identidad automática para recursos Azure
- Azure maneja rotación de tokens
- Mejor seguridad, menos complejidad

### ¿Qué es Key Vault?

- Almacenamiento centralizado de secrets
- Encryption en reposo
- Audit logs completos
- Integración con Managed Identity

### Flujo Antes vs Después

```
ANTES (Inseguro):
App Service → (connection string en appsettings.json)
         ↓
    SQL Database

DESPUÉS (Seguro):
App Service (Managed Identity) 
         ↓
    Key Vault (GetSecret)
         ↓
    SQL Database
    (Sin secrets en appsettings)
```

---

## 🔧 Crear Managed Identity

### PASO 1: Habilitar Managed Identity en App Service

```powershell
# Opción A: Via Azure CLI
az webapp identity assign \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api \
  --identities '[system]'

# Obtener el Principal ID
$principalId = az webapp identity show \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api \
  --query principalId -o tsv

Write-Host "Principal ID: $principalId"
```

### PASO 2: Dar permisos al App Service en SQL

```powershell
# El App Service necesita permisos en SQL para conectarse

# 1. Obtener el nombre de la identidad
$identityName = az webapp show \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api \
  --query identity.principalId -o tsv

# 2. Crear usuario SQL con la identidad
$sqlServer = "soundlog-dev-sqlserver"
$database = "soundlog"
$resourceGroup = "rg-soundlog-dev"

# Script SQL a ejecutar
$sqlScript = @"
CREATE USER [soundlog-dev-api] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [soundlog-dev-api];
ALTER ROLE db_datawriter ADD MEMBER [soundlog-dev-api];
ALTER ROLE db_ddladmin ADD MEMBER [soundlog-dev-api];
"@

# Ejecutar el script (necesitas acceso a SQL)
# Usando Azure Cloud Shell o SQL Server Management Studio
```

---

## 🔑 Configurar Key Vault

### PASO 1: Crear/Configurar Key Vault

```powershell
$keyVaultName = "soundlog-dev-kv"
$resourceGroup = "rg-soundlog-dev"

# El Key Vault ya fue creado por Terraform
# Verificar que existe
az keyvault list --resource-group $resourceGroup --query "[].[name]" -o tsv

# Obtener el URI
$keyVaultUri = az keyvault show \
  --name $keyVaultName \
  --query properties.vaultUri -o tsv

Write-Host "Key Vault URI: $keyVaultUri"
```

### PASO 2: Agregar Permisos al App Service en Key Vault

```powershell
$principalId = az webapp identity show \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api \
  --query principalId -o tsv

# Dar permisos de lectura de secrets
az keyvault set-policy \
  --name soundlog-dev-kv \
  --object-id $principalId \
  --secret-permissions get list

Write-Host "✅ Permisos asignados al App Service"
```

### PASO 3: Agregar Secrets al Key Vault

```powershell
# Agregar database connection string
az keyvault secret set \
  --vault-name soundlog-dev-kv \
  --name "DatabaseConnectionString" \
  --value "mssql+pyodbc://soundlogadmin:PASSWORD@soundlog-dev-sqlserver.database.windows.net/soundlog?driver=ODBC+Driver+17+for+SQL+Server"

# Agregar otros secrets
az keyvault secret set \
  --vault-name soundlog-dev-kv \
  --name "JwtSecretKey" \
  --value "your-secret-key-here"

az keyvault secret set \
  --vault-name soundlog-dev-kv \
  --name "StorageAccountKey" \
  --value "your-storage-key-here"

# Listar secrets
az keyvault secret list --vault-name soundlog-dev-kv
```

---

## 🔄 Migrar Secrets

### PASO 1: Actualizar Code para leer de Key Vault

**backend/core/config.py**

```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Primero intentar variables de ambiente
    # Luego intentar Key Vault (en Azure)
    
    def __init__(self, **data):
        super().__init__(**data)
        
        # En desarrollo, usar .env
        # En producción, usar Key Vault
        if os.getenv("AZURE_KEYVAULT_ENDPOINT"):
            self._load_secrets_from_keyvault()
    
    def _load_secrets_from_keyvault(self):
        """Cargar secrets desde Azure Key Vault"""
        try:
            credential = DefaultAzureCredential()
            vault_url = os.getenv("AZURE_KEYVAULT_ENDPOINT")
            client = SecretClient(vault_url=vault_url, credential=credential)
            
            # Cargar DATABASE_URL desde Key Vault
            if not os.getenv("DATABASE_URL"):
                self.DATABASE_URL = client.get_secret("DatabaseConnectionString").value
            
            # Cargar SECRET_KEY desde Key Vault
            if not os.getenv("SECRET_KEY"):
                self.SECRET_KEY = client.get_secret("JwtSecretKey").value
                
        except Exception as e:
            print(f"⚠️ No se pudo cargar secrets de Key Vault: {e}")
            print("Usando valores de .env")

class Settings(BaseSettings):
    # ... resto de configuración
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
```

### PASO 2: Actualizar App Service Settings

```powershell
# Remover conexión directa a DB
az webapp config appsettings delete \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api \
  --setting-names DATABASE_URL

# Agregar Key Vault URI
az webapp config appsettings set \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api \
  --settings AZURE_KEYVAULT_ENDPOINT="https://soundlog-dev-kv.vault.azure.net/"

# Verificar settings
az webapp config appsettings list \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api
```

### PASO 3: Actualizar requirements.txt

```txt
# Agregar dependencias de Azure
azure-identity>=1.13.0
azure-keyvault-secrets>=4.4.0
```

```powershell
# Redeploy backend
pip install -r backend/requirements.txt
```

---

## 🧪 Testing

### Verificar que funciona

```powershell
# 1. Ver logs del App Service
az webapp log tail \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api

# Debería mostrar:
# "✅ Secrets cargados desde Key Vault"

# 2. Verificar que no hay secrets en app settings
az webapp config appsettings list \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api
# No debe mostrar DATABASE_URL

# 3. Probar la API
curl https://soundlog-dev-api.azurewebsites.net/health
# Debe retornar 200 OK

# 4. Ver que Key Vault fue accedido
az monitor metrics list \
  --resource /subscriptions/{sub}/resourceGroups/rg-soundlog-dev/providers/Microsoft.KeyVault/vaults/soundlog-dev-kv \
  --metric VaultRequests \
  --start-time 2026-04-23T00:00:00Z
```

---

## 🔒 Security Best Practices

### 1. Rotación de Secrets

```powershell
# Crear alerta para rotación mensual
# Cada mes:
az keyvault secret set \
  --vault-name soundlog-dev-kv \
  --name "DatabaseConnectionString" \
  --value "nuevo-valor"

# (La aplicación recuperará el nuevo valor automáticamente)
```

### 2. Audit Logging

```powershell
# Ver quién accedió a Key Vault
az monitor activity-log list \
  --resource-group rg-soundlog-dev \
  --operation-name Microsoft.KeyVault/vaults/secrets/read
```

### 3. Network Security

```powershell
# Restricciones de firewall en Key Vault (opcional)
az keyvault network-rule add \
  --vault-name soundlog-dev-kv \
  --action Allow \
  --ip-address YOUR_IP
```

---

## 📝 Tareas por Implementar

- [ ] Habilitar Managed Identity en App Service
- [ ] Crear usuarios SQL para Managed Identity
- [ ] Agregar permisos en Key Vault
- [ ] Agregar secrets en Key Vault
- [ ] Actualizar código para leer de Key Vault
- [ ] Instalar dependencias de Azure SDK
- [ ] Redeploy del backend
- [ ] Testing y verificación
- [ ] Documentar en archivo README

---

## 📚 Próximos Pasos Avanzados

1. **User-Assigned Managed Identity**
   - Más control granular
   - Compartir entre múltiples recursos

2. **Key Vault Backup & Restore**
   - Disaster recovery
   - Compliance

3. **Private Endpoints**
   - Acceso seguro sin internet público
   - Network isolation

4. **Monitoring & Alerts**
   - Alertas de acceso a Key Vault
   - Detección de anomalías

---

## 📞 Referencia Rápida

```powershell
# Crear/Verificar Managed Identity
az webapp identity assign --resource-group rg-soundlog-dev --name soundlog-dev-api --identities '[system]'

# Agregar secret a Key Vault
az keyvault secret set --vault-name soundlog-dev-kv --name MySecret --value MyValue

# Dar permisos a Managed Identity
az keyvault set-policy --vault-name soundlog-dev-kv --object-id PRINCIPAL_ID --secret-permissions get list

# Ver logs
az webapp log tail --resource-group rg-soundlog-dev --name soundlog-dev-api
```

---

**Fecha:** 2026-04-23
**Versión:** 1.0.0
**Status:** 📋 Ready for Implementation
