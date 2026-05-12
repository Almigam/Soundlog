import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Album, Song, Review, albumsAPI, songsAPI, reviewsAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import '../styles/AlbumDetail.css';

export function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const albumId = parseInt(id!);
      const [albumRes, songsRes, reviewsRes] = await Promise.all([
        albumsAPI.getById(albumId),
        songsAPI.getAll(0, 50, albumId),
        reviewsAPI.getAlbumReviews(albumId),
      ]);
      setAlbum(albumRes.data);
      setSongs(songsRes.data);
      setReviews(reviewsRes.data);
    } catch {
      setError('Error al cargar los datos del álbum');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create(newReview.rating, parseInt(id!), undefined, newReview.comment);
      setNewReview({ rating: 5, comment: '' });
      loadData();
    } catch {
      setError('Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!album) return <div className="container"><div className="error-message">Álbum no encontrado</div></div>;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  return (
    <div className="album-detail-container">
      <aside className="album-aside-left">
        <div className="album-cover-large">
          {album.cover_image_url ? (
            <img src={album.cover_image_url} alt={album.title} />
          ) : (
            <div className="placeholder-large" style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-elevated)', fontSize:'4rem'}}>♪</div>
          )}
        </div>
      </aside>

      <main className="album-main-content">
        <section className="album-title-section">
          <h1>{album.title}</h1>
          <p className="artist-year">
            <span className="artist-name" style={{color: '#fff', fontWeight: 600}}>{album.artist}</span>
            {album.release_year && <span> • {album.release_year}</span>}
          </p>
        </section>

        {album.description && (
          <p className="album-description">{album.description}</p>
        )}

        <section className="songs-section">
          <h2 className="section-title">Canciones</h2>
          <div className="songs-list">
            {songs.map((song, index) => (
              <div key={song.id} className="song-row">
                <span className="song-num">{index + 1}</span>
                <span className="song-name">{song.title}</span>
                {song.duration && (
                  <span className="song-time">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="reviews-section" style={{marginTop: '4rem'}}>
          <h2 className="section-title">Reseñas de la comunidad</h2>
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="review-item" style={{marginBottom: '1rem', background:'var(--bg-card)', padding:'1.5rem', borderRadius:'var(--radius)'}}>
                  <div className="review-header">
                    <span className="review-rating" style={{color:'var(--green)', fontWeight:700}}>{review.rating} ★</span>
                    <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="review-comment" style={{marginTop:'0.5rem'}}>{review.comment}</p>}
                </div>
              ))
            ) : (
              <p className="no-reviews">Aún no hay reseñas. ¡Sé el primero!</p>
            )}
          </div>
        </section>
      </main>

      <aside className="album-aside-right">
        <div className="action-header">Tu Actividad</div>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-value">{averageRating}</span>
            <span className="stat-label">Rating</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{reviews.length}</span>
            <span className="stat-label">Reseñas</span>
          </div>
        </div>

        {isAuthenticated ? (
          <form className="mini-review-form" onSubmit={handleSubmitReview}>
            <div className="action-header" style={{border:'none', marginTop:'1.5rem', marginBottom:'0.5rem'}}>Calificar</div>
            <select
              value={newReview.rating}
              onChange={(e) => setNewReview({ ...newReview, rating: parseFloat(e.target.value) })}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} Estrellas</option>
              ))}
            </select>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="¿Qué te pareció?"
            />
            <button type="submit" disabled={submitting} className="btn-primary" style={{width:'100%'}}>
              {submitting ? 'Enviando...' : 'Log Album'}
            </button>
          </form>
        ) : (
          <div style={{textAlign:'center', marginTop:'1rem'}}>
            <p style={{fontSize:'0.85rem', color:'var(--text-dim)', marginBottom:'1rem'}}>Inicia sesión para calificar este álbum.</p>
            <Link to="/login" className="btn-primary" style={{width:'100%', textAlign:'center'}}>Iniciar Sesión</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
