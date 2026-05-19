# 🚀 GitHub Actions CI/CD Setup - Terraform

Guía completa para configurar GitHub Actions con Terraform para despliegue automático en Azure.

---

## 📋 Requisitos Previos

✅ Repositorio en GitHub  
✅ Suscripción a Azure  
✅ Azure CLI instalado (para crear Service Principal)  
✅ Permisos de administrador en Azure  

---

## 🔐 1. Crear Service Principal en Azure

El Service Principal permite que GitHub Actions se autentique en Azure.

### Opción A: Usando Azure CLI (Recomendado)

```powershell
# Login en Azure
az login

# Crear Service Principal
$servicePrincipal = az ad sp create-for-rbac `
  --name "github-soundlog-terraform" `
  --role "Contributor" `
  --scopes "/subscriptions/{subscription-id}" `
  --json | ConvertFrom-Json

# Guardar los valores (necesarios para GitHub)
Write-Host "Client ID: $($servicePrincipal.clientId)"
Write-Host "Tenant ID: $($servicePrincipal.tenant)"
Write-Host "Client Secret: $($servicePrincipal.clientSecret)"
Write-Host "Subscription ID: {subscription-id}"
```

### Opción B: Usando Azure Portal

1. Ir a **Azure Active Directory** → **App registrations**
2. Click en **New registration**
3. Nombre: `github-soundlog-terraform`
4. Crear certificado o contraseña (client secret)
5. Ir a **Certificates & secrets** → crear nuevo **Client secret**
6. Copiar los valores

---

## 🔑 2. Agregar Secrets a GitHub

### En GitHub:

1. Ir a tu repositorio
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Crear estos 4 secrets:

```
AZURE_CLIENT_ID         → Valor de clientId
AZURE_CLIENT_SECRET     → Valor de clientSecret (guardar de forma segura)
AZURE_TENANT_ID         → Valor de tenant
AZURE_SUBSCRIPTION_ID   → Tu subscription ID
```

### Cómo obtener Subscription ID:

```powershell
az account show --query "id" -o tsv
```

---

## 🔄 3. Flujo del Workflow

### Cuando haces PUSH a `desarrollo`:
```
✅ Validación (terraform fmt, init, validate)
✅ Seguridad (tfsec scan)
❌ Plan (no ejecuta)
❌ Apply (no ejecuta)
```

### Cuando haces PUSH a `main`:
```
✅ Validación (terraform fmt, init, validate)
✅ Seguridad (tfsec scan)
❌ Plan (no ejecuta)
✅ Apply (EJECUTA AUTOMÁTICAMENTE en producción)
```

### Cuando haces PULL REQUEST a `main`:
```
✅ Validación (terraform fmt, init, validate)
✅ Seguridad (tfsec scan)
✅ Plan (muestra comentario en PR)
❌ Apply (no ejecuta hasta merge)
```

### Cuando ejecutas workflow_dispatch:
```
✅ Validación
✅ Seguridad
❌ Plan (no ejecuta)
✅ Apply (si estás en main)
```

---

## 📊 Workflow de CI/CD

```
┌─────────────────────────────────┐
│  Push / Pull Request / Dispatch │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ 1. Validate & Fmt  │
    │ - terraform fmt    │
    │ - init -backend=no │
    │ - validate         │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ 2. Security Scan   │
    │ - tfsec            │
    │ - SARIF upload     │
    └────────┬───────────┘
             │
    ┌────────┴────────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐      ┌─────────────────┐
│ PR? → PLAN   │      │ Main? → APPLY   │
│ Show comment │      │ Auto-approve    │
└──────────────┘      │ Deploy to prod  │
                      └─────────────────┘
```

---

## 🚀 4. Desplegar Cambios

### Workflow Local:

```powershell
# 1. Crear rama para cambios
git checkout -b feature/terraform-update

# 2. Hacer cambios en infraestructure/terraform/
# Ej: Add new resource, modify settings, etc.

# 3. Validar localmente (opcional)
cd infraestructure/terraform
terraform fmt -recursive
terraform init -backend=false
terraform validate

# 4. Commit y push
git add infraestructure/terraform/
git commit -m "feat(terraform): add/update resources"
git push origin feature/terraform-update

# 5. En GitHub: crear Pull Request → review plan
# 6. Cuando está correcto: merge a main
# 7. GitHub Actions aplica cambios automáticamente
```

### O directamente a main (para cambios pequeños):

