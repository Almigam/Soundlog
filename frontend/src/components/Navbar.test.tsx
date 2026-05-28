import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from './Navbar';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Mock simple de AuthContext para no depender del hook real
const mockAuthValue = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(async () => {}),
  refreshToken: vi.fn(async () => {}),
};

describe('Navbar Component', () => {
  it('renders the logo', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <Navbar />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    expect(screen.getByText('SOUNDLOG')).toBeInTheDocument();
  });

  it('renders login link when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <Navbar />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    expect(screen.getByText('INICIAR SESIÓN')).toBeInTheDocument();
  });

  it('renders logout when authenticated', () => {
    const authenticatedValue = {
      ...mockAuthValue,
      isAuthenticated: true,
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={authenticatedValue}>
          <Navbar />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    expect(screen.getByText('LOGOUT')).toBeInTheDocument();
    expect(screen.getByText('TESTUSER')).toBeInTheDocument();
  });
});
