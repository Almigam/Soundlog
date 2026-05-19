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

// Auth API
export const authAPI = {
  login: (formData: FormData) =>
    api.post<LoginResponse>('/api/v1/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  
  register: (userData: any) =>
    api.post<User>('/api/v1/auth/register', userData),
  
  getMe: () =>
    api.get<User>('/api/v1/users/me'),
};

// Albums API
export const albumsAPI = {
  getAll: (skip = 0, limit = 100) =>
    api.get<Album[]>('/api/v1/albums/', { params: { skip, limit } }),
  
  getById: (id: number) =>
    api.get<Album>(`/api/v1/albums/${id}`),
  
  create: (albumData: any) =>
    api.post<Album>('/api/v1/albums/', albumData),
};

// Songs API
export const songsAPI = {
  getAll: (skip = 0, limit = 100, albumId?: number) =>
    api.get<Song[]>('/api/v1/songs/', { params: { skip, limit, album_id: albumId } }),
  
  getById: (id: number) =>
    api.get<Song>(`/api/v1/songs/${id}`),
};

// Reviews API
export const reviewsAPI = {
  getAll: (skip = 0, limit = 100) =>
    api.get<Review[]>('/api/v1/reviews/', { params: { skip, limit } }),
  
  getAlbumReviews: (albumId: number) =>
    api.get<Review[]>(`/api/v1/reviews/album/${albumId}`),
  
  getMyReviews: () =>
    api.get<Review[]>('/api/v1/reviews/me'),
  
  create: (rating: number, albumId?: number, songId?: number, comment?: string) =>
    api.post<Review>('/api/v1/reviews/', {
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
