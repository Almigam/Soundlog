import { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, authAPI } from '../api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Si falla el getMe, probablemente la sesión expiró
      setUser(null);
      localStorage.removeItem('user');
    }
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // En lugar de verificar el token manualmente, intentamos obtener el usuario.
        // Las cookies se enviarán automáticamente gracias a withCredentials: true.
        await refreshUser();
      } catch (error) {
        console.debug('No active session found');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [refreshUser]);

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
