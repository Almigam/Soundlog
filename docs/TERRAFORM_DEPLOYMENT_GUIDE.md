# 🚀 Guía Completa: Desplegar Soundlog en Azure con Terraform

**Estado actual:** ✅ Terraform configurado, listo para desplegar
**Tiempo estimado:** 45-60 minutos

---

## 📋 Pre-requisitos

Antes de empezar, necesitas:

```powershell
# 1. Azure CLI instalado
az --version  # Debe mostrar versión 2.50+

# 2. Terraform instalado
terraform --version  # Debe mostrar versión 1.5+

# 3. Estar logueado en Azure
az login
# Te abrirá el navegador para autenticarte

# 4. Seleccionar la suscripción correcta
az account list --query "[].{Name:name, ID:id}"
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

---

## 🔑 PASO 1: Obtener tus IDs de Azure

Necesitas estos valores para el despliegue:

```powershell
# En PowerShell, ejecuta estos comandos y copia los valores:

# ID de suscripción
az account show --query id -o tsv
# Resultado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ID del tenant
az account show --query tenantId -o tsv
# Resultado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Tu ID de usuario (para acceso a Key Vault)
az ad user show --id $(az account show --query user.name -o tsv) --query id -o tsv
# Resultado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Guarda estos valores en un lugar seguro.**

---

## 🔧 PASO 2: Configurar Variables de Terraform

### 2a. Crear archivo `terraform.tfvars`

```powershell
cd infraestructure\terraform

# Copia el archivo de ejemplo
Copy-Item terraform.tfvars.example terraform.tfvars

# Edita terraform.tfvars con tus valores
notepad terraform.tfvars
```

### 2b. Contenido de `terraform.tfvars`

```hcl
subscription_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Tu subscription ID
tenant_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Tu tenant ID

location    = "francecentral"
environment = "dev"
project_name = "soundlog"

# SQL Server - Elige un password fuerte
# Requisitos: 8+ chars, UPPERCASE, números, caracteres especiales
sql_server_admin_login    = "soundlogadmin"
sql_server_admin_password = "P@ssw0rd!Secure2024"  # ⚠️ CAMBIA ESTO

# SKUs (costos)
app_service_plan_sku = "B1"  # B1 = ~€50/mes, S1 = ~€74/mes
sql_database_sku     = "Basic"  # Basic = ~€5/mes

docker_image_url = ""  # Dejar vacío por ahora
```

**⚠️ IMPORTANTE:** 
- Nunca commits `terraform.tfvars` a git (está en `.gitignore`)
- Elige un password fuerte para SQL Server
- Guarda el password en lugar seguro

---

## 🏗️ PASO 3: Validar Terraform Localmente

```powershell
cd infraestructure\terraform

# 1. Inicializar Terraform (crea .terraform/)
terraform init

# 2. Validar la sintaxis
terraform validate
# Debe mostrar: Success! The configuration is valid.

# 3. Ver qué va a crear (plan)
terraform plan -out=tfplan
# Mostrará ~15-20 recursos a crear

# 4. Guardar el plan (lo usaremos después)
# Resultado: archivo "tfplan" creado
```

**Si hay errores:**
- Verifica los valores en `terraform.tfvars`
- Verifica que estés logueado en Azure: `az account show`
- Verifica que los nombres de storage sean únicos globalmente

---

## 🚀 PASO 4: Desplegar en Azure

```powershell
cd infraestructure\terraform

# Aplicar los cambios (crear recursos en Azure)
terraform apply tfplan

# Esto tardará ~10-15 minutos
# Verás un progreso similar a:
# azurerm_resource_group.main: Creating...
# azurerm_resource_group.main: Creation complete after 2s
# azurerm_storage_account.frontend: Creating...
# ... más recursos ...

# Cuando termine, verás los OUTPUTS
# Guarda esta información (especialmente las URLs)
```

**Si algo falla:**
```powershell
# Ver logs más detallados
terraform destroy  # Elimina recursos creados
# Arregla el problema y vuelve a empezar
```

---

## 📊 PASO 5: Verificar el Despliegue

```powershell
# Ver los outputs
terraform output

# Resultado ejemplo:
# backend_api_url = "https://soundlog-dev-api.azurewebsites.net"
# database_name = "soundlog"
# frontend_url = "https://soundlogdevfrontend.z6.web.core.windows.net/"
# images_storage_account_name = "soundlogdevimages"
# resource_group_name = "rg-soundlog-dev"
# sql_server_name = "soundlog-dev-sqlserver"

# Verificar recursos en Azure Portal
az resource list --resource-group rg-soundlog-dev --query "[].{Name:name, Type:type}" -o table

# Resultado debe mostrar todos los recursos creados
```

---

## 🗄️ PASO 6: Configurar la Base de Datos

Ahora que la base de datos SQL está creada, necesitas crear las tablas.

