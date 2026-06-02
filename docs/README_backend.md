# Soundlog — Backend

API REST construida con FastAPI que gestiona la autenticacion de usuarios, el catalogo musical, las resenas y la integracion con servicios externos de Azure y Spotify.

---

## Tabla de contenidos

- [Requisitos](#requisitos)
- [Instalacion local](#instalacion-local)
- [Estructura de archivos](#estructura-de-archivos)
- [Configuracion](#configuracion)
- [Modelos de base de datos](#modelos-de-base-de-datos)
- [Esquemas Pydantic](#esquemas-pydantic)
- [Endpoints detallados](#endpoints-detallados)
- [Seguridad y middleware](#seguridad-y-middleware)
- [Integracion con Azure Blob Storage](#integracion-con-azure-blob-storage)
- [Integracion con Spotify](#integracion-con-spotify)
- [Integracion con Azure Key Vault](#integracion-con-azure-key-vault)
- [Logging y monitoreo](#logging-y-monitoreo)
- [Testing](#testing)
- [Despliegue en Azure](#despliegue-en-azure)

---

## Requisitos

- Python 3.11 o superior
- pip
- Acceso a una instancia de SQL Server o Azure SQL Database (para produccion)
- SQLite (para desarrollo y tests, incluido en la libreria estandar de Python)
- Driver ODBC 17 o 18 for SQL Server (solo para produccion)

---

## Instalacion local

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
# Editar .env con los valores necesarios
python main.py
```

El servidor arranca en `http://localhost:8000`.

Para ejecutar las comprobaciones equivalentes a CI antes de hacer push:

```bash
# Multiplataforma
python scripts/run_ci_checks.py

# Solo en Windows PowerShell
.\scripts\check.ps1
```

---

## Estructura de archivos

```
backend/
|-- core/
|   |-- config.py               # Settings con Pydantic, validaciones y carga de Key Vault
|   |-- database.py             # Engine de SQLAlchemy, sesion y dependencia get_db
|   |-- models.py               # Modelos ORM de todas las tablas
|   |-- schemas.py              # Esquemas Pydantic de entrada y salida
|   |-- security.py             # JWT, hashing, dependencias de autenticacion
|   |-- security_utils.py       # Validadores: PasswordValidator, EmailValidator, etc.
|   |-- security_middleware.py  # Middleware ASGI: headers, rate limit, audit log
|   |-- logging_config.py       # Configuracion de logging con rotacion
|   |-- blob_storage.py         # Servicio de Azure Blob Storage con fallback local
|   |-- spotify.py              # Servicio de busqueda e importacion de Spotify
|   `-- seed_data.py            # Lista SAMPLE_ALBUMS para poblar el catalogo
|-- routes/
|   |-- auth.py                 # /api/v1/auth
|   |-- users.py                # /api/v1/users
|   |-- albums.py               # /api/v1/albums
|   |-- songs.py                # /api/v1/songs
|   |-- reviews.py              # /api/v1/reviews
|   |-- external.py             # /api/v1/external
|   `-- admin.py                # /api/v1/admin
|-- tests/
|   |-- conftest.py
|   |-- test_health.py
|   |-- test_auth.py
|   |-- test_reviews.py
|   `-- test_seed.py
|-- scripts/
|   |-- run_ci_checks.py
|   `-- check.ps1
|-- main.py
|-- startup.sh
|-- requirements.txt
|-- requirements-dev.txt
|-- pytest.ini
`-- .flake8
```

---

## Configuracion

La configuracion se gestiona en `core/config.py` mediante `pydantic_settings.BaseSettings`. Al arrancar, la clase `Settings` lee variables del archivo `.env` y del entorno del sistema. Si `KEYVAULT_URL` esta definido (entorno de produccion), se conecta a Azure Key Vault y sobreescribe los valores con los secretos almacenados.

### Variables disponibles

**Seguridad:**

| Variable | Tipo | Defecto | Descripcion |
|---|---|---|---|
| `SECRET_KEY` | str | Generado aleatoriamente | Clave para firmar JWT. Minimo 32 caracteres. Obligatorio en produccion. |
| `ALGORITHM` | str | `HS256` | Algoritmo de firma JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | int | `30` | Vida del access token en minutos |
| `REFRESH_TOKEN_EXPIRE_DAYS` | int | `7` | Vida del refresh token en dias |
| `RATE_LIMIT_REQUESTS` | int | `100` | Peticiones por minuto por IP |
| `MIN_PASSWORD_LENGTH` | int | `8` | Longitud minima de contraseña |
| `REQUIRE_UPPERCASE` | bool | `True` | Exigir mayuscula en contraseña |
| `REQUIRE_NUMBERS` | bool | `True` | Exigir numero en contraseña |
| `REQUIRE_SPECIAL` | bool | `True` | Exigir caracter especial |
| `MAX_FAILED_LOGIN_ATTEMPTS` | int | `5` | Intentos antes del bloqueo |
| `LOCKOUT_DURATION_MINUTES` | int | `15` | Duracion del bloqueo |

**Base de datos:**

| Variable | Tipo | Descripcion |
|---|---|---|
| `DATABASE_URL` | str | Connection string de SQLAlchemy. Acepta `mssql+pyodbc://...` o `sqlite:///...` |
| `DATABASE_POOL_SIZE` | int | Tamaño del pool de conexiones (defecto: 5) |
| `DATABASE_MAX_OVERFLOW` | int | Conexiones extra sobre el pool (defecto: 10) |
| `DATABASE_POOL_RECYCLE` | int | Segundos antes de reciclar conexiones (defecto: 3600) |

**CORS:**

| Variable | Descripcion |
|---|---|
| `ALLOWED_ORIGINS` | Lista separada por comas. En produccion no puede contener `localhost` si no hay Key Vault. |

**Azure:**

| Variable | Descripcion |
|---|---|
| `KEYVAULT_URL` | URL completa del Key Vault. Si esta vacia, se omite la carga de secretos. |
| `STORAGE_ACCOUNT_NAME` | Nombre del storage de imagenes |
| `STORAGE_ACCOUNT_KEY` | Clave del storage de imagenes |
| `PROFILE_PICTURES_CONTAINER` | Nombre del contenedor de avatares (defecto: `profile-pictures`) |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Para telemetria con Azure Monitor |

**Spotify:**

| Variable | Descripcion |
|---|---|
| `SPOTIFY_CLIENT_ID` | Client ID de la aplicacion en Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Client Secret correspondiente |

**Logging:**

| Variable | Descripcion |
|---|---|
| `LOG_LEVEL` | Nivel de logging: `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `LOG_FILE` | Ruta del archivo de log (defecto: `logs/app.log`) |
| `LOG_MAX_SIZE_MB` | Tamaño maximo antes de rotar (defecto: 100 MB) |
| `LOG_BACKUP_COUNT` | Numero de backups de log a mantener (defecto: 5) |

### Validaciones en produccion

Cuando `ENVIRONMENT=production`, la clase `Settings` impone restricciones adicionales:
- `SECRET_KEY` debe tener al menos 32 caracteres y no puede ser el valor de ejemplo.
- `DEBUG` no puede ser `True`.
- `ALLOWED_ORIGINS` no puede contener `localhost` a menos que `KEYVAULT_URL` este configurado.

---

## Modelos de base de datos

Definidos en `core/models.py` con SQLAlchemy declarativo. Las tablas se crean automaticamente al arrancar con `Base.metadata.create_all()`. En SQL Server se ejecutan migraciones manuales adicionales para añadir columnas nuevas a tablas existentes.

### User

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | Integer PK | Identificador unico |
| `email` | String(255) unique | Email del usuario |
| `username` | String(100) unique | Nombre de usuario |
| `full_name` | String(255) | Nombre completo opcional |
| `profile_picture_url` | String(500) | URL de la foto de perfil |
| `hashed_password` | String(255) | Contraseña hasheada con bcrypt |
| `is_active` | Boolean | Estado de la cuenta |
| `is_admin` | Boolean | Privilegios de administrador |
| `created_at` | DateTime | Fecha de creacion |
| `updated_at` | DateTime | Fecha de ultima modificacion |

### Album

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | Integer PK | Identificador unico |
| `title` | String(255) | Titulo del album |
| `artist` | String(255) | Nombre del artista |
| `release_year` | Integer | Año de lanzamiento |
| `description` | String(1000) | Descripcion opcional |
| `cover_image_url` | String(500) | URL de la portada |
| `tags` | String(500) | Generos separados por coma |
| `created_at` | DateTime | Fecha de creacion |
| `updated_at` | DateTime | Fecha de ultima modificacion |

### Song

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | Integer PK | Identificador unico |
| `title` | String(255) | Titulo de la cancion |
| `artist` | String(255) | Nombre del artista |
| `album_id` | Integer FK | Album al que pertenece |
| `duration` | Integer | Duracion en segundos |
| `created_at` | DateTime | Fecha de creacion |
| `updated_at` | DateTime | Fecha de ultima modificacion |

### Review

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | Integer PK | Identificador unico |
| `user_id` | Integer | ID del usuario autor |
| `album_id` | Integer nullable | ID del album reseñado |
| `song_id` | Integer nullable | ID de la cancion reseñada |
| `rating` | Float | Calificacion entre 0 y 5 |
| `comment` | String(1000) | Comentario opcional |
| `created_at` | DateTime | Fecha de creacion |
| `updated_at` | DateTime | Fecha de ultima modificacion |

Una resena tiene exactamente uno de `album_id` o `song_id`. Esto se valida tanto en el esquema Pydantic como en el endpoint.

### UserFollow

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | Integer PK | Identificador unico |
| `follower_id` | Integer | ID del usuario que sigue |
| `following_id` | Integer | ID del usuario seguido |
| `created_at` | DateTime | Fecha de creacion |

Restriccion unica compuesta sobre `(follower_id, following_id)` para evitar duplicados.

---

## Esquemas Pydantic

Definidos en `core/schemas.py`. Cada recurso tiene esquemas separados para creacion, actualizacion y respuesta.

### Validaciones de UserCreate

- `username`: Solo letras, numeros, guiones y guiones bajos. Entre 3 y 30 caracteres.
- `password`: Minimo 8 caracteres, al menos una mayuscula, un numero y un caracter especial (`!@#$%^&*(),.?":{}|<>`).

### Validaciones de ReviewCreate

- `rating`: Entre 1 y 5 (flotante).
- Exactamente uno de `album_id` o `song_id` debe estar presente. Si ambos o ninguno se envian, el validador lanza un error.

### Validaciones de AlbumBase

- `description`: Se sanitiza eliminando caracteres de control (se conservan saltos de linea y tabulaciones).
- `release_year`: Entre 1900 y 2100.

---

## Endpoints detallados

### POST /api/v1/auth/register

Crea un nuevo usuario. Realiza las siguientes comprobaciones antes de guardar:
1. Valida el formato del email con `EmailValidator`.
2. Comprueba que el email no este ya registrado (409 Conflict).
3. Valida el formato del username con `UsernameValidator` (incluye lista de nombres reservados).
4. Comprueba que el username no este ya en uso (409 Conflict).
5. Hashea la contraseña con bcrypt (12 rondas) tras validar su fortaleza.

Devuelve el objeto `UserResponse` (sin contraseña).

### POST /api/v1/auth/login

Acepta `application/x-www-form-urlencoded` con los campos `username` y `password` (compatible con el estandar OAuth2).

1. Comprueba el rate limiter por username. Si supera 5 intentos fallidos en 15 minutos, devuelve 429.
2. Busca el usuario por email o por username.
3. Verifica la contraseña con `pwd_context.verify()` (timing-safe).
4. Si las credenciales son incorrectas, registra el intento fallido y devuelve 401.
5. Si el usuario esta inactivo, devuelve 403.
6. Genera y devuelve access token (30 min) y refresh token (7 dias).

### POST /api/v1/auth/refresh

Acepta el refresh token en la cabecera `Authorization: Bearer`. Verifica que el token sea de tipo `refresh` (campo `type` en el payload JWT). Emite un nuevo access token sin renovar el refresh token.

### POST /api/v1/users/me/avatar

Acepta `multipart/form-data` con el campo `file`. Valida la extension (`.jpg`, `.jpeg`, `.png`, `.webp`). Si Azure Blob Storage esta configurado, sube la imagen al contenedor `profile-pictures` y devuelve la URL publica. Si no esta configurado, guarda el archivo en `uploads/avatars/` localmente y devuelve una ruta relativa.

Si el usuario ya tenia una foto de perfil, la anterior se elimina antes de guardar la nueva.

### GET /api/v1/external/search

Requiere que `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` esten configurados. Si no lo estan, devuelve 503. Busca albumes en Spotify con el termino de busqueda `q` (minimo 2 caracteres) y devuelve hasta 10 resultados.

### POST /api/v1/external/import/{spotify_id}

Obtiene los detalles completos del album desde Spotify, incluyendo todas sus canciones con duracion. Crea el album y todas sus canciones en la base de datos. Si el album ya existe (mismos titulo y artista), devuelve el ID existente sin duplicar.

---

## Seguridad y middleware

El stack de middleware se aplica en el siguiente orden (de exterior a interior):

1. **TrustedHostMiddleware**: Verifica el header `Host`. En produccion se configura con los dominios especificos.
2. **CORSMiddleware**: Permite peticiones desde los origenes configurados en `ALLOWED_ORIGINS`.
3. **SecurityHeadersMiddleware**: Añade cabeceras de seguridad HTTP a todas las respuestas.
4. **RateLimitMiddleware**: Limita a 100 peticiones por minuto por IP usando un diccionario en memoria. Añade cabeceras `X-RateLimit-Limit` y `X-RateLimit-Remaining`.
5. **AuditLoggingMiddleware**: Registra cada peticion y respuesta con IP, metodo, ruta y codigo de estado.
6. **InputSanitizationMiddleware**: Rechaza peticiones con `Content-Length` mayor de 10 MB y metodos HTTP no permitidos.

### Cabeceras de seguridad añadidas

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

### Flujo de hashing de contraseñas

1. La contraseña en texto plano se valida con `PasswordValidator`.
2. Se hashea directamente con bcrypt a traves de `passlib.CryptContext` con 12 rondas.
3. La verificacion usa `pwd_context.verify()`, que es resistente a ataques de temporalizacion.

Se incluye un monkeypatch para corregir la incompatibilidad entre `passlib` y `bcrypt>=4.0` (que elimino el atributo `__about__`).

### Dependencias de autenticacion

- `get_current_user(token)`: Decodifica el access token y devuelve el `user_id` como entero. Se usa como dependencia de FastAPI con `Depends()`.
- `get_current_user_refresh(token)`: Igual pero valida tokens de tipo `refresh`. Se usa exclusivamente en el endpoint de refresh.

---

## Integracion con Azure Blob Storage

El servicio `BlobStorageService` en `core/blob_storage.py` gestiona la subida y eliminacion de imagenes de perfil.

Si las variables `STORAGE_ACCOUNT_NAME` y `STORAGE_ACCOUNT_KEY` estan configuradas, usa `azure-storage-blob` para subir a Azure. En caso contrario, guarda los archivos en el directorio local `uploads/avatars/`.

El nombre de cada archivo se genera con `uuid.uuid4()` para evitar colisiones y sobreescrituras indeseadas.

El tipo de contenido (`Content-Type`) se establece correctamente segun la extension del archivo para que los navegadores lo muestren directamente sin forzar la descarga.

---

## Integracion con Spotify

El servicio `SpotifyService` en `core/spotify.py` usa la libreria `spotipy` con autenticacion `Client Credentials` (no requiere que el usuario este autenticado en Spotify).

**Busqueda de albumes** (`search_albums`):
- Busca por query libre en el catalogo de Spotify.
- Devuelve hasta 10 resultados con ID de Spotify, titulo, artista, año de lanzamiento, URL de portada y URL externa.

**Importacion de album** (`get_album_details`):
- Obtiene los detalles completos del album por su ID de Spotify.
- Recupera todas las canciones paginando la API (50 canciones por pagina) hasta agotar los resultados.
- Extrae los generos del album para usarlos como etiquetas (campo `tags`).
- Devuelve el album completo con su lista de canciones lista para insertar en la base de datos.

Si `SPOTIFY_CLIENT_ID` o `SPOTIFY_CLIENT_SECRET` estan vacios, el servicio se inicializa sin cliente y devuelve listas vacias o `None` en lugar de lanzar excepciones.

---

## Integracion con Azure Key Vault

Al arrancar, si `KEYVAULT_URL` tiene valor, `core/config.py` intenta conectarse al Key Vault usando `DefaultAzureCredential`. En Azure App Service, esta credencial se resuelve automaticamente con la Managed Identity del servicio.

El mapeo de nombres de secretos a atributos de `Settings` es:

| Nombre en Key Vault | Atributo en Settings |
|---|---|
| `DATABASE-URL` | `database_url` |
| `SECRET-KEY` | `secret_key` |
| `STORAGE-ACCOUNT-KEY` | `storage_account_key` |
| `STORAGE-ACCOUNT-NAME` | `storage_account_name` |
| `SPOTIFY-CLIENT-ID` | `spotify_client_id` |
| `SPOTIFY-CLIENT-SECRET` | `spotify_client_secret` |
| `ALLOWED-ORIGINS` | `allowed_origins` |
| `APPLICATION-INSIGHTS-CONNECTION-STRING` | `applicationinsights_connection_string` |

Si un secreto no existe o hay un error al leerlo, se registra una advertencia pero el arranque continua. Esto permite que el servicio funcione en desarrollo sin Key Vault.

---

## Logging y monitoreo

La configuracion de logging en `core/logging_config.py` establece:
- Un handler de archivo con rotacion cuando supera `LOG_MAX_SIZE_MB` MB, manteniendo `LOG_BACKUP_COUNT` copias.
- Un handler de consola para ver los logs en tiempo real.
- El nivel de `sqlalchemy.engine` se eleva a `WARNING` para evitar el spam de consultas SQL en el log.
- El nivel de `uvicorn.access` se eleva a `WARNING` para reducir el ruido de las peticiones de health check.

Si `APPLICATIONINSIGHTS_CONNECTION_STRING` esta configurado, se inicializa `azure-monitor-opentelemetry` para enviar trazas, logs y metricas a Azure Application Insights automaticamente.

---

## Testing

Los tests se encuentran en el directorio `tests/`. La configuracion de pytest esta en `pytest.ini`:

```ini
[pytest]
pythonpath = .
testpaths = tests
asyncio_mode = auto
```

### Fixtures en conftest.py

**`db_session`** (scope `function`): Crea las tablas en una base de datos SQLite en memoria usando `StaticPool` (mantiene la misma conexion durante el test). Al terminar cada test, elimina todas las tablas para garantizar aislamiento.

**`client`** (scope `function`): Crea un `TestClient` de FastAPI que sobreescribe la dependencia `get_db` con la sesion de test. Al terminar, restaura las dependencias originales.

### Variables de entorno para tests

El archivo `conftest.py` establece las variables antes de importar nada del proyecto:
```python
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-only-for-ci-32chars!!")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("KEYVAULT_URL", "")
```

Esto es equivalente a lo que hacen los workflows de GitHub Actions.

### Ejecucion

```bash
# Tests basicos
pytest tests/ -v --tb=short

# Con cobertura
pytest tests/ -v --cov=. --cov-report=term-missing --cov-fail-under=0

# Un test especifico
pytest tests/test_auth.py::test_register_user -v
```

---

## Despliegue en Azure

El despliegue se realiza automaticamente desde GitHub Actions (`backend.yml`) en cada push a la rama `desarrollo` que modifique archivos bajo `backend/`.

El proceso en Azure App Service es:
1. GitHub Actions sube el contenido de `backend/` usando `azure/webapps-deploy@v3`.
2. Azure ejecuta `startup.sh` como comando de inicio.
3. `startup.sh` limpia todos los archivos `.pyc` y directorios `__pycache__` para evitar problemas de cache.
4. Instala las dependencias con `pip install -r requirements.txt`.
5. Lanza Uvicorn en el puerto indicado por `WEBSITES_PORT` (8000 por defecto).
6. Al arrancar `main.py`, el evento `startup` crea las tablas, ejecuta migraciones manuales y verifica la conexion a la base de datos en segundo plano.

### Variables de aplicacion en App Service

Se configuran desde Terraform:
- `KEYVAULT_URL`: Para que el backend cargue los secretos al arrancar.
- `STORAGE_ACCOUNT_NAME`: Nombre del storage de imagenes.
- `ENVIRONMENT`: `production`.
- `WEBSITES_PORT`: `8000`.
- `SCM_DO_BUILD_DURING_DEPLOYMENT`: `true` (permite a Oryx instalar dependencias).
- `SECRET_KEY`: Valor de fallback para pasar la validacion inicial antes de cargar Key Vault.
- `APPLICATIONINSIGHTS_CONNECTION_STRING`: Para telemetria desde el primer arranque.
