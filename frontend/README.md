# Frontend - Soundlog UI

Interfaz de usuario moderna construida con React y TypeScript. Proporciona una experiencia fluida para explorar, reseñar y compartir opiniones sobre álbumes y canciones.

## Características

- Autenticación de usuarios
- Navegación por SPA (Single Page Application)
- Búsqueda y filtrado de álbumes/canciones
- Creación y edición de reseñas
- Perfiles de usuario personalizados
- Interfaz responsive
- TypeScript para seguridad de tipos
- Build optimizado con Vite

## Tecnología

- **Framework**: React 18.2.0
- **Lenguaje**: TypeScript 5.2.2
- **Bundler**: Vite 4.5.0
- **Enrutamiento**: React Router 6.16.0
- **HTTP Client**: Axios 1.6.0
- **Linting**: ESLint

## Requisitos

- Node.js 16+
- npm o yarn

## Instalación

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env.local`:

```bash
cp .env.example .env.local
```

Contenido de `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Soundlog
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará en `http://localhost:5173`

## Scripts Disponibles

```bash
# Desarrollo
npm run dev        # Servidor con hot reload

# Producción
npm run build      # Build optimizado
npm run preview    # Previsualizar build

# Code quality
npm run lint       # Linter de código
```

## Estructura

```
frontend/
├── src/
│   ├── App.tsx                 # Componente principal
│   ├── main.tsx                # Punto de entrada
│   ├── components/
│   │   ├── Auth/              # Componentes de autenticación
│   │   ├── Album/             # Componentes de álbumes
│   │   ├── Review/            # Componentes de reseñas
│   │   ├── User/              # Componentes de usuario
│   │   └── Common/            # Componentes reutilizables
│   ├── pages/
│   │   ├── Home.tsx           # Página principal
│   │   ├── Register.tsx       # Registro
│   │   ├── Login.tsx          # Inicio de sesión
│   │   ├── Albums.tsx         # Listado de álbumes
│   │   ├── Profile.tsx        # Perfil de usuario
│   │   └── NotFound.tsx       # 404
│   ├── services/
│   │   ├── api.ts             # Cliente HTTP
│   │   ├── authService.ts     # Servicio de autenticación
│   │   ├── albumService.ts    # Servicio de álbumes
│   │   └── reviewService.ts   # Servicio de reseñas
│   ├── hooks/
│   │   ├── useAuth.ts         # Hook de autenticación
│   │   ├── useApi.ts          # Hook de peticiones
│   │   └── useLocalStorage.ts # Hook para localStorage
│   ├── types/
│   │   └── index.ts           # Tipos TypeScript
│   ├── styles/
│   │   └── index.css          # Estilos globales
│   └── utils/
│       ├── storage.ts         # Manejo de localStorage
│       └── format.ts          # Utilidades de formato
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## Páginas Principales

### Página Principal (/)
- Bienvenida
- Últimas reseñas
- Álbumes destacados

### Registro (/register)
- Formulario de registro
- Validación de contraseña fuerte
- Enlace a login

### Login (/login)
- Autenticación con email/username
- Persistencia de token
- Redirección al dashboard

### Álbumes (/albums)
- Listado de álbumes
- Búsqueda y filtros
- Detalles de álbum

### Reseñas (/reviews)
- Crear nueva reseña
- Editar reseña propia
- Eliminar reseña

### Perfil (/profile/:username)
- Información de usuario
- Reseñas del usuario
- Álbumes favoritos

## Componentes Principales

### Auth
- LoginForm
- RegisterForm
- ProtectedRoute
- AuthContext

### Album
- AlbumCard
- AlbumDetails
- AlbumGrid
- AlbumSearch

### Review
- ReviewForm
- ReviewCard
- ReviewList
- RatingStars

### User
- UserCard
- UserProfile
- UserStats

### Common
- Header
- Navigation
- Footer
- Loading
- ErrorMessage
- Modal

## Servicios API

### authService
```typescript
login(email: string, password: string)
register(user: UserCreate)
logout()
refreshToken()
```

### albumService
```typescript
getAlbums(page?: number, limit?: number)
getAlbum(id: number)
searchAlbums(query: string)
```

### reviewService
```typescript
getReviews(filters?: ReviewFilters)
createReview(review: ReviewCreate)
updateReview(id: number, review: ReviewUpdate)
deleteReview(id: number)
```

## Tipos TypeScript

```typescript
interface User {
  id: number
  email: string
  username: string
  full_name: string
  is_active: boolean
  created_at: string
}

