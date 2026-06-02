import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial para enviar/recibir cookies HttpOnly
  // Seguridad: limitar payload
  maxBodyLength: 10 * 1024 * 1024, // 10MB
  maxContentLength: 10 * 1024 * 1024,
  // Timeouts
  timeout: 30000,
});

// ──────────────────── REQUEST INTERCEPTOR ────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Ya no necesitamos inyectar el token desde localStorage.
  // El navegador enviará la cookie access_token automáticamente.

  // Headers de seguridad adicionales
  if (config.headers) {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
  }

  return config;
});

// ──────────────────── RESPONSE INTERCEPTOR ────────────────────
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Manejar token expirado (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar renovar token.
        // El endpoint /refresh leerá la cookie refresh_token y seteará la nueva access_token.
        await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {}, { withCredentials: true });

        // Reintentar request original
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla (ej. cookie expirada), limpiar sesión
        localStorage.removeItem('user'); // Solo guardamos info de usuario no sensible
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Manejar errores de rate limit
    if (error.response?.status === 429) {
      const retryAfter = error.response?.headers['retry-after'] || '60';
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    return Promise.reject(error);
  }
);

export default api;
