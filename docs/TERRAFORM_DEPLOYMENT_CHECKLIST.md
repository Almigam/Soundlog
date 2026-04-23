# ✅ Checklist: Despliegue de Soundlog en Azure

## 🎯 Estado Actual

**Fecha:** 2026-04-23
**Proyecto:** Soundlog
**Ambiente:** Desarrollo

---

## 📋 FASE 1: Preparación (✅ COMPLETADO)

### Infraestructura como Código

- [x] **providers.tf** - Configuración de Azure provider
  - ✅ Azure provider ~3.90
  - ✅ Features configuradas (resource group, key vault)
  
- [x] **variables.tf** - Variables de entrada
  - ✅ Subscription ID
  - ✅ Tenant ID
  - ✅ Location, environment
  - ✅ SQL Server credentials
  - ✅ App Service SKU
  - ✅ Validaciones de entrada

- [x] **main.tf** - Recursos principales
  - ✅ Resource Group
  - ✅ Storage Account (Frontend)
  - ✅ Storage Account (Images)
  - ✅ Storage Containers (3)
  - ✅ SQL Server + Database
  - ✅ App Service Plan
  - ✅ Linux Web App
  - ✅ Key Vault
  - ✅ Firewall rules

- [x] **outputs.tf** - Valores de salida
  - ✅ URLs (frontend, backend, storage)
  - ✅ Nombres de recursos
  - ✅ Connection strings (sensibles)
  - ✅ Summary output

- [x] **backend.tf** - State management
  - ✅ Backend local (para inicio)
  - ✅ Opción de backend remoto (comentada)
  - ✅ Documentación clara

### Configuración

- [x] **terraform.tfvars.example** - Plantilla de variables
  - ✅ Todos los parámetros
  - ✅ Valores por defecto
  - ✅ Comentarios explicativos

- [x] **.gitignore** - Archivos sensibles
  - ✅ terraform.tfvars (no commitear)
  - ✅ *.tfstate (no commitear)
  - ✅ .terraform/ (no commitear)

### Backend

- [x] **Dockerfile** - Containerización
  - ✅ Python 3.11
  - ✅ Multi-stage build
  - ✅ Health check
  - ✅ Usuario no-root

### Documentación

- [x] **TERRAFORM_DEPLOYMENT_GUIDE.md** - Guía paso a paso
  - ✅ 11 pasos detallados
  - ✅ Troubleshooting
  - ✅ Post-deployment

- [x] **MANAGED_IDENTITY_SETUP.md** - Seguridad avanzada
  - ✅ Managed Identity
  - ✅ Key Vault
  - ✅ Secret rotation

- [x] **infraestructure/terraform/README.md** - Referencia
  - ✅ Estructura de archivos
  - ✅ Quick start
  - ✅ Comandos útiles

### Automatización

- [x] **deploy.ps1** - Script PowerShell
  - ✅ Pre-requisitos check
  - ✅ Obtener IDs de Azure
  - ✅ Crear terraform.tfvars
  - ✅ terraform init
  - ✅ terraform plan
  - ✅ terraform apply
  - ✅ Mostrar outputs

---

## 🚀 FASE 2: Despliegue (⏳ SIGUIENTE)

### Pre-despliegue

- [ ] **Verificar pre-requisitos**
  - [ ] Azure CLI instalado
  - [ ] Terraform instalado
  - [ ] Estar logueado en Azure (`az login`)

- [ ] **Obtener IDs de Azure**
  - [ ] Subscription ID
  - [ ] Tenant ID
  - [ ] Guardar en lugar seguro

- [ ] **Configurar variables**
  - [ ] Crear `terraform.tfvars` (desde el ejemplo)
  - [ ] Establecer todos los valores
  - [ ] Usar password fuerte para SQL

### Despliegue

- [ ] **Ejecutar script de despliegue**
  ```powershell
  cd infraestructure\terraform
  .\deploy.ps1
  ```
  - [ ] terraform init ✅
  - [ ] terraform validate ✅
  - [ ] terraform plan -out=tfplan ✅
  - [ ] terraform apply tfplan ⏳

- [ ] **Verificar despliegue**
  - [ ] Recursos aparecen en Azure Portal
  - [ ] Outputs se muestran correctamente
  - [ ] Guardar outputs en archivo

### Post-despliegue inmediato

- [ ] **Firewall de SQL**
  - [ ] Agregar tu IP al firewall
  - [ ] Verificar conexión a SQL

- [ ] **Base de datos**
  - [ ] Crear tablas (Alembic o SQLAlchemy)
  - [ ] Verificar conexión desde backend

---

## 🐳 FASE 3: Backend Deployment (⏳ SIGUIENTE)

### Docker Image

- [ ] **Build Docker image**
  ```powershell
  docker build -t soundlog-backend:latest backend/
  ```

- [ ] **Push a registro (elige una opción)**
  - [ ] A) Docker Hub
    ```powershell
    docker tag soundlog-backend:latest USERNAME/soundlog-backend:latest
    docker push USERNAME/soundlog-backend:latest
    ```
  - [ ] B) Azure Container Registry
    ```powershell
    az acr build --registry soundlogdevacr \
      --image soundlog-backend:latest backend/
    ```

### Despliegue en App Service

- [ ] **Actualizar App Service**
  - [ ] Editar `terraform.tfvars` con URL de imagen
  - [ ] `docker_image_url = "..."`
  - [ ] `terraform apply`
  - [ ] O via Azure CLI

- [ ] **Verificar despliegue**
  - [ ] App Service inicia sin errores
  - [ ] Ver logs: `az webapp log tail`
  - [ ] Verificar health: `curl https://api-url/health`

