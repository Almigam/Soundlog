import { useState } from 'react';
import { User, usersAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import { resolveMediaUrl } from '../utils/mediaUrl';
import '../styles/Users.css';

export function Users() {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;

    setLoading(true);
    try {
      const response = await usersAPI.search(query.trim());
      setResults(response.data.filter((u) => u.id !== currentUser?.id));
    } catch {
      alert('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (username: string) => {
    try {
      if (following[username]) {
        await usersAPI.unfollow(username);
        setFollowing((prev) => ({ ...prev, [username]: false }));
      } else {
        await usersAPI.follow(username);
        setFollowing((prev) => ({ ...prev, [username]: true }));
      }
    } catch {
      alert('No se pudo actualizar el seguimiento');
    }
  };

  return (
    <div className="container users-page">
      <h1 className="section-title">Buscar usuarios</h1>
      <form className="users-search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Nombre de usuario..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="users-results">
        {results.map((u) => {
          const avatar = resolveMediaUrl(u.profile_picture_url);
          return (
            <div key={u.id} className="user-result-card">
              <div className="user-result-avatar">
                {avatar ? (
                  <img src={avatar} alt={u.username} />
                ) : (
                  u.username[0]?.toUpperCase()
                )}
              </div>
              <div className="user-result-info">
                <strong>{u.username}</strong>
                {u.full_name && <p>{u.full_name}</p>}
              </div>
              <button
                type="button"
                className={following[u.username] ? 'btn-unfollow' : 'btn-primary'}
                onClick={() => toggleFollow(u.username)}
              >
                {following[u.username] ? 'Dejar de seguir' : 'Seguir'}
              </button>
            </div>
          );
        })}
        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="users-empty">No se encontraron usuarios.</p>
        )}
      </div>
    </div>
  );
}
