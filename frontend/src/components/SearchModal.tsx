import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpotifyAlbum, externalAPI } from '../api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await externalAPI.search(query);
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (spotifyId: string) => {
    try {
      const response = await externalAPI.import(spotifyId);
      onClose();
      navigate(`/albums/${response.data.id}`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Error al importar el álbum. Asegúrate de que el backend tenga las credenciales de Spotify.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-content" onClick={e => e.stopPropagation()}>
        <header className="search-modal-header">
          <input
            type="text"
            placeholder="Busca un álbum para reseñar..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button className="close-modal" onClick={onClose}>✕</button>
        </header>

        <div className="search-results">
          {loading && <div className="loading-small">Buscando en Spotify...</div>}
          {!loading && results.map(album => (
            <div key={album.id} className="search-result-item" onClick={() => handleImport(album.id)}>
              <div className="result-cover">
                {album.cover_image_url ? (
                  <img src={album.cover_image_url} alt={album.title} />
                ) : (
                  <div className="placeholder-small">♪</div>
                )}
              </div>
              <div className="result-info">
                <h4>{album.title}</h4>
                <p>{album.artist} • {album.release_year}</p>
              </div>
            </div>
          ))}
          {!loading && query.length > 2 && results.length === 0 && (
            <div className="no-results-msg">No se encontraron álbumes.</div>
          )}
        </div>
      </div>
      <style>{`
        .search-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(5px);
          z-index: 2000;
          display: flex;
          justify-content: center;
          padding-top: 10vh;
        }
        .search-modal-content {
          width: 100%;
          max-width: 600px;
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          max-height: 70vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .search-modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 1rem;
        }
        .search-modal-header input {
          flex: 1;
          background: var(--bg);
          border: 1px solid var(--border);
          color: #fff;
          padding: 0.8rem 1.2rem;
          border-radius: var(--radius-sm);
          font-size: 1.1rem;
          outline: none;
        }
        .search-modal-header input:focus {
          border-color: var(--orange);
        }
        .close-modal {
          background: none;
          color: var(--text-dim);
          font-size: 1.5rem;
          padding: 0;
        }
        .search-results {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        .search-result-item {
          display: flex;
          gap: 1.25rem;
          padding: 0.75rem;
          border-radius: var(--radius);
          cursor: pointer;
          transition: background 0.2s;
        }
        .search-result-item:hover {
          background: var(--bg-hover);
        }
        .result-cover {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
          background: var(--bg-elevated);
          flex-shrink: 0;
        }
        .result-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .result-info h4 {
          margin-bottom: 0.2rem;
          color: #fff;
        }
        .result-info p {
          font-size: 0.85rem;
          color: var(--text-dim);
        }
        .loading-small {
          text-align: center;
          padding: 2rem;
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
}