```powershell
git checkout main
git pull origin main

# Hacer cambios en infraestructure/terraform/

git add infraestructure/terraform/
git commit -m "feat(terraform): quick update"
git push origin main

# ✅ GitHub Actions aplica automáticamente
```

---

## 📝 5. Estructura del Workflow Explicada

### Job 1: Validate (Siempre ejecuta)
```yaml
✅ terraform fmt -check -recursive
  └─ Verifica que el código tenga formato correcto

✅ terraform init -backend=false
  └─ Inicializa sin backend (para validación)

✅ terraform validate
  └─ Valida sintaxis y configuración
```

### Job 2: Security (Después de validate)
```yaml
✅ tfsec
  └─ Escanea vulnerabilidades de seguridad
  └─ OWASP, CIS benchmarks
  └─ Carga resultados en GitHub Security tab

✅ Upload SARIF
  └─ GitHub muestra vulnerabilidades como alertas
```

### Job 3: Plan (Solo en Pull Requests)
```yaml
✅ terraform plan -out=tfplan
  └─ Simula cambios sin aplicarlos
  └─ Genera plan file

✅ terraform show -json tfplan
  └─ Convierte plan a JSON

✅ Comentario en PR
  └─ Muestra resumen: +X, ~Y, -Z recursos
  └─ Usuarios pueden revisar antes de merge
```

### Job 4: Apply (Solo en main, después de merge)
```yaml
✅ terraform plan -out=tfplan
  └─ Genera plan final

✅ terraform apply -auto-approve tfplan
  └─ Aplica cambios en Azure
  └─ -auto-approve = no pide confirmación

✅ terraform output -json
  └─ Exporta outputs (IPs, URLs, etc.)

✅ GitHub Deployment
  └─ Registra despliegue en GitHub
```

### Job 5: Notify (Si algo falla)
```yaml
✅ Crea Issue en GitHub
  └─ Título: "🚨 Terraform CI/CD Failed"
  └─ Enlace a logs
  └─ Labels: infrastructure, terraform, bug
```

---

## 🔍 6. Monitorear Flujo de Trabajo

### En GitHub:

1. **Actions tab** → ver historial de ejecuciones
2. Click en una ejecución → ver logs detallados
3. **Pull Requests** → ver comentarios con plan

### Logs importantes:

```
✅ terraform init
   └─ Descarga providers, backend
   
✅ terraform plan
   └─ Muestra qué cambiará
   
✅ terraform apply
   └─ Aplica cambios
   
✅ tfsec
   └─ Escanea seguridad
```

### Troubleshooting:

```
❌ Error: "Backend not configured"
   → Añadir variables de Azure a secrets

❌ Error: "Permission denied"
   → Service Principal sin permisos
   → Ir a Azure, agregar rol Contributor

❌ Error: "Invalid credentials"
   → Secrets incorrectos
   → Regenerar en Azure AD
```

---

## 🛡️ 7. Security Best Practices

### ✅ Lo que está implementado:

1. **Secrets en GitHub**
   - No están en código
   - Encriptados en GitHub
   - Solo accesibles en Actions

2. **RBAC en Azure**
   - Service Principal con rol mínimo
   - Solo acceso a recursos necesarios
   - Auditoría en Azure

3. **Scanning de seguridad**
   - tfsec detecta issues
   - SARIF upload a GitHub Security
   - Debe pasar antes de apply

4. **Protección de main**
   - Require pull request reviews
   - Require status checks (validate + security)
   - Require up-to-date branches

5. **Artifacts**
   - Plans guardados 5 días
   - Outputs guardados 30 días
   - Descargables para auditoría

### 🔒 Recomendaciones adicionales:

1. **Proteger rama main en GitHub:**
   ```
   Settings → Branches → Add rule
   - Branch name pattern: main
   - ☑ Require pull request reviews (2+)
   - ☑ Require status checks to pass
   - ☑ Require branches to be up to date
   - ☑ Require approval of reviews
   ```

2. **Habilitar GitHub Security:**
   ```
   Settings → Code security and analysis
   - Enable "Dependabot alerts"
   - Enable "Secret scanning"
   - Enable "Code scanning"
   ```

3. **Rotar Service Principal Secret:**
   ```
   Cada 90 días en Azure AD
   → Generar nuevo secret
   → Actualizar en GitHub Secrets
   → Eliminar antiguo
   ```

---

