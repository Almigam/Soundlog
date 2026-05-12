import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from core.config import settings

class SpotifyService:
    def __init__(self):
        self.sp = None
        if settings.spotify_client_id and settings.spotify_client_secret:
            auth_manager = SpotifyClientCredentials(
                client_id=settings.spotify_client_id,
                client_secret=settings.spotify_client_secret
            )
            self.sp = spotipy.Spotify(auth_manager=auth_manager)

    def search_albums(self, query: str, limit: int = 10):
        if not self.sp:
            return []
        
        results = self.sp.search(q=query, limit=limit, type='album')
        albums = []
        for item in results['albums']['items']:
            release_year = None
            if item.get('release_date'):
                try:
                    release_year = int(item['release_date'][:4])
                except (ValueError, IndexError):
                    pass

            albums.append({
                "id": item['id'],
                "title": item['name'],
                "artist": item['artists'][0]['name'],
                "release_year": release_year,
                "cover_image_url": item['images'][0]['url'] if item['images'] else None,
                "external_url": item['external_urls']['spotify']
            })
        return albums

    def get_album_details(self, spotify_id: str):
        if not self.sp:
            return None
        
        album = self.sp.album(spotify_id)
        release_year = None
        if album.get('release_date'):
            try:
                release_year = int(album['release_date'][:4])
            except (ValueError, IndexError):
                pass

        tracks = []
        for track in album['tracks']['items']:
            tracks.append({
                "title": track['name'],
                "artist": track['artists'][0]['name'],
                "duration": track['duration_ms'] // 1000
            })
            
        return {
            "title": album['name'],
            "artist": album['artists'][0]['name'],
            "release_year": release_year,
            "description": f"Album by {album['artists'][0]['name']}",
            "cover_image_url": album['images'][0]['url'] if album['images'] else None,
            "tracks": tracks
        }

spotify_service = SpotifyService()
