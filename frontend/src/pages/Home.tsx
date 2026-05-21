import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Album, albumsAPI } from '../api';
import { AlbumCard } from '../components/AlbumCard';
import '../styles/Home.css';

export function Home() {
  const { isAuthenticated } = useAuth();
  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await albumsAPI.getAll(0, 6);
        setPopularAlbums(response.data);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="home-container">
      <section className="hero-simple">
        <div className="container">
          <div className="hero-inner">
            <h1>Descubre tu próxima obsesión musical.</h1>
            <p className="hero-lead">
              La red social para amantes de la música. Reseña álbumes,
              sigue a tus artistas favoritos y comparte tus listas.
            </p>
            {!isAuthenticated && (
              <div className="hero-actions">
                <Link to="/register" className="btn-primary">Crear cuenta gratis</Link>
                <Link to="/login" className="btn-secondary-alt">Iniciar sesión</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="trending-section">
        <div className="container">
          <h2 className="section-title">
            Álbumes populares esta semana
            <Link to="/albums" className="view-more">Ver todo</Link>
          </h2>

          {loading ? (
            <div className="loading">Cargando...</div>
          ) : (
            <div className="poster-grid">
              {popularAlbums.map(album => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Comparte tu pasión</h2>
          <div className="features-grid-refined">
            <div className="feature-item">
              <span className="feature-icon">🎧</span>
              <h3>Lleva un registro</h3>
              <p>Guarda cada álbum que escuches y mantén tu historial al día.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <h3>Escribe reseñas</h3>
              <p>Comparte tus opiniones y puntúa tus lanzamientos favoritos.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📂</span>
              <h3>Crea listas</h3>
              <p>Organiza tu música por géneros, estados de ánimo o épocas.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