## 📊 8. Monitorear Costos de Azure

El workflow puede generar costos en Azure. Para monitorear:

1. **Azure Portal** → Cost Management
2. Filtrar por "soundlog" resources
3. Configurar alertas de presupuesto

### Recursos típicos de Soundlog:
- App Service (Backend)
- Static Web App (Frontend)
- SQL Server
- Storage Account
- Key Vault
- Application Insights

---

## 🧪 9. Testing del Workflow

### Test 1: Validación funciona
```powershell
git checkout develop
git pull origin develop

# Crear rama de prueba
git checkout -b test/terraform-validation

# Hacer cambio pequeño (ej: cambiar tag)
# infraestructure/terraform/main.tf
# Cambiar: environment = "dev" → environment = "test"

git add infraestructure/terraform/
git commit -m "test: validate workflow"
git push origin test/terraform-validation

# En GitHub: ir a Actions → ver que valida correctamente
```

### Test 2: Plan funciona en PR
```powershell
# Crear cambio más sustancial
# Ej: agregar output nuevo

git add infraestructure/terraform/
git commit -m "feat(terraform): test plan output"
git push origin test/terraform-validation

# En GitHub: crear PR a main
# Ver que aparece comentario con plan
```

### Test 3: Apply funciona en main
```powershell
# Después de merging a main
git checkout main
git pull origin main

# Verificar que:
# 1. Workflow ejecuta automáticamente
# 2. Validate pasa ✅
# 3. Security pasa ✅
# 4. Apply ejecuta ✅
# 5. Resources creados en Azure ✅
```

---

## 📞 10. Troubleshooting Común

### Problem: "Error: invalid credentials"

**Solución:**
```powershell
# Regenerar Service Principal
az ad sp delete --id $(az ad sp list --display-name "github-soundlog-terraform" --query "[0].appId" -o tsv)

# Crear nuevo
az ad sp create-for-rbac --name "github-soundlog-terraform" --role "Contributor"

# Actualizar secrets en GitHub
```

### Problem: "Error: Backend resource groups does not exist"

**Solución:**
```powershell
# Backend state se guarda en Azure Storage
# Asegurar que existe:

az storage account list -g rg-soundlog-dev

# Si no existe, crear:
az storage account create \
  -n soundlogdevstate \
  -g rg-soundlog-dev \
  -l francecentral \
  --sku Standard_LRS
```

### Problem: "tfsec detects security issues"

**Solución:**
1. Revisar qué issue detectó
2. Arreglar en código Terraform
3. Volver a pushear
4. Workflow reintenta

### Problem: "A resource with the ID ... already exists" (Key Vault Access Policy)

**Causa:** Azure añade automáticamente una política de acceso para el creador del Key Vault, pero Terraform no la tiene en su archivo de estado.

**Solución:**
1. **Opción A (Portal):** Ve a Azure Portal -> Key Vault -> Access Policies. Borra la política que corresponde a tu identidad de GitHub Actions y vuelve a ejecutar el workflow.
2. **Opción B (CLI):** Importa el recurso manualmente:
   ```powershell
   terraform import azurerm_key_vault_access_policy.terraform_executor /subscriptions/<SUB_ID>/resourceGroups/rg-soundlog-dev/providers/Microsoft.KeyVault/vaults/soundlog-dev-kv/objectId/<OBJECT_ID>
   ```

### Problem: "Plan looks correct but worried about apply"

**Solución:**
```powershell
# No mergear a main todavía
# Hacer cambios adicionales en PR
# Cuando esté 100% seguro → merge

# Para rollback:
git revert <commit-hash>
git push origin main
# GitHub Actions apply el revert automáticamente
```

---

## 🎯 Checklist Final

- [ ] Service Principal creado en Azure
- [ ] 4 Secrets agregados en GitHub
- [ ] Rama main protegida con reglas
- [ ] Workflow archivo existe (.github/workflows/terraform.yml)
- [ ] tfsec instalado y funcionando
- [ ] Plan comenta en PRs
- [ ] Apply ejecuta en main
- [ ] Artifacts se guardan
- [ ] Notificaciones de error configuradas

---

**¡Listo para despliegue automático!** 🚀

Para preguntas:
- GitHub Actions Docs: https://docs.github.com/en/actions
- Terraform Azure: https://registry.terraform.io/providers/hashicorp/azurerm
- tfsec: https://aquasecurity.github.io/tfsec/
