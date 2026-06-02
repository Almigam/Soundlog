# Soundlog — Frontend

Interfaz de usuario construida como Single Page Application con React 18 y TypeScript. Se comunica con el backend a traves de una API REST y se despliega como sitio web estatico en Azure Blob Storage.

---

## Tabla de contenidos

- [Requisitos](#requisitos)
- [Instalacion y ejecucion local](#instalacion-y-ejecucion-local)
- [Estructura de archivos](#estructura-de-archivos)
- [Variables de entorno](#variables-de-entorno)
- [Arquitectura de la aplicacion](#arquitectura-de-la-aplicacion)
- [Autenticacion y contexto global](#autenticacion-y-contexto-global)
- [Cliente HTTP y interceptores](#cliente-http-y-interceptores)
- [Paginas y rutas](#paginas-y-rutas)
- [Componentes principales](#componentes-principales)
- [Capa de API](#capa-de-api)
- [Estilos](#estilos)
- [Testing](#testing)
- [Build y despliegue](#build-y-despliegue)
- [Monitoreo con Application Insights](#monitoreo-con-application-insights)

---

## Requisitos

- Node.js 20 o superior
- npm 9 o superior

---

## Instalacion y ejecucion local

```bash
cd frontend
npm install
cp .env.example .env.local
```

Editar `.env.local` con:

```
VITE_API_BASE_URL=http://localhost:8000
```

```bash
npm run dev
```

La aplicacion queda disponible en `http://localhost:5173`. El servidor de Vite tiene configurado un proxy para redirigir las peticiones a `/api` al backend en `localhost:8000`, lo que evita problemas de CORS en desarrollo.

### Scripts disponibles

| Comando | Descripcion |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot module replacement |
| `npm run build` | Compilacion de TypeScript y build optimizado con Vite |
| `npm run preview` | Previsualizacion del build de produccion |
| `npm run lint` | Linting con ESLint (0 advertencias permitidas) |
| `npm test` | Ejecucion unica de tests con Vitest (modo CI) |
| `npm run test:watch` | Tests en modo watch para desarrollo |

---

## Estructura de archivos

```
frontend/
|-- src/
|   |-- api/
|   |   |-- client.ts           # Instancia de Axios con interceptores de autenticacion y refresh
|   |   |-- index.ts            # Funciones tipadas de API agrupadas por recurso
|   |   `-- monitoring.ts       # Inicializacion de Azure Application Insights
|   |
|   |-- components/
|   |   |-- Navbar.tsx          # Barra de navegacion con menu hamburguesa responsive
|   |   |-- Navbar.test.tsx     # Tests unitarios de la Navbar
|   |   |-- AlbumCard.tsx       # Tarjeta de album con imagen, overlay y enlace
|   |   |-- AlbumTags.tsx       # Lista de etiquetas de genero de un album
|   |   |-- ProtectedRoute.tsx  # Wrapper que redirige a /login si no hay sesion
|   |   `-- SearchModal.tsx     # Modal de busqueda en Spotify con debounce e importacion
|   |
|   |-- context/
|   |   `-- AuthContext.tsx     # Proveedor de contexto global de autenticacion
|   |
|   |-- hooks/
|   |   `-- useAuth.ts          # Hook para consumir AuthContext con comprobacion de proveedor
|   |
|   |-- pages/
|   |   |-- Home.tsx            # Pagina principal con hero y grid de albumes destacados
|   |   |-- Login.tsx           # Formulario de inicio de sesion
|   |   |-- Register.tsx        # Formulario de registro con validacion de contraseña
|   |   |-- AlbumsList.tsx      # Listado paginado de albumes en grid de portadas
|   |   |-- AlbumDetail.tsx     # Detalle de album: portada, canciones, resenas y formulario
|   |   |-- SongsList.tsx       # Listado paginado de canciones en tabla
|   |   |-- Profile.tsx         # Perfil propio: edicion, avatar, historial de resenas
|   |   `-- Users.tsx           # Busqueda de usuarios y gestion de seguimientos
|   |
|   |-- styles/
|   |   |-- global.css          # Variables CSS, reset, tipografia, grid de portadas, botones
|   |   |-- Navbar.css          # Estilos de la barra de navegacion
|   |   |-- Auth.css            # Estilos de las paginas de login y registro
|   |   |-- AlbumDetail.css     # Layout de tres columnas para la pagina de album
|   |   |-- Albums.css          # Paginacion y cabecera del listado de albumes
|   |   |-- Songs.css           # Tabla de canciones y paginacion
|   |   |-- Profile.css         # Layout del perfil y grid de resenas
|   |   |-- Home.css            # Hero, features y seccion de tendencias
|   |   |-- SearchModal.css     # Modal de busqueda de Spotify
|   |   `-- Users.css           # Busqueda de usuarios, tarjetas y estilos compartidos
|   |
|   |-- utils/
|   |   `-- mediaUrl.ts         # Resolucion de URLs relativas del backend a absolutas
|   |
|   |-- App.tsx                 # Componente raiz: proveedores, router y rutas
|   |-- main.tsx                # Punto de entrada: renderizado de React y carga de monitoring
|   |-- setupTests.ts           # Importacion de jest-dom para matchers adicionales
|   `-- vite-env.d.ts           # Declaracion de tipos de variables de entorno de Vite
|
|-- index.html                  # Plantilla HTML base
|-- vite.config.ts              # Configuracion de Vite: plugins, proxy, entorno de test
|-- tsconfig.json               # Configuracion de TypeScript
|-- tsconfig.node.json          # Configuracion de TypeScript para archivos de configuracion
`-- package.json
```

---

## Variables de entorno

Vite expone las variables de entorno que empiezan por `VITE_` en el codigo del cliente a traves de `import.meta.env`.

| Variable | Descripcion | Valor en desarrollo |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del backend sin barra final | `http://localhost:8000` |
| `VITE_APP_INSIGHTS_CONNECTION_STRING` | Connection string de Azure Application Insights | Vacia en desarrollo |

En el entorno de CI/CD, `VITE_API_BASE_URL` se inyecta como secreto de GitHub antes del build:

```yaml
env:
  VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
run: npm run build
```

---

## Arquitectura de la aplicacion

La aplicacion sigue una estructura de capas clara:

```
main.tsx
  `-- App.tsx
        |-- AuthProvider (contexto global de autenticacion)
        `-- BrowserRouter
              |-- Navbar (acceso al estado de auth)
              `-- Routes
                    |-- Rutas publicas: /, /login, /register, /albums, /albums/:id, /songs
                    `-- Rutas protegidas: /users, /profile
                          (ProtectedRoute redirige a /login si no hay sesion)
```

Cada pagina es responsable de sus propias llamadas a la API. Los datos no se comparten entre paginas a traves de estado global (excepto el usuario autenticado, que esta en `AuthContext`).

---

## Autenticacion y contexto global

`AuthContext` en `src/context/AuthContext.tsx` gestiona el estado global de autenticacion. Provee:

- `user`: Objeto `User` o `null`.
- `isAuthenticated`: Booleano derivado de `user !== null`.
- `isLoading`: `true` mientras se verifica el token al inicio.
- `login(user, token, refreshToken?)`: Guarda el usuario y los tokens en `localStorage` y actualiza el estado.
- `logout()`: Limpia `localStorage` y pone `user` a `null`.
- `refreshUser()`: Llama a `GET /api/v1/users/me` y actualiza el objeto de usuario en el estado y en `localStorage`.
- `refreshToken()`: Llama a `POST /api/v1/auth/refresh` con el refresh token y actualiza el access token en `localStorage`.

### Verificacion al inicio

Al montar `AuthProvider`, se ejecuta `verifyAuth()` de forma asincrona:

1. Lee el access token de `localStorage`. Si no existe, establece `isLoading = false` y termina.
2. Llama a `GET /api/v1/auth/verify` con el access token.
3. Si la respuesta es 200, llama a `refreshUser()` para obtener los datos actualizados del usuario.
4. Si la respuesta es 401, intenta renovar el token con el refresh token almacenado.
5. Si el refresh token tambien falla, llama a `logout()`.
6. En cualquier caso, establece `isLoading = false` al terminar.

Esto garantiza que al recargar la pagina, el usuario no tenga que volver a iniciar sesion si su token sigue siendo valido.

---

## Cliente HTTP y interceptores

`src/api/client.ts` exporta una instancia de Axios configurada con:

- `baseURL`: Leida de `VITE_API_BASE_URL`.
- `timeout`: 30 segundos.
- `maxBodyLength` y `maxContentLength`: 10 MB.

### Interceptor de peticion

Antes de cada peticion, añade:
- La cabecera `Authorization: Bearer {access_token}` si hay un token en `localStorage`.
- La cabecera `X-Requested-With: XMLHttpRequest`.
- Si el cuerpo es `FormData`, elimina `Content-Type` para que el navegador establezca el boundary correcto automaticamente.

### Interceptor de respuesta

En caso de error 401 (token expirado) en una peticion que no sea ya un reintento:
1. Marca la peticion original con `_retry = true` para evitar bucles.
2. Lee el refresh token de `localStorage`.
3. Llama directamente a `axios.post()` (no a la instancia `api`) para evitar que el interceptor se aplique a si mismo.
4. Si el refresh tiene exito, guarda el nuevo access token y reintenta la peticion original.
5. Si el refresh falla, limpia `localStorage` y redirige a `/login`.

En caso de error 429 (rate limit), registra un aviso en consola con el tiempo de espera indicado por la cabecera `Retry-After`.

---

## Paginas y rutas

### `/` — Home

Muestra el hero de bienvenida con llamada a la accion (solo visible si no hay sesion) y un grid con los primeros 6 albumes del catalogo. Debajo, una seccion de caracteristicas explica el funcionamiento de la aplicacion.

### `/login` — Login

Formulario con campos `username` (acepta email o nombre de usuario) y `password`. Al enviar, codifica los datos como `application/x-www-form-urlencoded` (requerido por el estandar OAuth2 que usa el backend) y llama a `authAPI.login()`. Tras el login exitoso, navega a `/`.

### `/register` — Register

Formulario con email, username, nombre completo, contraseña y confirmacion de contraseña. Realiza validacion de contraseña en el cliente antes de enviar (mismas reglas que el backend: mayuscula, numero, caracter especial, entre 8 y 72 caracteres). Si el registro es exitoso, hace login automaticamente y redirige a `/`.

### `/albums` — AlbumsList

Grid paginado de portadas de albumes. Carga 18 albumes por pagina. Los botones de paginacion desplazan la ventana al inicio al cambiar de pagina. Si el catalogo esta vacio, muestra un mensaje con instrucciones para importar albumes desde Spotify.

### `/albums/:id` — AlbumDetail

Pagina de tres columnas:
- **Columna izquierda**: Portada del album en grande (sticky).
- **Columna central**: Titulo, artista, año, etiquetas de genero, descripcion, lista de canciones con formulario de calificacion por cancion (si hay sesion), y seccion de resenas de la comunidad.
- **Columna derecha**: Estadisticas (rating promedio y numero de resenas), formulario para calificar el album completo (si hay sesion) o enlace al login (si no hay sesion).

### `/songs` — SongsList

Tabla paginada con todas las canciones del catalogo (titulo, artista, duracion formateada en mm:ss). Carga 20 canciones por pagina.

### `/users` — Users (protegida)

Buscador de usuarios por nombre de usuario o nombre completo. Muestra los resultados con avatar, nombre y boton de seguir/dejar de seguir. No muestra al propio usuario en los resultados.

### `/profile` — Profile (protegida)

Pagina de perfil propio dividida en dos secciones:
- **Cabecera**: Avatar (con boton de subida al activar la edicion), nombre de usuario, estadisticas (resenas totales, rating promedio, numero de seguidores) y formulario de edicion de nombre.
- **Actividad reciente**: Grid de tarjetas con todas las resenas del usuario. Cada tarjeta permite editar (rating y comentario) o eliminar la resena.

---

## Componentes principales

### Navbar

Barra de navegacion fija con `position: fixed` y `backdrop-filter: blur`. Contiene:
- Logo `SOUNDLOG` que enlaza a `/`.
- Boton `LOG ALBUM` (solo si hay sesion): Abre el `SearchModal`.
- Menu de navegacion con enlaces a Albumes, Canciones y (si hay sesion) Usuarios.
- Si hay sesion: username del usuario enlazando a `/profile` y boton de logout.
- Si no hay sesion: enlaces a login y registro.

En movil, el menu colapsa en un boton hamburguesa que despliega el menu a pantalla completa.

### SearchModal

Modal de busqueda con las siguientes caracteristicas:
- Se renderiza con `createPortal` directamente en `document.body` para evitar problemas de z-index y overflow.
- El campo de busqueda tiene `autoFocus` al abrirse.
- Implementa debounce de 500ms: la busqueda en Spotify se lanza 500ms despues de que el usuario deja de escribir, y solo si el termino tiene mas de 2 caracteres.
- Muestra mensajes de error diferenciados: 503 (Spotify no configurado), 401 (sesion expirada) y error generico.
- Al hacer clic en un resultado, llama a `POST /api/v1/external/import/{spotify_id}` y redirige a la pagina del album importado.
- Se cierra haciendo clic en el overlay, en el boton de cerrar o al navegar a otro album.

### AlbumCard

Tarjeta de album cuadrada con aspect-ratio 1:1. Muestra la portada como fondo y, al hacer hover, un overlay oscuro con titulo y artista. Si la imagen falla (`onError`), muestra un simbolo musical como placeholder. Usa `loading="lazy"` para las imagenes.

### ProtectedRoute

Componente que envuelve rutas que requieren autenticacion. Si `isAuthenticated` es `false`, redirige a `/login` con `replace` (sin añadir la ruta protegida al historial del navegador).

---

## Capa de API

`src/api/index.ts` define las interfaces TypeScript de todos los modelos y agrupa las funciones de API por recurso.

### Interfaces de modelos

```typescript
interface User { id, email, username, full_name?, profile_picture_url?, is_active, created_at }
interface Album { id, title, artist, release_year?, description?, cover_image_url?, tags?, created_at }
interface Song { id, title, artist, album_id?, duration?, created_at }
interface Review { id, user_id, album_id?, song_id?, rating, comment?, created_at }
interface SpotifyAlbum { id, title, artist, release_year?, cover_image_url?, external_url }
```

### Grupos de API

**`authAPI`**:
- `login(formData)`: POST a `/api/v1/auth/login` con `application/x-www-form-urlencoded`.
- `register(userData)`: POST a `/api/v1/auth/register` con JSON.
- `getMe()`: GET a `/api/v1/users/me`.

**`usersAPI`**:
- `updateProfile(userData)`, `uploadAvatar(file)`, `search(q)`, `follow(username)`, `unfollow(username)`, `getFollowersCount(username)`.

**`albumsAPI`**:
- `getAll(skip, limit)`, `getById(id)`, `create(albumData)`.

**`songsAPI`**:
- `getAll(skip, limit, albumId?)`, `getById(id)`.

**`reviewsAPI`**:
- `getAlbumReviews(albumId)`, `getSongReviews(songId)`, `getMyReviews()`, `create(rating, albumId?, songId?, comment?)`, `update(reviewId, data)`, `delete(reviewId)`.

**`externalAPI`**:
- `search(query)`, `import(spotifyId)`.

### Resolucion de URLs de medios

`src/utils/mediaUrl.ts` exporta la funcion `resolveMediaUrl(url?)`:
- Si la URL empieza por `http://` o `https://`, la devuelve sin modificar (URL absoluta de Azure Blob Storage o Spotify).
- Si es una ruta relativa (empieza por `/`), la combina con `VITE_API_BASE_URL` (para archivos servidos localmente en desarrollo).
- Si `url` es nula o indefinida, devuelve `undefined`.

---

## Estilos

El proyecto usa CSS puro sin preprocesadores ni frameworks de utilidades. Los estilos estan organizados por componente y pagina.

### Variables CSS globales (`global.css`)

```css
:root {
  --bg:          #14181C;   /* Fondo principal oscuro */
  --bg-card:     #1c2228;   /* Fondo de tarjetas */
  --bg-elevated: #222b33;   /* Elementos elevados */
  --bg-hover:    #263040;   /* Estado hover */
  --orange:      #FF8000;   /* Color principal de accion */
  --green:       #00e054;   /* Ratings y estados positivos */
  --text:        #e2e8f0;   /* Texto principal */
  --text-muted:  #9aabb8;   /* Texto secundario */
  --text-dim:    #567080;   /* Texto terciario y etiquetas */
  --border:      rgba(255, 255, 255, 0.07);
  --radius-sm:   4px;
  --radius:      8px;
  --nav-height:  70px;
}
```

### Clases globales reutilizables

- `.container`: Ancho maximo de 1100px centrado con padding horizontal.
- `.btn-primary`: Boton naranja con efecto de elevacion en hover.
- `.poster-grid`: CSS Grid con columnas de 150px minimo, relleno automatico.
- `.poster-card`: Tarjeta cuadrada con aspect-ratio 1:1, borde y efecto de escala en hover.
- `.poster-overlay`: Overlay con gradiente que aparece en hover mostrando el titulo.
- `.section-title`: Cabecera de seccion en mayusculas con linea separadora.
- `.loading`: Texto centrado con padding para estados de carga.
- `.error-message` y `.success-message`: Cajas de notificacion con fondo semitransparente.

### Tipografia

Se usan dos fuentes de Google Fonts cargadas en `global.css`:
- `Outfit` (300 a 700): Fuente principal para el cuerpo, botones y navegacion.
- `DM Serif Display` (400): Fuente de display para titulos de pagina y el logo.

---

## Testing

### Configuracion

Vitest esta configurado en `vite.config.ts`:

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/setupTests.ts',
}
```

`setupTests.ts` importa `@testing-library/jest-dom` para disponer de matchers adicionales como `toBeInTheDocument()`, `toHaveTextContent()`, etc.

### Test existente: Navbar.test.tsx

Verifica tres escenarios usando un `AuthContext` mockeado con `vi.fn()`:

1. **Sin sesion**: El logo `SOUNDLOG` y el enlace `INICIAR SESION` estan presentes.
2. **Con sesion**: El boton `LOGOUT` y el username del usuario en mayusculas estan presentes.
3. El logo siempre esta presente independientemente del estado de autenticacion.

El componente se envuelve en `BrowserRouter` (requerido por los enlaces de React Router) y en un `AuthContext.Provider` con el valor mockeado.

### Ejecucion

```bash
npm test            # Modo CI: una sola ejecucion
npm run test:watch  # Modo desarrollo: re-ejecuta al cambiar archivos
```

---

## Build y despliegue

### Build local

```bash
npm run build
```

El proceso ejecuta `tsc` para verificar tipos y luego Vite para generar el bundle optimizado en `dist/`. El build incluye code splitting automatico por ruta.

### Despliegue en Azure

El workflow `frontend.yml` de GitHub Actions realiza el despliegue automaticamente en cada push a `desarrollo` que modifique archivos bajo `frontend/`:

1. Instala dependencias con `npm ci`.
2. Verifica tipos con `npx tsc --noEmit`.
3. Ejecuta el build con `npm run build`, inyectando `VITE_API_BASE_URL` como variable de entorno.
4. Se autentica en Azure con OIDC (sin contraseñas estaticas).
5. Sube el contenido de `frontend/dist` al contenedor `$web` del storage account del frontend con `az storage blob upload-batch --overwrite true`.

La URL del sitio desplegado es `https://soundlogdevfrontend.z28.web.core.windows.net/`.

El storage account tiene configurado `error_404_document = "index.html"` para que el enrutamiento del lado del cliente funcione correctamente cuando el usuario accede directamente a una ruta como `/albums/5`.

---

## Monitoreo con Application Insights

`src/api/monitoring.ts` inicializa el SDK de Application Insights al cargar la aplicacion (se importa en `main.tsx`):

```typescript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
  }
});
```

Si `VITE_APP_INSIGHTS_CONNECTION_STRING` tiene valor, el SDK se inicializa y rastrea automaticamente:
- Vistas de pagina al cambiar de ruta (gracias a `enableAutoRouteTracking`).
- Excepciones de JavaScript no capturadas.
- Llamadas HTTP salientes con sus tiempos de respuesta.

Si la variable esta vacia (desarrollo local), el SDK no se inicializa y se muestra un aviso en consola.
