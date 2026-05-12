import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SearchModal } from './SearchModal';
import '../styles/Navbar.css';

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="nav-left">
          <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
            SOUNDLOG
          </Link>
          
          {isAuthenticated && (
            <button 
              className="nav-search-btn" 
              onClick={() => setIsSearchOpen(true)}
              title="Buscar álbum para reseñar"
            >
              <span className="search-icon">🔍</span>
              <span className="search-text">LOG ALBUM</span>
            </button>
          )}
        </div>
        
        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/albums" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Álbumes
          </Link>
          <Link to="/songs" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Canciones
          </Link>
          
          <div className="nav-divider" />

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-link user-link" onClick={() => setIsMenuOpen(false)}>
                {user?.username?.toUpperCase()}
              </Link>
              <button onClick={handleLogout} className="nav-link logout-link">
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                INICIAR SESIÓN
              </Link>
              <Link to="/register" className="nav-link signup-link" onClick={() => setIsMenuOpen(false)}>
                CREAR CUENTA
              </Link>
            </>
          )}
        </div>
      </div>

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </nav>
  );
}
