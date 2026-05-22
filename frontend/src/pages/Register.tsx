import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api';
import '../styles/Auth.css';

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validación fuerte de contraseña (coincide con backend)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,72}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('La contraseña debe tener entre 8 y 72 caracteres, una mayúscula, un número y un carácter especial');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name
      });

      const loginParams = new URLSearchParams();
      loginParams.append('username', formData.username);
      loginParams.append('password', formData.password);

      const loginResponse = await authAPI.login(loginParams as any);

      setSuccess('¡Registro exitoso! Iniciando sesión...');

      setTimeout(() => {
        login(response.data, loginResponse.data.access_token);
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Regís<span>trate</span></h1>
        <p className="subtitle">Únete a la comunidad de melómanos <br/> y empieza a registrar tus escuchas.</p>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="tunombre"
            />
          </div>
          <div className="form-group">
            <label htmlFor="full_name">Nombre completo</label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Tu nombre completo"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              maxLength={72}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              maxLength={72}
            />
          </div>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
