import { useState, useEffect, useCallback } from 'react';
import { Album, albumsAPI } from '../api';
import { AlbumCard } from '../components/AlbumCard';
import '../styles/Albums.css';

export function AlbumsList() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skip, setSkip] = useState(0);

  const loadAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const response = await albumsAPI.getAll(skip, 18);
      setAlbums(response.data);
    } catch (err) {
      setError('Error al cargar álbumes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [skip]);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <header className="albums-header-simple">
        <h1 className="section-title">
          Explorar Álbumes
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            Mostrando {skip + 1}-{skip + albums.length}
          </span>
        </h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando álbumes...</div>
      ) : (
        <>
          {albums.length === 0 ? (
            <div className="empty-catalog-msg">
              <p>Solo hay álbumes de ejemplo hasta que importes más.</p>
              <p>Usa <strong>LOG ALBUM</strong> (mín. 3 letras) para buscar en Spotify e importar álbumes nuevos con todas sus canciones.</p>
            </div>
          ) : (
          <div className="poster-grid">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
          )}

          <div className="pagination">
            <button
              disabled={skip === 0}
              onClick={() => {
                setSkip(Math.max(0, skip - 18));
                window.scrollTo(0, 0);
              }}
              className="pagination-btn"
            >
              ← Anterior
            </button>
            <button
              disabled={albums.length < 18}
              onClick={() => {
                setSkip(skip + 18);
                window.scrollTo(0, 0);
              }}
              className="pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
