import { useState, useEffect } from 'react';
import { Review, reviewsAPI, usersAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

export function Profile() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    loadMyReviews();
    if (user) {
      setEditForm({
        full_name: user.full_name || '',
      });
    }
  }, [user]);

  const loadMyReviews = async () => {
    try {
      const response = await reviewsAPI.getMyReviews();
      setReviews(response.data);
    } catch (err) {
      console.error('Error al cargar reseñas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const response = await usersAPI.updateProfile(editForm);
      // Update local storage and context
      const token = localStorage.getItem('access_token');
      if (token) {
        login(response.data, token);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error al actualizar perfil', err);
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
      const response = await usersAPI.uploadAvatar(file);
      // Actualizar el usuario en el contexto
      if (user) {
        const updatedUser = { ...user, profile_picture_url: response.data.profile_picture_url };
        const token = localStorage.getItem('access_token');
        if (token) {
          login(updatedUser, token);
        }
      }
    } catch (err) {
      console.error('Error al subir avatar', err);
      alert('Error al subir la imagen');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const renderAvatar = () => {
    if (user.profile_picture_url) {
      const url = user.profile_picture_url.startsWith('http')
        ? user.profile_picture_url
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${user.profile_picture_url}`;
      return <img src={url} alt={user.username} className="avatar-img" />;
    }
    return user.username[0]?.toUpperCase();
  };

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0';

  return (
    <div className="profile-container">
      <header className="profile-header-new">
        <div className="profile-avatar-large">
          {renderAvatar()}
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
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
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
                <span className="stat-num">0</span>
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
                    <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment ? (
                    <p className="review-body-text">{review.comment}</p>
                  ) : (
                    <p className="review-body-text" style={{fontStyle: 'italic', opacity: 0.5}}>Sin comentario.</p>
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
