import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Album, Song, Review, albumsAPI, songsAPI, reviewsAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import { AlbumTags } from '../components/AlbumTags';
import { resolveMediaUrl } from '../utils/mediaUrl';
import '../styles/AlbumDetail.css';
import '../styles/Users.css';

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
  const [coverError, setCoverError] = useState(false);
  const [songForms, setSongForms] = useState<
    Record<number, { rating: number; comment: string }>
  >({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const albumId = parseInt(id!);
      const [albumRes, songsRes, reviewsRes] = await Promise.all([
        albumsAPI.getById(albumId),
        songsAPI.getAll(0, 100, albumId),
        reviewsAPI.getAlbumReviews(albumId),
      ]);
      setAlbum(albumRes.data);
      setSongs(songsRes.data);
      setReviews(reviewsRes.data);
      setCoverError(false);
    } catch {
      setError('Error al cargar los datos del álbum');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create(
        newReview.rating,
        parseInt(id!),
        undefined,
        newReview.comment
      );
      setNewReview({ rating: 5, comment: '' });
      loadData();
    } catch {
      setError('Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSongReview = async (songId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const form = songForms[songId] || { rating: 5, comment: '' };
    try {
      await reviewsAPI.create(form.rating, undefined, songId, form.comment);
      setSongForms((prev) => {
        const next = { ...prev };
        delete next[songId];
        return next;
      });
      alert('Reseña de canción guardada');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || 'Error al reseñar la canción';
      alert(msg);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!album)
    return (
      <div className="container">
        <div className="error-message">Álbum no encontrado</div>
      </div>
    );

  const coverUrl = resolveMediaUrl(album.cover_image_url);
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 'N/A';

  return (
    <div className="album-detail-container">
      <aside className="album-aside-left">
        <div className="album-cover-large">
          {coverUrl && !coverError ? (
            <img
              src={coverUrl}
              alt={album.title}
              onError={() => setCoverError(true)}
            />
          ) : (
            <div
              className="placeholder-large"
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-elevated)',
                fontSize: '4rem',
              }}
            >
              ♪
            </div>
          )}
        </div>
      </aside>

      <main className="album-main-content">
        <section className="album-title-section">
          <h1>{album.title}</h1>
          <p className="artist-year">
            <span className="artist-name" style={{ color: '#fff', fontWeight: 600 }}>
              {album.artist}
            </span>
            {album.release_year && <span> • {album.release_year}</span>}
          </p>
          <AlbumTags tags={album.tags} />
        </section>

        {album.description && <p className="album-description">{album.description}</p>}

        <section className="songs-section">
          <h2 className="section-title">Canciones ({songs.length})</h2>
          <div className="songs-list">
            {songs.map((song, index) => (
              <div key={song.id} className="song-row song-row-expanded">
                <div style={{ display: 'flex', width: '100%', gap: '1rem' }}>
                  <span className="song-num">{index + 1}</span>
                  <span className="song-name">{song.title}</span>
                  {song.duration && (
                    <span className="song-time">
                      {Math.floor(song.duration / 60)}:
                      {(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                {isAuthenticated && (
                  <div className="song-rate-form">
                    <select
                      value={songForms[song.id]?.rating ?? 5}
                      onChange={(e) =>
                        setSongForms((prev) => ({
                          ...prev,
                          [song.id]: {
                            rating: parseFloat(e.target.value),
                            comment: prev[song.id]?.comment ?? '',
                          },
                        }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Comentario opcional"
                      value={songForms[song.id]?.comment ?? ''}
                      onChange={(e) =>
                        setSongForms((prev) => ({
                          ...prev,
                          [song.id]: {
                            rating: prev[song.id]?.rating ?? 5,
                            comment: e.target.value,
                          },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleSongReview(song.id)}
                    >
                      Calificar canción
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="reviews-section" style={{ marginTop: '4rem' }}>
          <h2 className="section-title">Reseñas de la comunidad</h2>
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="review-item"
                  style={{
                    marginBottom: '1rem',
                    background: 'var(--bg-card)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <div className="review-header">
                    <span
                      className="review-rating"
                      style={{ color: 'var(--green)', fontWeight: 700 }}
                    >
                      {review.rating} ★
                    </span>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="review-comment" style={{ marginTop: '0.5rem' }}>
                      {review.comment}
                    </p>
                  )}
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
            <div
              className="action-header"
              style={{ border: 'none', marginTop: '1.5rem', marginBottom: '0.5rem' }}
            >
              Calificar álbum
            </div>
            <select
              value={newReview.rating}
              onChange={(e) =>
                setNewReview({ ...newReview, rating: parseFloat(e.target.value) })
              }
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} Estrellas
                </option>
              ))}
            </select>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="¿Qué te pareció?"
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {submitting ? 'Enviando...' : 'Log Album'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
              Inicia sesión para calificar este álbum.
            </p>
            <Link to="/login" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>
              Iniciar Sesión
            </Link>
          </div>
        )}

        {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}
      </aside>
    </div>
  );
}
