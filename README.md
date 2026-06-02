# Soundlog

Soundlog es una plataforma web de reseñas musicales. Los usuarios pueden registrarse, importar albumes desde Spotify, calificar canciones y albumes, escribir resenas, seguir a otros usuarios y explorar el catalogo musical de la comunidad.

---

## Tabla de contenidos

- [Descripcion general](#descripcion-general)
- [Arquitectura del sistema](#arquitectura-del-sistema)
- [Tecnologias](#tecnologias)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Infraestructura en Azure](#infraestructura-en-azure)
- [Flujo de autenticacion](#flujo-de-autenticacion)
- [Endpoints de la API](#endpoints-de-la-api)
- [CI/CD y workflows de GitHub Actions](#cicd-y-workflows-de-github-actions)
- [Variables de entorno](#variables-de-entorno)
- [Instalacion y ejecucion local](#instalacion-y-ejecucion-local)
- [Testing](#testing)
- [Seguridad](#seguridad)

---

## Descripcion general

Soundlog permite a los usuarios llevar un diario personal de musica. Las funcionalidades principales son:

- Registro e inicio de sesion con autenticacion JWT (access token + refresh token).
- Busqueda e importacion de albumes desde la API de Spotify, incluyendo todas sus canciones con duracion.
- Calificacion de albumes y canciones con puntuacion del 1 al 5 y comentario opcional.
- Visualizacion de resenas de la comunidad en la pagina de cada album.
- Perfil de usuario con historial de resenas, edicion de nombre, foto de perfil y estadisticas.
- Seguimiento de otros usuarios (follow/unfollow).
- Busqueda de usuarios por nombre de usuario o nombre completo.

---

## Arquitectura del sistema

El sistema sigue una arquitectura de tres capas desacopladas:

```
Usuario (navegador)
        |
        v
Frontend (React + TypeScript)
  - Servido como sitio estatico desde Azure Blob Storage
  - Se comunica con el backend a traves de HTTPS
        |
        v
Backend (FastAPI + Python)
  - Desplegado en Azure App Service (Linux, Python 3.11)
  - API REST con autenticacion JWT
  - Middleware de seguridad, rate limiting y audit logging
  - Lee secretos desde Azure Key Vault
        |
        v
Base de datos (Azure SQL Database / SQL Server)
  - Tablas: users, albums, songs, reviews, user_follows
        |
        v
Servicios externos
  - Azure Blob Storage (imagenes de perfil y portadas)
  - Spotify API (busqueda e importacion de albumes)
  - Azure Application Insights (telemetria y monitoreo)
  - Azure Key Vault (gestion de secretos)
```

La infraestructura completa esta definida como codigo en Terraform y se gestiona mediante pipelines de GitHub Actions con autenticacion OIDC (sin contraseñas estaticas).

---

## Tecnologias

### Backend
| Componente | Tecnologia |
|---|---|
| Framework web | FastAPI 0.104.1 |
| ORM | SQLAlchemy 2.0.23 |
| Base de datos | Azure SQL Database (MSSQL) / SQLite (tests) |
| Autenticacion | JWT con python-jose, bcrypt 12 rondas |
| Servidor | Uvicorn / startup.sh en Azure |
| API externa | Spotipy 2.23.0 (Spotify) |
| Monitoreo | azure-monitor-opentelemetry |
| Testing | pytest, pytest-asyncio, pytest-cov |

### Frontend
| Componente | Tecnologia |
|---|---|
| Framework | React 18.2 con TypeScript 5.2 |
| Bundler | Vite 8 |
| Enrutamiento | React Router DOM 6 |
| HTTP client | Axios 1.6 con interceptores JWT |
| Monitoreo | Azure Application Insights Web SDK |
| Testing | Vitest + Testing Library |
| Linting | ESLint con plugins de React y TypeScript |

### Infraestructura
| Componente | Servicio |
|---|---|
| Frontend hosting | Azure Blob Storage (static website) |
| Backend hosting | Azure App Service (Linux B1) |
| Base de datos | Azure SQL Database (Basic) |
| Secretos | Azure Key Vault |
| Imagenes | Azure Blob Storage (contenedores publicos) |
| Monitoreo | Azure Application Insights + Log Analytics |
| IaC | Terraform 1.7+ con provider azurerm ~3.90 |
| CI/CD | GitHub Actions con OIDC |
| Escaneo de secretos | Gitleaks |

---

## Estructura del repositorio

```
soundlog/
|-- backend/                        # API REST en FastAPI
|   |-- core/
|   |   |-- config.py               # Configuracion y validaciones con Pydantic Settings
|   |   |-- database.py             # Engine de SQLAlchemy y sesion
|   |   |-- models.py               # Modelos ORM: User, Album, Song, Review, UserFollow
|   |   |-- schemas.py              # Esquemas Pydantic de entrada y salida
|   |   |-- security.py             # JWT, hashing de contraseñas, dependencias de auth
|   |   |-- security_utils.py       # Validadores: email, username, password, rate limiter
|   |   |-- security_middleware.py  # Middleware: headers, rate limit, audit log, sanitizacion
|   |   |-- logging_config.py       # Logging con rotacion de archivos
|   |   |-- blob_storage.py         # Servicio de Azure Blob Storage con fallback local
|   |   |-- spotify.py              # Servicio de busqueda e importacion de Spotify
|   |   `-- seed_data.py            # Datos iniciales del catalogo
|   |-- routes/
|   |   |-- auth.py                 # Registro, login, refresh, verify
|   |   |-- users.py                # Perfil, avatar, busqueda, follow/unfollow
|   |   |-- albums.py               # CRUD de albumes
|   |   |-- songs.py                # CRUD de canciones
|   |   |-- reviews.py              # CRUD de resenas de albumes y canciones
|   |   |-- external.py             # Busqueda e importacion desde Spotify
|   |   `-- admin.py                # Seed del catalogo y mantenimiento
|   |-- tests/
|   |   |-- conftest.py             # Fixtures de base de datos en memoria y cliente HTTP
|   |   |-- test_health.py          # Tests de endpoints de salud
|   |   |-- test_auth.py            # Tests de registro, login y errores de autenticacion
|   |   |-- test_reviews.py         # Tests del ciclo completo de resenas
|   |   `-- test_seed.py            # Tests unitarios del seed del catalogo
|   |-- scripts/
|   |   |-- run_ci_checks.py        # Script multiplataforma que replica el CI (flake8 + pytest)
|   |   `-- check.ps1               # Equivalente para PowerShell en Windows
|   |-- main.py                     # Punto de entrada, middleware, routers, health checks
|   |-- startup.sh                  # Script de arranque para Azure App Service
|   |-- requirements.txt            # Dependencias de produccion
|   |-- requirements-dev.txt        # Dependencias adicionales para desarrollo y CI
|   |-- pytest.ini                  # Configuracion de pytest
|   `-- .flake8                     # Configuracion de linting
|
|-- frontend/                       # SPA en React + TypeScript
|   |-- src/
|   |   |-- api/
|   |   |   |-- client.ts           # Instancia de Axios con interceptores de auth y refresh
|   |   |   |-- index.ts            # Funciones de API agrupadas por recurso
|   |   |   `-- monitoring.ts       # Inicializacion de Application Insights
|   |   |-- components/
|   |   |   |-- Navbar.tsx          # Barra de navegacion con menu responsive
|   |   |   |-- Navbar.test.tsx     # Tests de la Navbar
|   |   |   |-- AlbumCard.tsx       # Tarjeta de album con imagen y overlay
|   |   |   |-- AlbumTags.tsx       # Etiquetas de genero de un album
|   |   |   |-- ProtectedRoute.tsx  # Componente que requiere autenticacion
|   |   |   `-- SearchModal.tsx     # Modal de busqueda e importacion desde Spotify
|   |   |-- context/
|   |   |   `-- AuthContext.tsx     # Contexto global de autenticacion con verificacion al inicio
|   |   |-- hooks/
|   |   |   `-- useAuth.ts          # Hook para consumir AuthContext
|   |   |-- pages/
|   |   |   |-- Home.tsx            # Pagina principal con albumes destacados
|   |   |   |-- Login.tsx           # Formulario de inicio de sesion
|   |   |   |-- Register.tsx        # Formulario de registro con validacion
|   |   |   |-- AlbumsList.tsx      # Listado paginado de albumes
|   |   |   |-- AlbumDetail.tsx     # Detalle de album con canciones y resenas
|   |   |   |-- SongsList.tsx       # Listado paginado de canciones
|   |   |   |-- Profile.tsx         # Perfil propio con resenas y edicion
|   |   |   `-- Users.tsx           # Busqueda y seguimiento de usuarios
|   |   |-- styles/                 # Archivos CSS por componente y pagina
|   |   `-- utils/
|   |       `-- mediaUrl.ts         # Resolucion de URLs relativas del backend
|   |-- index.html
|   |-- vite.config.ts
|   |-- tsconfig.json
|   `-- package.json
|
|-- infraestructure/
|   `-- terraform/
|       |-- main.tf                 # Todos los recursos de Azure
|       |-- variables.tf            # Declaracion de variables sensibles
|       |-- outputs.tf              # Salidas: URLs, FQDNs
|       |-- providers.tf            # Configuracion del provider azurerm
|       `-- backend.tf              # Backend remoto en Azure Storage
|
|-- .github/
|   `-- workflows/
|       |-- backend.yml             # CI/CD del backend: tests + deploy a App Service
|       |-- frontend.yml            # CI/CD del frontend: build + deploy a Blob Storage
|       |-- terraform.yml           # Plan y apply de infraestructura
|       |-- Pr.yml                  # Checks en pull requests (lint, tests, terraform plan)
|       `-- secret-scan.yml         # Escaneo de secretos con Gitleaks
|
|-- docs/
|   |-- README_SECURITY.md          # Documentacion de la arquitectura de seguridad
|   `-- TESTING.md                  # Estrategia y configuracion de tests
|
|-- .pre-commit-config.yaml         # Hooks de pre-commit (gitleaks, flake8, pytest, eslint, vitest)
`-- .gitignore
```

---

## Infraestructura en Azure

Todos los recursos se crean con Terraform y se despliegan desde GitHub Actions. La autenticacion con Azure usa OIDC (OpenID Connect) a traves de una Managed Identity, eliminando la necesidad de contraseñas o tokens estaticos.

### Recursos creados

**Resource Group:** `rg-soundlog-dev` en `francecentral`

**Storage Accounts:**
- `soundlogdevfrontend`: Aloja el build de React como sitio web estatico. El contenedor `$web` se actualiza en cada push a `desarrollo`.
- `soundlogdevimages`: Contiene los contenedores `profile-pictures` y `album-covers` con acceso publico a blobs para mostrar imagenes en la interfaz.

**SQL Server y base de datos:**
- Servidor: `soundlog-sql-server` (SQL Server 12.0)
- Base de datos: `soundlog` con SKU Basic
- Regla de firewall para permitir el acceso desde servicios internos de Azure.

**App Service:**
- Plan: `soundlog-backend-plan` (Linux, B1)
- Aplicacion: `soundlog-backend` con Python 3.11
- System Assigned Managed Identity para leer secretos del Key Vault sin credenciales.
- El arranque usa `startup.sh`, que limpia cache de Python, instala dependencias y lanza Uvicorn.

**Key Vault:** `soundlog-dev-kv`
Almacena los siguientes secretos que el backend lee al arrancar:
- `DATABASE-URL`: Connection string de SQL Server con pyodbc.
- `SECRET-KEY`: Clave para firmar tokens JWT.
- `STORAGE-ACCOUNT-KEY` y `STORAGE-ACCOUNT-NAME`: Acceso al storage de imagenes.
- `ALLOWED-ORIGINS`: URL del frontend para la configuracion de CORS.
- `SPOTIFY-CLIENT-ID` y `SPOTIFY-CLIENT-SECRET`: Credenciales de la API de Spotify.
- `APPLICATION-INSIGHTS-CONNECTION-STRING`: Para telemetria.

**Monitoreo:**
- Log Analytics Workspace: `soundlog-law` (retencion 30 dias)
- Application Insights: `soundlog-app-insights` (tipo web, workspace-based)

---

## Flujo de autenticacion

El sistema utiliza una estrategia de doble token:

1. El usuario envia credenciales a `POST /api/v1/auth/login`.
2. El backend valida las credenciales contra la base de datos con bcrypt (12 rondas).
3. Se emiten dos tokens JWT:
   - Access token: valido 30 minutos, firmado con HS256.
   - Refresh token: valido 7 dias.
4. El frontend almacena ambos tokens en `localStorage`.
5. Cada peticion incluye el access token en la cabecera `Authorization: Bearer`.
6. El interceptor de Axios detecta respuestas 401 y usa el refresh token para obtener un nuevo access token sin que el usuario tenga que volver a iniciar sesion.
7. Si el refresh token tambien ha expirado, se limpia el estado y se redirige al login.
8. Al arrancar la aplicacion, `AuthContext` verifica el token almacenado llamando a `GET /api/v1/auth/verify`.

El rate limiter del endpoint de login bloquea a un usuario o IP tras 5 intentos fallidos durante 15 minutos.

---

## Endpoints de la API

La documentacion interactiva de Swagger esta disponible en `/api/docs` en entornos que no sean produccion.

### Autenticacion `/api/v1/auth`

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| POST | `/register` | Registrar nuevo usuario | No |
| POST | `/login` | Iniciar sesion (form-data: username, password) | No |
| POST | `/refresh` | Obtener nuevo access token con el refresh token | Refresh token |
| POST | `/verify` | Verificar validez del access token actual | Access token |

### Usuarios `/api/v1/users`

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/me` | Obtener perfil del usuario autenticado | Si |
| PATCH | `/me` | Actualizar nombre completo o foto de perfil | Si |
| DELETE | `/me` | Eliminar cuenta propia | Si |
| POST | `/me/avatar` | Subir foto de perfil (multipart/form-data) | Si |
| GET | `/search?q=` | Buscar usuarios por username o nombre | No |
| GET | `/{username}` | Obtener perfil publico de un usuario | No |
| POST | `/{username}/follow` | Seguir a un usuario | Si |
| DELETE | `/{username}/follow` | Dejar de seguir a un usuario | Si |
| GET | `/{username}/followers/count` | Numero de seguidores de un usuario | No |

### Albumes `/api/v1/albums`

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/` | Listar albumes (params: skip, limit) | No |
| GET | `/{album_id}` | Obtener un album por ID | No |
| POST | `/` | Crear un album manualmente | Si |
| PATCH | `/{album_id}` | Actualizar campos de un album | Si |
| DELETE | `/{album_id}` | Eliminar un album | Si |

### Canciones `/api/v1/songs`

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/` | Listar canciones (params: skip, limit, album_id) | No |
| GET | `/{song_id}` | Obtener una cancion por ID | No |
| POST | `/` | Crear una cancion manualmente | Si |
| PATCH | `/{song_id}` | Actualizar una cancion | Si |
| DELETE | `/{song_id}` | Eliminar una cancion | Si |

### Resenas `/api/v1/reviews`

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/album/{album_id}` | Resenas de un album (paginadas) | No |
| GET | `/song/{song_id}` | Resenas de una cancion (paginadas) | No |
| GET | `/me` | Resenas del usuario autenticado | Si |
| POST | `/` | Crear resena (album_id o song_id, no ambos) | Si |
| PATCH | `/{review_id}` | Editar resena propia | Si |
| DELETE | `/{review_id}` | Eliminar resena propia | Si |

### Integracion externa `/api/v1/external`

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| GET | `/search?q=` | Buscar albumes en Spotify | Si |
| POST | `/import/{spotify_id}` | Importar album y canciones desde Spotify | Si |

### Administracion `/api/v1/admin`

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| POST | `/seed-catalog` | Poblar catalogo con datos iniciales | No |
| POST | `/fix-seed-covers` | Actualizar portadas de albumes seed | No |

### Health checks

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/` | Estado general de la API |
| GET | `/health` | Health check para Azure App Service |
| GET | `/ready` | Readiness probe (verifica conexion a BD) |
| POST | `/admin/init-db` | Crear tablas (solo en desarrollo) |

---

## CI/CD y workflows de GitHub Actions

### backend.yml
Se activa en push a `desarrollo` cuando hay cambios en `backend/`. Ejecuta dos jobs en secuencia:

1. `test`: Instala dependencias de desarrollo, ejecuta flake8 y pytest con cobertura sobre SQLite en memoria.
2. `deploy`: Solo si los tests pasan. Hace login en Azure con OIDC y despliega el contenido de `backend/` al App Service `soundlog-backend` usando `azure/webapps-deploy@v3`. Requiere el entorno `desarrollo` de GitHub.

### frontend.yml
Se activa en push a `desarrollo` cuando hay cambios en `frontend/`. Un solo job:
1. Instala dependencias con `npm ci`.
2. Comprueba tipos con `tsc --noEmit`.
3. Ejecuta el build de Vite, inyectando `VITE_API_BASE_URL` desde los secretos.
4. Hace login con OIDC y sube el contenido de `frontend/dist` al contenedor `$web` del storage del frontend con `az storage blob upload-batch`.

### terraform.yml
Se activa en push a `desarrollo` o en pull requests cuando hay cambios en `infraestructure/terraform/`. Tambien acepta ejecucion manual con parametro `apply` o `destroy`.

- Job `plan`: Siempre se ejecuta. Inicializa Terraform, valida el formato y genera el plan. Si es un PR, publica el plan como comentario.
- Job `apply`: Solo en push a `desarrollo` o dispatch manual con `apply`. Ejecuta `terraform apply` con auto-approve tras el plan. Requiere el entorno `desarrollo`.
- Job `destroy`: Solo en dispatch manual con `destroy`. Ejecuta `terraform destroy` con `-refresh=false`.

### Pr.yml
Se activa en pull requests a `desarrollo` o `main`. Ejecuta tres jobs en paralelo:
- `frontend-lint`: TypeScript check, ESLint y build de verificacion.
- `backend-lint`: Flake8 y pytest.
- `terraform-plan`: Plan de Terraform con comentario en el PR.

### secret-scan.yml
Se activa en push y pull requests a `main`. Usa `gitleaks/gitleaks-action@v2` para detectar secretos accidentalmente incluidos en el codigo.

---

## Variables de entorno

### Backend (.env)

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `SECRET_KEY` | Clave JWT, minimo 32 caracteres | `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `DATABASE_URL` | Connection string de SQLAlchemy | `mssql+pyodbc://user:pass@server/db?driver=...` |
| `ENVIRONMENT` | Entorno de ejecucion | `development`, `production`, `testing` |
| `KEYVAULT_URL` | URL del Key Vault de Azure | `https://soundlog-dev-kv.vault.azure.net/` |
| `SPOTIFY_CLIENT_ID` | Client ID de Spotify | Obtenido en developer.spotify.com |
| `SPOTIFY_CLIENT_SECRET` | Client Secret de Spotify | Obtenido en developer.spotify.com |
| `STORAGE_ACCOUNT_NAME` | Nombre del storage de imagenes | `soundlogdevimages` |
| `STORAGE_ACCOUNT_KEY` | Clave del storage | Clave primaria de Azure |
| `LOG_LEVEL` | Nivel de logging | `INFO` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Vida del access token | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Vida del refresh token | `7` |
| `ALLOWED_ORIGINS` | Origenes permitidos para CORS | `http://localhost:5173` |

### Frontend (.env.local)

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del backend | `http://localhost:8000` |
| `VITE_APP_INSIGHTS_CONNECTION_STRING` | Connection string de App Insights | Opcional en desarrollo |

### Secretos de GitHub Actions

| Secreto | Uso |
|---|---|
| `AZURE_CLIENT_ID` | Client ID de la Managed Identity para OIDC |
| `AZURE_TENANT_ID` | Tenant ID de Azure AD |
| `AZURE_SUBSCRIPTION_ID` | Subscription ID de Azure |
| `AZURE_STORAGE_ACCOUNT` | Nombre del storage del frontend |
| `VITE_API_BASE_URL` | URL del backend para el build del frontend |
| `SQL_ADMIN_PASSWORD` | Contraseña del administrador de SQL Server |
| `JWT_SECRET_KEY` | Clave JWT para Terraform |
| `AZURE_MI_PRINCIPAL_ID` | Principal ID de la MI para role assignments |
| `SPOTIFY_CLIENT_ID` | Client ID de Spotify para Terraform |
| `SPOTIFY_CLIENT_SECRET` | Client Secret de Spotify para Terraform |

---

## Instalacion y ejecucion local

### Requisitos previos
- Python 3.11 o superior
- Node.js 20 o superior
- Git

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
# Editar .env con las variables necesarias
python main.py
```

El backend queda disponible en `http://localhost:8000`. La documentacion de Swagger esta en `http://localhost:8000/api/docs`.

Para tests locales sin base de datos de Azure:

```bash
DATABASE_URL=sqlite:///./test.db SECRET_KEY=test-key-32chars-minimum-length ENVIRONMENT=testing pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Editar .env.local: VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

### Pre-commit (recomendado)

```bash
pip install pre-commit
pre-commit install
```

A partir de ese momento, en cada `git commit` se ejecutan automaticamente: gitleaks, flake8, pytest, eslint y vitest.

---

## Testing

### Backend

Los tests usan SQLite en memoria con `StaticPool` para evitar dependencias externas. Los fixtures de `conftest.py` crean y destruyen las tablas entre cada test, garantizando aislamiento.

```bash
cd backend
pytest tests/ -v --tb=short
pytest tests/ -v --cov=. --cov-report=term-missing   # con cobertura
```

Tipos de tests:
- `test_health.py`: Tests de integracion de los endpoints `/`, `/health` y `/ready`.
- `test_auth.py`: Registro exitoso, email duplicado, login correcto, contraseña incorrecta.
- `test_reviews.py`: Ciclo completo de creacion, lectura, actualizacion y borrado de resenas.
- `test_seed.py`: Tests unitarios de la funcion `seed_catalog`.

### Frontend

```bash
cd frontend
npm test          # ejecucion unica (modo CI)
npm run test:watch # modo watch para desarrollo
```

Los tests usan Vitest con jsdom y Testing Library. El test principal (`Navbar.test.tsx`) verifica el renderizado del logo, los enlaces de login cuando no hay sesion y el boton de logout cuando hay sesion activa.

---

## Seguridad

El proyecto implementa multiples capas de seguridad:

**Autenticacion y contraseñas:**
- Contraseñas hasheadas con SHA256 + bcrypt (12 rondas).
- Tokens JWT con tipo (`access` o `refresh`) para prevenir el uso de un refresh token como access token.
- Rate limiting en el endpoint de login: 5 intentos por IP en 15 minutos.

**Validacion de entrada:**
- Validadores especializados para email (RFC 5322), username (3-30 caracteres, alfanumerico) y contraseña (minimo 8 caracteres, mayuscula, numero y caracter especial).
- Usernames reservados bloqueados: `admin`, `root`, `system`, `test`, etc.
- Deteccion de patrones XSS en texto libre (`<script`, `javascript:`, etc.).
- Limite de payload de 10 MB en todas las peticiones.

**Headers HTTP de seguridad** (aplicados por `SecurityHeadersMiddleware`):
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy` con politica restrictiva.
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` sin acceso a geolocalizacion, microfono ni camara.

**Infraestructura:**
- Secretos gestionados exclusivamente por Azure Key Vault. Ningun secreto se almacena en el codigo ni en las variables de entorno de GitHub en texto plano (se inyectan a Terraform como variables sensibles).
- Autenticacion OIDC en GitHub Actions: no hay `ARM_CLIENT_SECRET` ni tokens de larga duracion.
- HTTPS obligatorio en App Service (`https_only = true`).
- TLS 1.2 minimo en los storage accounts.
- El estado de Terraform se guarda cifrado en Azure Storage con autenticacion AAD.
- Gitleaks en pre-commit y en CI para detectar secretos accidentales.
- Escaneo de secretos en cada pull request y push a `main`.
