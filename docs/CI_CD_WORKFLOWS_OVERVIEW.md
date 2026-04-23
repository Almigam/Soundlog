# 🚀 CI/CD Workflows Overview - Soundlog

Resumen de los 3 workflows automáticos de GitHub Actions implementados.

---

## 📊 Workflows Implementados

### 1. **Terraform CI/CD** (infraestructure/terraform)
**Archivo:** `.github/workflows/terraform.yml`

```
├─ VALIDATE
│  ├─ Format check (terraform fmt)
│  ├─ Init validation (terraform init -backend=false)
│  └─ Config validation (terraform validate)
│
├─ SECURITY (Parallel)
│  └─ tfsec scan + SARIF upload
│
├─ PLAN (Si PR a main)
│  ├─ terraform plan
│  ├─ Genera JSON plan
│  └─ Comentario en PR con cambios
│
└─ APPLY (Si push a main)
   ├─ terraform plan
   ├─ terraform apply -auto-approve
   ├─ terraform output
   └─ Registra deployment

Trigger:
  ✅ Push a main o desarrollo
  ✅ Pull request a main
  ✅ Manual (workflow_dispatch)
```

**¿Cuándo se ejecuta?**
- `push main` → Validate + Security + Apply
- `push desarrollo` → Validate + Security (sin apply)
- `PR a main` → Validate + Security + Plan (comenta en PR)

---

### 2. **Backend CI/CD** (backend)
**Archivo:** `.github/workflows/backend.yml`

```
├─ QUALITY
│  ├─ Black format check
│  ├─ isort imports
│  ├─ Flake8 linting
│  └─ MyPy type checking
│
├─ SECURITY (Parallel)
│  ├─ Bandit scan
│  └─ Safety dependencies
│
├─ TEST (Parallel)
│  ├─ pytest con coverage
│  ├─ Codecov upload
│  └─ HTML reports
│
├─ BUILD (Si main + tests pass)
│  ├─ Docker build
│  └─ Push a Docker Hub
│
└─ NOTIFY
   └─ Comentario en PR con resultados

Trigger:
  ✅ Push a main o desarrollo (cambios en backend/)
  ✅ Pull request (cambios en backend/)
```

**¿Cuándo se ejecuta?**
- `push` → Quality + Security + Test + Build Docker
- `PR` → Quality + Security + Test + Comenta resultados

---

### 3. **Frontend CI/CD** (frontend)
**Archivo:** `.github/workflows/frontend.yml`

```
├─ LINT
│  ├─ ESLint
│  ├─ TypeScript check
│  └─ Prettier format
│
├─ SECURITY (Parallel)
│  ├─ npm audit
│  └─ Snyk scan
│
├─ BUILD (Parallel)
│  ├─ npm build
│  ├─ SBOM generation
│  └─ Upload artifact
│
├─ LIGHTHOUSE (Parallel)
│  └─ Performance audit
│
├─ DEPLOY (Si main)
│  ├─ Download artifact
│  └─ Azure Static Web Apps
│
└─ NOTIFY
   └─ Comentario en PR

Trigger:
  ✅ Push a main o desarrollo (cambios en frontend/)
  ✅ Pull request (cambios en frontend/)
```

**¿Cuándo se ejecuta?**
- `push` → Lint + Security + Build + Lighthouse + Deploy
- `PR` → Lint + Security + Build + Lighthouse + Comenta resultados

---

## 📈 Flujo Completo de Desarrollo

```
Developer                GitHub              CI/CD Actions           Azure
   │                        │                     │                    │
   ├─ Create feature branch─>│                     │                    │
   │                        │                     │                    │
   ├─ Push changes─────────>│                     │                    │
   │                        ├─ Trigger workflow──>│                    │
   │                        │                     ├─ Validate          │
   │                        │                     ├─ Lint/Quality      │
   │                        │                     ├─ Security Scan     │
   │                        │                     ├─ Test              │
   │                        │                     ├─ Build             │
   │                        │                     │                    │
   │                        │ <── Comment PR ─────┤                    │
   │                        │ with results        │                    │
   │                        │                     │                    │
   ├─ Create PR────────────>│                     │                    │
   │                        │ ── Request Review ─>│                    │
   │                        │                     │                    │
   ├─ Review & Approve────>│                     │                    │
   │                        │                     │                    │
   ├─ Merge to main────────>│                     │                    │
   │                        ├─ Trigger workflow──>│                    │
   │                        │                     ├─ Validate ✅       │
   │                        │                     ├─ Security ✅       │
   │                        │                     ├─ Apply Terraform──>│ Deploy
   │                        │                     ├─ Build Backend────>│ Docker
   │                        │                     ├─ Deploy Frontend──>│ Static Web
   │                        │                     │                    │
   │                        │ <── Notification ───┤                    │
   │                        │ Deployment success  │                    │
   │                        │                     │                    │
```

---

## 🔐 Secrets Necesarios en GitHub

### Para Terraform:
```
AZURE_CLIENT_ID         ← Service Principal ID
AZURE_CLIENT_SECRET     ← Service Principal Secret
AZURE_TENANT_ID         ← Azure Tenant ID
AZURE_SUBSCRIPTION_ID   ← Azure Subscription
```