interface Album {
  id: number
  title: string
  artist: string
  release_year?: number
  description?: string
  cover_image_url?: string
  created_at: string
}

interface Review {
  id: number
  user_id: number
  album_id?: number
  song_id?: number
  rating: number
  comment?: string
  created_at: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}
```

## Autenticación

### Flujo

1. Usuario se registra/inicia sesión
2. Backend devuelve access_token + refresh_token
3. Token se guarda en localStorage
4. Todas las requests incluyen el token en header Authorization
5. Si token expira, usar refresh_token para obtener uno nuevo

### Headers HTTP

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Manejo de Estado

### localStorage
- Token de acceso
- Refresh token
- Preferencias de usuario

### React Context
- Autenticación global
- Datos del usuario logueado

### Estado Local
- Formularios
- UI temporal

## Styling

CSS personalizado sin dependencias externas.

Variables CSS disponibles:

```css
--primary-color: #FF7A00      /* Naranja */
--secondary-color: #1a1a1a    /* Oscuro */
--success-color: #4CAF50      /* Verde */
--error-color: #F44336        /* Rojo */
--background: #f5f5f5
--text-primary: #333333
```

## Validación de Formularios

### Contraseña
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos un número
- Al menos un carácter especial

### Email
- Formato válido
- Único en el sistema

### Username
- 3-30 caracteres
- Solo alfanuméricos, guiones, guiones bajos

## Error Handling

- Interceptor global de errores
- Mensajes claros al usuario
- Retry automático para errores temporales
- Redirects en 401/403

## Performance

- Code splitting automático con Vite
- Lazy loading de páginas
- Optimización de imágenes
- Caché de requests
- Debouncing en búsquedas

## Responsive Design

Breakpoints:

```
mobile:   < 640px
tablet:   640px - 1024px
desktop:  > 1024px
```

## Deployment

### Build

```bash
npm run build
```

Genera carpeta `dist/` con archivos optimizados.

### Hosting

Puede desplegarse en:
- Azure Static Web Apps
- Netlify
- Vercel
- GitHub Pages

### Variables en Producción

En `.env.production`:

```
VITE_API_URL=https://api.soundlog.com/api/v1
VITE_APP_NAME=Soundlog
```

## Desarrollo

### Crear nuevo componente

```bash
# Crear carpeta
mkdir src/components/MyComponent

# Archivo principal
touch src/components/MyComponent/MyComponent.tsx

# Barrel export
touch src/components/MyComponent/index.ts
```

### Agregar nueva página

```bash
# Crear página
touch src/pages/MyPage.tsx

# Actualizar router en App.tsx
```

### Convenciones

- Componentes: PascalCase
- Archivos: PascalCase.tsx
- Funciones: camelCase
- Constantes: UPPER_SNAKE_CASE
- Props: PascalCase + I prefix para interfaces

## Testing

```bash
# Setup (no configurado aún)
npm install --save-dev vitest @testing-library/react @testing-library/user-event
```

## Troubleshooting

### "Module not found"
- Ejecutar `npm install`
- Verificar rutas de importación

### "Port 5173 already in use"
- Cambiar puerto: `npm run dev -- --port 3000`

### "CORS error"
- Verificar VITE_API_URL en .env.local
- Asegurar que backend está corriendo

### "Token expirado"
- Automáticamente se refresca con refresh_token
- Si no funciona, redirige a login

## Recursos Adicionales

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