### 6a. Obtener la connection string

```powershell
# Ver la connection string (desde los outputs)
terraform output -raw database_connection_string

# O construirla manualmente:
$server = "soundlog-dev-sqlserver.database.windows.net"
$db = "soundlog"
$user = "soundlogadmin"
# $pass = lo que pusiste en terraform.tfvars
```

### 6b. Agregar tu IP al firewall de SQL

```powershell
# Azure Portal → SQL Servers → soundlog-dev-sqlserver
# → Firewalls and virtual networks
# → Add your client IP

# O vía CLI:
$myIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
az sql server firewall-rule create \
  --resource-group rg-soundlog-dev \
  --server soundlog-dev-sqlserver \
  --name "MyIP" \
  --start-ip-address $myIP \
  --end-ip-address $myIP
```

### 6c. Ejecutar migraciones de Alembic

```powershell
cd backend

# Primero, instala el driver ODBC si no lo tienes
# Windows: msodbcsql17 (viene con SQL Server Management Studio)
# Mac: brew install msodbcsql17
# Linux: sudo apt-get install msodbcsql17

# Crear .env con los datos de Azure
# DATABASE_URL=mssql+pyodbc://soundlogadmin:password@server.database.windows.net/soundlog?driver=ODBC+Driver+17+for+SQL+Server

# Ejecutar migraciones
alembic upgrade head  # Crea las tablas en Azure
# O si usas SQLAlchemy directamente:
python -c "from core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

---

## 🐳 PASO 7: Desplegar el Backend (App Service)

### 7a. Crear Dockerfile (ya está creado)

El Dockerfile está en `backend/Dockerfile` con:
- Python 3.11
- Multi-stage build
- Health check
- Usuario no-root

### 7b. Crear Docker Image

```powershell
cd backend

# Opción A: Usar Docker local (si lo tienes instalado)
docker build -t soundlog-backend:latest .

# Opción B: Usar Azure Container Registry (recomendado)
# 1. Crear registry en Azure
az acr create --resource-group rg-soundlog-dev \
  --name soundlogdevacr \
  --sku Basic

# 2. Build en Azure
az acr build --registry soundlogdevacr \
  --image soundlog-backend:latest .

# 3. Obtener URL
$imageUrl = "soundlogdevacr.azurecr.io/soundlog-backend:latest"
echo $imageUrl
```

### 7c. Actualizar App Service con la imagen

```powershell
# Opción A: Via Terraform (recomendado)
# Edita terraform.tfvars:
docker_image_url = "soundlogdevacr.azurecr.io/soundlog-backend:latest"

# Aplica los cambios
terraform apply

# Opción B: Via Azure CLI
az webapp config container set \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api \
  --docker-custom-image-name soundlogdevacr.azurecr.io/soundlog-backend:latest \
  --docker-registry-server-url https://soundlogdevacr.azurecr.io
```

---

## 🌐 PASO 8: Desplegar el Frontend

### 8a. Build del frontend

```powershell
cd frontend

# Build con Vite
npm run build
# Crea dist/ con los archivos optimizados
```

### 8b. Subir a Azure Storage (Frontend)

```powershell
# Obtener la storage account
$storageAccount = "soundlogdevfrontend"
$resourceGroup = "rg-soundlog-dev"
$containerName = "$web"  # Nombre especial para static websites

# Subir archivos
az storage blob upload-batch \
  --account-name $storageAccount \
  --auth-mode login \
  --source dist \
  --destination $containerName \
  --pattern "*"

# Verificar que se subió
az storage blob list \
  --account-name $storageAccount \
  --container-name $web \
  --output table
```

---

## ✅ PASO 9: Verificar el Despliegue Completo

```powershell
# 1. Verificar Frontend
$frontendUrl = terraform output -raw frontend_url
Start-Process $frontendUrl

# 2. Verificar Backend
$backendUrl = terraform output -raw backend_api_url
Invoke-WebRequest -Uri "$backendUrl/health"

# 3. Verificar Base de Datos
# Azure Portal → SQL Servers → Query editor → SELECT 1

# 4. Verificar Logs
az webapp log tail --resource-group rg-soundlog-dev --name soundlog-dev-api

# Resultado esperado:
# GET /health -> 200 OK
# Frontend en https://soundlogdevfrontend.z6.web.core.windows.net/
# Backend en https://soundlog-dev-api.azurewebsites.net/
```

---

## 🔒 PASO 10: Seguridad Post-Despliegue

### Configurar CORS

```powershell
# En backend/.env
ALLOWED_ORIGINS="https://soundlogdevfrontend.z6.web.core.windows.net,https://soundlog-dev-api.azurewebsites.net"

# Redeploy del backend
az webapp deployment source config-zip \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api \
  --src backend.zip
```

### Habilitar HTTPS

```powershell
# Ya está habilitado por defecto en Azure
# Verificar:
az webapp show --resource-group rg-soundlog-dev --name soundlog-dev-api \
  --query "httpsOnly"
