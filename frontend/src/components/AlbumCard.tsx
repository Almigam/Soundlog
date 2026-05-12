import { Link } from 'react-router-dom';
import { Album } from '../api';

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link to={`/albums/${album.id}`} className="poster-card">
      {album.cover_image_url ? (
        <img src={album.cover_image_url} alt={album.title} />
      ) : (
        <div className="placeholder" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', fontSize: '2rem' }}>
          ♪
        </div>
      )}
      <div className="poster-overlay">
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '2px' }}>{album.title}</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{album.artist}</p>
      </div>
    </Link>
  );
}
