# Soundlog

Aplicación web para reseñar álbumes y canciones. Los usuarios pueden calificar canciones y álbumes, compartir reseñas en su perfil, explorar los favoritos de otros usuarios y construir una comunidad en torno a la música.

## Documentación del Proyecto

- [Backend](./backend/README.md) - API REST con FastAPI y SQLAlchemy
- [Frontend](./frontend/README.md) - Interfaz con React y TypeScript

## Descripción General

Soundlog es una plataforma social dedicada a las reseñas de música. Permite a los usuarios:

- Crear una cuenta con autenticación segura
- Reseñar álbumes y canciones con calificación y comentarios
- Ver perfiles de otros usuarios y sus reseñas
- Descubrir favoritos y tendencias musicales
- Buscar y explorar contenido musical

## Tecnología

### Backend
- FastAPI (framework web moderno)
- SQLAlchemy (ORM para base de datos)
- SQLServer / Azure SQL Database (base de datos)
- Autenticación JWT
- Seguridad: hashing SHA256 + bcrypt

### Frontend
- React 18
- TypeScript
- Vite (herramienta de compilación)
- React Router para navegación
- Axios para peticiones HTTP

## Infraestructura

El proyecto está alojado en Azure con los siguientes servicios:

- App Service: hospedaje de la aplicación
- SQL Database: almacenamiento de datos
- Blob Storage: almacenamiento de imágenes de portadas
- Key Vault: gestión de secretos
- CDN: distribución de contenido estático
- Active Directory B2C: autenticación opcional

## Iniciar Rápidamente

### Requisitos Previos
- Python 3.11+
- Node.js 16+
- Git

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

El backend estará disponible en `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
soundlog/
├── backend/                 # API REST
│   ├── core/               # Configuración y modelos
│   ├── routes/             # Endpoints
│   ├── requirements.txt
│   └── main.py
├── frontend/               # Interfaz de usuario
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── infraestructure/        # Configuración de Azure
```

## Variables de Entorno

### Backend (`.env`)
```
DATABASE_URL=mssql+pyodbc://user:password@server/database
SECRET_KEY=tu-clave-secreta
ENVIRONMENT=development
```

### Frontend (`.env.local`)
```
VITE_API_URL=http://localhost:8000/api/v1
```

## Seguridad

- Contraseñas hasheadas con SHA256 + bcrypt (12 rounds)
- Tokens JWT con expiración configurable
- Rate limiting por IP
- Validación de entrada y sanitización
- Headers de seguridad HTTP
- HTTPS en producción

## Endpoints Principales

- POST `/api/v1/auth/register` - Registrar usuario
- POST `/api/v1/auth/login` - Iniciar sesión
- GET `/api/v1/users/{user_id}` - Perfil de usuario
- GET `/api/v1/albums` - Listar álbumes
- POST `/api/v1/reviews` - Crear reseña
- GET `/api/v1/reviews` - Listar reseñas

## Desarrollo

### Commits

Seguimos convenciones de commits descriptivos:

```bash
git commit -m "Característica: descripción"
git commit -m "Arreglo: descripción"
git commit -m "Documentación: descripción"
git commit -m "Refactor: descripción"
```

### Rama de Desarrollo

El trabajo se realiza en la rama `desarrollo`, que se integra a `main` a través de pull requests.

## Contribuciones

Las contribuciones siguen este flujo:

1. Crear rama desde `desarrollo`
2. Realizar cambios y commits
3. Crear pull request
4. Revisión de código
5. Merge a `desarrollo`

## Soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio.

## Licencia

Privado

## Estado del Proyecto

En desarrollo activo. Actualmente se trabaja en mejorar la seguridad y experiencia de usuario.