### Para Backend (Docker):
```
DOCKER_USERNAME         ← Docker Hub username
DOCKER_PASSWORD         ← Docker Hub token
```

### Para Frontend (Snyk):
```
SNYK_TOKEN              ← Snyk security token (opcional)
```

### Para Frontend (Azure):
```
AZURE_STATIC_WEB_APPS_TOKEN  ← Static Web Apps token
```

---

## 📝 Protecciones en Rama main

Recomendaciones para GitHub:

```yaml
Settings → Branches → Add rule

Branch name pattern: main

✅ Require a pull request before merging
   - Required number of approvals: 2
   - Dismiss stale pull request approvals: Yes

✅ Require status checks to pass before merging
   - Required checks:
     - validate (terraform)
     - quality (backend)
     - security (backend)
     - test (backend)
     - build (backend)
     - lint (frontend)
     - security (frontend)
     - build (frontend)

✅ Require branches to be up to date before merging

✅ Include administrators
```

---

## 🔄 Matriz de Ejecución

| Evento | Rama | Terraform | Backend | Frontend |
|--------|------|-----------|---------|----------|
| Push | main | ✅ Full | ✅ Build | ✅ Deploy |
| Push | dev | ✅ Validate | ✅ Build | ✅ Build |
| PR | main | ✅ Plan | ✅ Test | ✅ Test |
| PR | dev | ❌ | ✅ Test | ✅ Test |

---

## 📊 Tiempo de Ejecución Típico

```
Terraform CI/CD:
├─ Validate:         30 segundos
├─ Security:         1 minuto
├─ Plan (opcional):  2 minutos
└─ Apply:            5-10 minutos
   Total: ~15-20 minutos en main

Backend CI/CD:
├─ Lint:             1 minuto
├─ Security:         2 minutos
├─ Test:             3-5 minutos
└─ Docker Build:     5-10 minutos
   Total: ~15 minutos

Frontend CI/CD:
├─ Lint:             1 minuto
├─ Security:         2 minutos
├─ Build:            2-3 minutos
├─ Lighthouse:       3-5 minutos
└─ Deploy:           1-2 minutos
   Total: ~10 minutos
```

---

## 🧪 Testing Workflows

### Test 1: Terraform Workflow
```powershell
git checkout -b test/terraform
# Editar un archivo en infraestructure/terraform/
git add infraestructure/terraform/
git commit -m "test: terraform workflow"
git push origin test/terraform
# Crear PR a main
# Verificar que aparece plan en PR
```

### Test 2: Backend Workflow
```powershell
git checkout -b test/backend
# Editar un archivo en backend/
git add backend/
git commit -m "test: backend workflow"
git push origin test/backend
# Crear PR a main
# Verificar que se ejecutan linters y tests
```

### Test 3: Frontend Workflow
```powershell
git checkout -b test/frontend
# Editar un archivo en frontend/
git add frontend/
git commit -m "test: frontend workflow"
git push origin test/frontend
# Crear PR a main
# Verificar que se ejecutan linters y build
```

---

## 🆘 Troubleshooting

### Problema: Workflow no se ejecuta
**Solución:**
- Verificar que el archivo YAML está en `.github/workflows/`
- Verificar que el nombre es válido
- Verificar que el `on:` tiene triggers correctos

### Problema: "Error: invalid credentials"
**Solución:**
- Ir a Settings → Secrets and variables → Actions
- Verificar que los secrets están correctamente nombrados
- Regenerar tokens si es necesario

### Problema: "Terraform lock timeout"
**Solución:**
- Alguien está ejecutando terraform en otra rama
- Esperar a que termine o forzar unlock:
```powershell
cd infraestructure/terraform
terraform force-unlock <lock-id>
```

### Problema: Tests fallan en CI pero pasan localmente
**Solución:**
- Diferencias en entorno (variables, servicios)
- Agregar logs para debugging
- Usar `continue-on-error: true` para no bloquear

---

## 📞 Comandos Útiles

### Ver logs de workflow:
```
GitHub → Actions → Workflow name → Click run
```

### Cancelar workflow en ejecución:
```
GitHub → Actions → En ejecución → Cancel workflow
```

### Re-ejecutar workflow:
```
GitHub → Actions → Workflow → Re-run all jobs
```

### Download artifacts:
```
GitHub → Actions → Workflow run → Artifacts
```

### Manual trigger (workflow_dispatch):
```
GitHub → Actions → Workflow → Run workflow
```

---

## 📚 Documentación Adicional

- [Terraform CI/CD Setup](./CI_CD_SETUP.md) - Detalles de Terraform
- [Backend CI/CD Details](./BACKEND_CI_CD.md) - Detalles de Backend
- [Frontend CI/CD Details](./FRONTEND_CI_CD.md) - Detalles de Frontend

---

**Listo para automático despliegue! 🚀**

Para preguntas:
- GitHub Actions Docs: https://docs.github.com/en/actions
- Terraform: https://terraform.io/docs
- Azure DevOps: https://docs.microsoft.com/en-us/azure/devops/
