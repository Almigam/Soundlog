const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** Convierte rutas relativas del backend en URL absolutas para imágenes. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}
