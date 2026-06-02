import { useState, useEffect, useCallback } from 'react';
import { Review, reviewsAPI, usersAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/mediaUrl';
import '../styles/Profile.css';

export function Profile() {
  const { user, logout, login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: user?.full_name || '' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editReviewForm, setEditReviewForm] = useState({ rating: 5, comment: '' });

  const loadFollowers = useCallback(async () => {
    if (!user) return;
    try {
      const res = await usersAPI.getFollowersCount(user.username);
      setFollowersCount(res.data.followers_count);
    } catch {
      setFollowersCount(0);
    }
  }, [user]);

  const loadMyReviews = useCallback(async () => {
    try {
      const response = await reviewsAPI.getMyReviews();
      setReviews(response.data);
    } catch (err) {
      console.error('Error al cargar reseñas', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyReviews();
    if (user) {
      setEditForm({ full_name: user.full_name || '' });
      loadFollowers();
    }
  }, [user, loadMyReviews, loadFollowers]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const response = await usersAPI.updateProfile(editForm);
      login(response.data);
      setIsEditing(false);
    } catch {
      alert('Error al actualizar perfil');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUpdateLoading(true);
    try {
      await usersAPI.uploadAvatar(file);
      await refreshUser();
    } catch {
      alert('Error al subir la imagen');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('¿Eliminar esta reseña?')) return;
    try {
      await reviewsAPI.delete(reviewId);
      loadMyReviews();
    } catch {
      alert('No se pudo eliminar la reseña');
    }
  };

  const handleSaveReviewEdit = async (reviewId: number) => {
    try {
      await reviewsAPI.update(reviewId, editReviewForm);
      setEditingReviewId(null);
      loadMyReviews();
    } catch {
      alert('No se pudo actualizar la reseña');
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const avatarUrl = resolveMediaUrl(user.profile_picture_url);
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '0';

  return (
    <div className="profile-container">
      <header className="profile-header-new">
        <div className="profile-avatar-large">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.username} className="avatar-img" />
          ) : (
            user.username[0]?.toUpperCase()
          )}
          {isEditing && (
            <label className="avatar-upload-overlay">
              <input type="file" onChange={handleFileChange} accept="image/*" hidden />
              <span>📷</span>
            </label>
          )}
        </div>
        <div className="profile-name-section">
          <div className="profile-name-header">
            <h1>{user.full_name || user.username}</h1>
            <button className="edit-profile-btn" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancelar' : 'Editar Perfil'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="edit-profile-form">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Tu nombre real"
                />
              </div>
              <p className="help-text">Haz clic en la foto para subir una nueva (.png, .jpg)</p>
              <button type="submit" className="save-btn" disabled={updateLoading}>
                {updateLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          ) : (
            <div className="profile-stats-row">
              <div className="stat-item">
                <span className="stat-num">{totalReviews}</span>
                <span className="stat-lbl">Reseñas</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{avgRating}</span>
                <span className="stat-lbl">Promedio</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{followersCount}</span>
                <span className="stat-lbl">Seguidores</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="my-activity">
        <h2 className="section-title">Actividad Reciente</h2>

        {loading ? (
          <div className="loading">Cargando tu diario...</div>
        ) : reviews.length > 0 ? (
          <div className="reviews-grid-new">
            {reviews.map((review) => (
              <div key={review.id} className="review-card-refined">
                <div className="review-content-main">
                  <div className="review-meta-top">
                    <span className="rating-pill">{review.rating} ★</span>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="review-type-label">
                    {review.album_id
                      ? `Álbum #${review.album_id}`
                      : review.song_id
                        ? `Canción #${review.song_id}`
                        : 'Reseña'}
                  </p>
                  {editingReviewId === review.id ? (
                    <div className="edit-review-form">
                      <select
                        value={editReviewForm.rating}
                        onChange={(e) =>
                          setEditReviewForm({
                            ...editReviewForm,
                            rating: parseFloat(e.target.value),
                          })
                        }
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} ★
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={editReviewForm.comment}
                        onChange={(e) =>
                          setEditReviewForm({ ...editReviewForm, comment: e.target.value })
                        }
                      />
                      <div className="review-actions">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleSaveReviewEdit(review.id)}
                        >
                          Guardar
                        </button>
                        <button type="button" onClick={() => setEditingReviewId(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {review.comment ? (
                        <p className="review-body-text">{review.comment}</p>
                      ) : (
                        <p className="review-body-text" style={{ fontStyle: 'italic', opacity: 0.5 }}>
                          Sin comentario.
                        </p>
                      )}
                      <div className="review-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(review.id);
                            setEditReviewForm({
                              rating: review.rating,
                              comment: review.comment || '',
                            });
                          }}
                        >
                          Editar
                        </button>
                        <button type="button" onClick={() => handleDeleteReview(review.id)}>
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reviews">
            <p>Tu diario está vacío. ¡Empieza a reseñar álbumes!</p>
          </div>
        )}
      </section>

      <a href="#" onClick={handleLogout} className="logout-link-profile">
        Cerrar sesión de la cuenta
      </a>
    </div>
  );
}