# Resultado: true
```

### Configurar Managed Identity (próximo paso)

```powershell
# Esto lo haremos después para mejorar la seguridad
# Ver: docs/MANAGED_IDENTITY_SETUP.md (lo crearemos pronto)
```

---

## 💰 PASO 11: Monitorear Costos

```powershell
# Ver costos estimados (mensual)
# Azure Portal → Cost analysis

# Recursos creados:
# - Resource Group: Gratis
# - App Service Plan (B1): ~€50/mes
# - SQL Database (Basic): ~€5/mes
# - Storage Accounts (3): ~€20/mes
# - Key Vault: ~€0.60/mes
# TOTAL ESTIMADO: ~€75-80/mes

# Recomendaciones para reducir costos:
# - Usar Free tier si es posible (limites pequeños)
# - Usar dev/test pricing si tienes MSDN
# - Eliminar recursos no usados
```

---

## 🧹 Limpiar (Deshacer despliegue)

Si necesitas eliminar TODO y empezar de nuevo:

```powershell
cd infraestructure\terraform

# ADVERTENCIA: Esto elimina TODOS los recursos, incluyendo datos
terraform destroy

# Confirma escribiendo "yes"

# Elimina archivos locales
rm terraform.tfstate
rm terraform.tfstate.backup
rm -r .terraform
```

---

## 🆘 Troubleshooting

### Problema: "Error: Provider type azurerm is not available"
**Solución:**
```powershell
terraform init -upgrade
```

### Problema: "Storage account name already taken"
**Solución:**
Los nombres de storage accounts deben ser únicos globalmente.
Cambia el nombre en `terraform.tfvars`:
```hcl
# Agrega un sufijo único
project_name = "soundlog123"  # Cambia los números
```

### Problema: "SQL Server connection timeout"
**Solución:**
```powershell
# Verifica que tu IP está en el firewall
az sql server firewall-rule list \
  --resource-group rg-soundlog-dev \
  --server soundlog-dev-sqlserver

# Agrega tu IP actual
$myIP = (Invoke-WebRequest -Uri "https://api.ipify.org").Content
az sql server firewall-rule create \
  --resource-group rg-soundlog-dev \
  --server soundlog-dev-sqlserver \
  --name "MyCurrentIP" \
  --start-ip-address $myIP \
  --end-ip-address $myIP
```

### Problema: "App Service won't start"
**Solución:**
```powershell
# Ver logs
az webapp log tail --resource-group rg-soundlog-dev --name soundlog-dev-api

# Reiniciar app
az webapp restart --resource-group rg-soundlog-dev --name soundlog-dev-api

# Verificar conexión a DB en app settings
az webapp config appsettings list \
  --resource-group rg-soundlog-dev \
  --name soundlog-dev-api
```

### Problema: "A resource with the ID ... already exists" (Key Vault Access Policy)
**Causa:** Azure añade automáticamente una política de acceso para el creador del Key Vault, pero Terraform no la tiene en su archivo de estado.
**Soluciones:**
- **Opción A (Portal):** Ve a Azure Portal -> Key Vault -> Access Policies. Borra la política que corresponde a tu identidad de GitHub Actions y vuelve a ejecutar el workflow.
- **Opción B (CLI):** Importa el recurso manualmente:
  ```powershell
  terraform import azurerm_key_vault_access_policy.terraform_executor /subscriptions/<SUB_ID>/resourceGroups/rg-soundlog-dev/providers/Microsoft.KeyVault/vaults/soundlog-dev-kv/objectId/<OBJECT_ID>
  ```

---

## 📚 Próximos Pasos

1. **Managed Identity** (mejor seguridad)
   - Eliminar secrets de App Service
   - Usar identidades managed para DB access

2. **Key Vault Integration**
   - Guardar secrets en Key Vault
   - Auto-rotate passwords

3. **Monitoring & Alerts**
   - Application Insights
   - Alertas de error
   - Dashboards

4. **Auto-deployment con CI/CD**
   - GitHub Actions → Azure Deployment
   - Auto-update de imagen Docker

---

## 📞 Resumen de Comandos

```powershell
# Quick reference
az login                                    # Conectarse a Azure
terraform init                              # Inicializar
terraform plan -out=tfplan                 # Ver cambios
terraform apply tfplan                     # Aplicar cambios
terraform output                           # Ver outputs
terraform destroy                          # Eliminar todo

# Debugging
terraform state list                       # Ver recursos creados
terraform state show azurerm_resource_group.main  # Detalles de un recurso
terraform refresh                          # Actualizar estado local
```

---

**¡Listo para desplegar! 🚀**

Si tienes problemas en cualquier paso, revisa el troubleshooting o contacta al equipo.

**Fecha de creación:** 2026-04-23
**Versión:** 1.0.0
