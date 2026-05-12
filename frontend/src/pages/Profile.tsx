import { useState, useEffect } from 'react';
import { Review, reviewsAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyReviews();
  }, []);

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

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0';

  return (
    <div className="profile-container">
      <header className="profile-header-new">
        <div className="profile-avatar-large">
          {user.username[0]?.toUpperCase()}
        </div>
        <div className="profile-name-section">
          <h1>{user.full_name || user.username}</h1>
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
