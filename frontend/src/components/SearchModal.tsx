import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { SpotifyAlbum, externalAPI } from '../api';
import '../styles/SearchModal.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await externalAPI.search(trimmed);
      setResults(response.data);
      if (response.data.length === 0) {
        setError('No se encontraron álbumes en Spotify para esa búsqueda.');
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data?.detail;

      if (status === 503) {
        setError(
          detail ||
            'Spotify no está configurado en el servidor. Contacta al administrador.'
        );
      } else if (status === 401) {
        setError('Sesión expirada. Vuelve a iniciar sesión.');
      } else {
        setError(detail || 'Error al buscar álbumes. Inténtalo de nuevo.');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        handleSearch();
      } else {
        setResults([]);
        setError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, isOpen, handleSearch]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError('');
    }
  }, [isOpen]);

  const handleImport = async (spotifyId: string) => {
    try {
      const response = await externalAPI.import(spotifyId);
      onClose();
      navigate(`/albums/${response.data.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      alert(
        axiosErr.response?.data?.detail ||
          'Error al importar el álbum. Comprueba las credenciales de Spotify en el backend.'
      );
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="search-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="search-modal-header">
          <input
            type="text"
            placeholder="Busca un álbum en Spotify para importar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="button" className="close-modal" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="search-results">
          {loading && <div className="loading-small">Buscando en Spotify...</div>}
          {error && !loading && <div className="search-error-msg">{error}</div>}
          {!loading &&
            !error &&
            results.map((album) => (
              <div
                key={album.id}
                className="search-result-item"
                onClick={() => handleImport(album.id)}
              >
                <div className="result-cover">
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt={album.title} />
                  ) : (
                    <div className="placeholder-small">♪</div>
                  )}
                </div>
                <div className="result-info">
                  <h4>{album.title}</h4>
                  <p>
                    {album.artist}
                    {album.release_year ? ` • ${album.release_year}` : ''}
                  </p>
                </div>
              </div>
            ))}
          {!loading && !error && query.trim().length > 2 && results.length === 0 && (
            <div className="no-results-msg">No se encontraron álbumes.</div>
          )}
          {!loading && query.trim().length <= 2 && (
            <div className="search-hint">Escribe al menos 3 caracteres para buscar.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