---

## 🎨 FASE 4: Frontend Deployment (⏳ SIGUIENTE)

### Build

- [ ] **Build frontend**
  ```powershell
  cd frontend
  npm run build
  ```

### Upload a Storage

- [ ] **Subir archivos estáticos**
  ```powershell
  az storage blob upload-batch \
    --account-name soundlogdevfrontend \
    --source dist \
    --destination '$web'
  ```

- [ ] **Verificar**
  - [ ] Frontend accesible desde URL
  - [ ] Puede conectar a backend

---

## 🔐 FASE 5: Seguridad Avanzada (⏳ FUTURO)

### Managed Identity

- [ ] **Habilitar Managed Identity**
  ```powershell
  az webapp identity assign \
    --resource-group rg-soundlog-dev \
    --name soundlog-dev-api \
    --identities '[system]'
  ```

- [ ] **Configurar permisos en SQL**
  - [ ] Crear usuario SQL con Managed Identity
  - [ ] Asignar roles

### Key Vault

- [ ] **Agregar secrets a Key Vault**
  - [ ] DatabaseConnectionString
  - [ ] JwtSecretKey
  - [ ] StorageAccountKey

- [ ] **Dar permisos al App Service**
  - [ ] Secret GET
  - [ ] Secret LIST

- [ ] **Actualizar código**
  - [ ] Usar `DefaultAzureCredential`
  - [ ] Leer secrets desde Key Vault
  - [ ] Remover secrets de app settings

---

## 📊 Recursos Creados

Cuando completes el despliegue, tendrás:

```
Azure Subscription
├── Resource Group: rg-soundlog-dev
│   ├── Storage Account: soundlogdevfrontend
│   │   └── Static website ($web container)
│   ├── Storage Account: soundlogdevimages
│   │   ├── profile-pictures
│   │   ├── album-covers
│   │   └── song-covers
│   ├── SQL Server: soundlog-dev-sqlserver
│   │   └── Database: soundlog
│   ├── App Service Plan: soundlog-dev-plan (B1)
│   │   └── Web App: soundlog-dev-api
│   └── Key Vault: soundlog-dev-kv
└── URLs resultantes:
    ├── Frontend: https://soundlogdevfrontend.z6.web.core.windows.net/
    ├── Backend: https://soundlog-dev-api.azurewebsites.net/
    ├── SQL: soundlog-dev-sqlserver.database.windows.net
    └── Key Vault: https://soundlog-dev-kv.vault.azure.net/
```

---

## 💰 Costos Estimados

| Recurso | SKU | Costo/mes |
|---------|-----|-----------|
| App Service | B1 | €50 |
| SQL Database | Basic | €5 |
| Storage (3 accounts) | Standard | €20 |
| Key Vault | Standard | €0.60 |
| **TOTAL** | | **€75.60** |

---

## 📚 Documentos de Referencia

### Principales

1. **TERRAFORM_DEPLOYMENT_GUIDE.md** ← 📍 LEER PRIMERO
   - 11 pasos detallados
   - Troubleshooting
   - SQL setup

2. **infraestructure/terraform/README.md**
   - Quick reference
   - Comandos útiles
   - Variables

3. **MANAGED_IDENTITY_SETUP.md** ← 📍 LEER DESPUÉS
   - Secured secrets
   - Key Vault integration
   - Best practices

### Secundarios

4. **CI_CD_SETUP.md** (para CI/CD automation)
5. **CI_CD_WORKFLOWS_OVERVIEW.md** (para GitHub Actions)
6. **SECURITY.md** (para security hardening)

---

## 🎯 Próximos Pasos

### AHORA (Hoy)

```
1. Leer: TERRAFORM_DEPLOYMENT_GUIDE.md
2. Ejecutar: .\deploy.ps1
3. Esperar: ~15 minutos (deploy)
4. Verificar: Recursos en Azure Portal
```

### DESPUÉS (Mañana)

```
1. Configurar firewall de SQL
2. Crear tablas en DB
3. Build Dockerfile
4. Subir imagen a registry
5. Actualizar App Service
```

### LUEGO (Próxima semana)

```
1. Desplegar frontend
2. Implementar Managed Identity
3. Configurar Key Vault
4. Testing seguridad
```

---

## ✅ Checklist Pre-Deploy

Antes de ejecutar `terraform apply`:

- [ ] ¿Tienes Azure CLI instalado?
- [ ] ¿Tienes Terraform instalado?
- [ ] ¿Estás logueado en Azure? (`az account show`)
- [ ] ¿Tienes terraform.tfvars configurado?
- [ ] ¿El password de SQL es fuerte?
- [ ] ¿Guardaste los IDs de Azure?
- [ ] ¿Tienes .gitignore actualizado?
- [ ] ¿Leíste TERRAFORM_DEPLOYMENT_GUIDE.md?

---

## 🆘 Ayuda Rápida

| Problema | Solución |
|----------|----------|
| "Provider type not available" | `terraform init -upgrade` |
| "Authentication failed" | `az login` |
| "Validation errors" | Revisar `terraform.tfvars` |
| "Resource already exists" | Cambiar names (ej: project_name) |
| "App Service won't start" | Ver logs: `az webapp log tail` |
| "SQL connection timeout" | Agregar IP al firewall |

---

## 📞 Soporte

Para preguntas o problemas:

1. **Documentación:** Lee los archivos `.md` en `docs/`
2. **Terraform Docs:** https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs
3. **Azure Docs:** https://docs.microsoft.com/en-us/azure/

---

**Estado:** ✅ LISTO PARA DESPLEGAR
**Versión:** 1.0.0
**Última actualización:** 2026-04-23
