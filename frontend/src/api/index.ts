import api from './client';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  release_year?: number;
  description?: string;
  cover_image_url?: string;
  created_at: string;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  album_id?: number;
  duration?: number;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  album_id?: number;
  song_id?: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface SpotifyAlbum {
  id: string;
  title: string;
  artist: string;
  release_year?: number;
  cover_image_url?: string;
  external_url: string;
}

// ... rest of the API definitions

// Reviews API
export const reviewsAPI = {
  // ... existing reviewsAPI methods
  create: (rating: number, albumId?: number, songId?: number, comment?: string) =>
    api.post<Review>('/api/v1/reviews', {
      rating,
      album_id: albumId,
      song_id: songId,
      comment,
    }),
};

// External API (Spotify)
export const externalAPI = {
  search: (query: string) =>
    api.get<SpotifyAlbum[]>('/api/v1/external/search', { params: { q: query } }),

  import: (spotifyId: string) =>
    api.post<{ message: string; id: number }>(`/api/v1/external/import/${spotifyId}`),
};
