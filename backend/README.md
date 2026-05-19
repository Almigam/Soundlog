# Backend - Soundlog API

API REST construida con FastAPI para la gestión de reseñas de álbumes y canciones. Proporciona autenticación, almacenamiento de datos y lógica de negocio.

## Características

- Autenticación JWT segura
- Gestión de usuarios y perfiles
- CRUD de álbumes, canciones y reseñas
- Búsqueda y filtrado
- Validación de entrada robusta
- Rate limiting
- Logging completo
- Documentación automática con Swagger

## Tecnología

- **Framework**: FastAPI 0.104.1
- **ORM**: SQLAlchemy 2.0.23
- **Base de datos**: Azure SQL Database (MSSQL)
- **Autenticación**: JWT con python-jose
- **Contraseñas**: bcrypt + SHA256
- **Server**: Uvicorn / Gunicorn
- **Testing**: pytest + pytest-asyncio

## Requisitos

- Python 3.11+
- pip o poetry
- Acceso a Azure SQL Database

## Instalación

### 1. Clonar repositorio y crear entorno virtual

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# Base de datos
DATABASE_URL=mssql+pyodbc://user:password@server:1433/database?driver=ODBC+Driver+17+for+SQL+Server

# Seguridad
SECRET_KEY=tu-clave-secreta-muy-larga-y-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Configuración
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Azure (opcional)
AZURE_STORAGE_CONNECTION_STRING=...
```

### 4. Crear base de datos

La base de datos se crea automáticamente al iniciar:

```bash
python main.py
```

O manualmente visitando `http://localhost:8000/admin/init-db`

## Ejecutar Servidor

### Modo desarrollo

```bash
python main.py
```

El servidor estará en `http://localhost:8000`

### Modo producción

```bash
gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 --timeout 600
```

## Documentación API

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

## Estructura

```
backend/
├── core/
│   ├── config.py              # Configuración de la app
│   ├── database.py            # Conexión a BD
│   ├── models.py              # Modelos SQLAlchemy
│   ├── schemas.py             # Esquemas Pydantic
│   ├── security.py            # Autenticación JWT
│   ├── security_utils.py      # Validadores
│   ├── security_middleware.py # Middleware de seguridad
│   └── logging_config.py      # Configuración de logs
├── routes/
│   ├── auth.py               # Autenticación
│   ├── users.py              # Usuarios
│   ├── albums.py             # Álbumes
│   ├── songs.py              # Canciones
│   ├── reviews.py            # Reseñas
│   └── external.py           # APIs externas
├── main.py                    # Punto de entrada
├── startup.py                 # Inicialización
├── requirements.txt
└── logs/                      # Archivos de log
```

## Modelos

### User
- id (int, PK)
- email (str, unique)
- username (str, unique)
- full_name (str)
- hashed_password (str)
- is_active (bool)
- created_at (datetime)

### Album
- id (int, PK)
- title (str)
- artist (str)
- release_year (int)
- description (text)
- cover_image_url (str)
- created_at (datetime)

### Song
- id (int, PK)
- title (str)
- artist (str)
- album_id (FK)
- duration (int)
- created_at (datetime)

### Review
- id (int, PK)
- user_id (FK)
- album_id (FK, nullable)
- song_id (FK, nullable)
- rating (float: 1-5)
- comment (text)
- created_at (datetime)

## Endpoints Principales

### Autenticación
```
POST   /api/v1/auth/register        # Registrar usuario
POST   /api/v1/auth/login           # Iniciar sesión
POST   /api/v1/auth/refresh         # Refrescar token
POST   /api/v1/auth/verify          # Verificar token
```

### Usuarios
```
GET    /api/v1/users/{user_id}      # Obtener perfil
PUT    /api/v1/users/{user_id}      # Actualizar perfil
GET    /api/v1/users/{user_id}/reviews
```

### Álbumes
```
GET    /api/v1/albums               # Listar álbumes
GET    /api/v1/albums/{album_id}    # Obtener álbum
POST   /api/v1/albums               # Crear álbum (admin)
PUT    /api/v1/albums/{album_id}    # Actualizar álbum
DELETE /api/v1/albums/{album_id}    # Eliminar álbum
```

### Reseñas
```
GET    /api/v1/reviews              # Listar reseñas
POST   /api/v1/reviews              # Crear reseña
PUT    /api/v1/reviews/{review_id}  # Actualizar reseña
DELETE /api/v1/reviews/{review_id}  # Eliminar reseña
```

## Validación

### Contraseña
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos un número
- Al menos un carácter especial (!@#$%^&*)
- Máximo 500 caracteres

### Email
- Formato válido
- Único en sistema

### Username
- 3-30 caracteres
- Solo alfanuméricos, guiones y guiones bajos
- Único en sistema
- Sin palabras reservadas (admin, root, etc.)

## Seguridad

### Autenticación
- JWT con firma HS256
- Access tokens: 30 minutos
- Refresh tokens: 7 días

### Hashing de Contraseñas
1. SHA256 de la contraseña (64 bytes)
2. bcrypt con 12 rounds
3. Verificación timing-safe

### Middleware
- Headers de seguridad HTTP
- Rate limiting (100 requests/minuto por IP)
- Validación de payload (máx 10MB)
- Audit logging completo
- Sanitización de entrada

## Testing

### Ejecutar tests

```bash
pytest
```

### Con cobertura

```bash
pytest --cov=core --cov=routes
```

## Deployment en Azure

### Requisitos
- Azure App Service (Python 3.11)
- Azure SQL Database
- Azure Key Vault para secretos

### Variables en Azure

En Application Settings:

```
DATABASE_URL=...
SECRET_KEY=...
ENVIRONMENT=production
```

### Deploy automático

Push a rama `main` dispara:
1. Build del Docker image
2. Deploy a App Service
3. Migraciones de BD (si aplica)

## Desarrollo Local con Docker

```bash
docker build -t soundlog-api .
docker run -p 8000:8000 -e DATABASE_URL=... soundlog-api
```

## Logs

Los logs se guardan en `logs/` con rotación automática:

- `soundlog.log` - Aplicación general
- `security.log` - Eventos de seguridad
- `audit.log` - Todas las requests

Nivel de log configurable vía `LOG_LEVEL` en `.env`

## Troubleshooting

### "Connection to database failed"
- Verificar DATABASE_URL en .env
- Verificar conectividad a Azure SQL (firewall)
- Revisar credenciales de conexión

### "password cannot be longer than 72 bytes"
- Contraseña se hash con SHA256 antes de bcrypt
- Límite efectivo: cualquier longitud

### "Modelos de BD no se crean"
- Visitar `http://localhost:8000/admin/init-db`
- Revisar permisos en base de datos

## Performance

- Índices en email, username
- Paginación implementada
- Caching headers configurados
- Connection pooling en SQLAlchemy

## Versión

API versión: 1.0.0

## Recursos Adicionales

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [Azure SQL Database](https://docs.microsoft.com/en-us/azure/azure-sql/)
