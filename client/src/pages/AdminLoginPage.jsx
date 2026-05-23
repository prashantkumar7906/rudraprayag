import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Admin Login — Hariom Trust Organisation';
    const token = localStorage.getItem('adminToken');
    if (token) navigate('/admin/dashboard');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please enter email and password.');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/login', { email, password });
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#E8F0FF' }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div
            className="p-8 text-center"
            style={{ background: 'linear-gradient(135deg, #2C1200, #4a1500)' }}
          >
            <div style={{ fontSize: '3rem', color: '#FF6600', marginBottom: '0.5rem' }}>ॐ</div>
            <h1 style={{ color: '#FF6600', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.25rem' }}>
              Hariom Trust Organisation
            </h1>
            <p style={{ color: '#F9A86A', fontSize: '0.85rem' }}>Admin Portal</p>
          </div>

          <form className="p-8" onSubmit={handleLogin}>
            <h2 style={{ color: '#CC3300', fontFamily: 'Noto Serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Sign In to Admin Panel
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="admin-email"
                  className={'form-input' + (error ? ' error' : '')}
                  placeholder="admin@dharamshala.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2C1200' }}>
                  Password
                </label>
                <input
                  type="password"
                  id="admin-password"
                  className={'form-input' + (error ? ' error' : '')}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div
                className="p-3 rounded-xl mt-4"
                style={{ background: '#fee2e2', border: '1px solid #CC3300' }}
              >
                <p style={{ color: '#991b1b', fontSize: '0.9rem' }}>❌ {error}</p>
              </div>
            )}

            <button
              type="submit"
              id="admin-login-btn"
              className="btn-bhagwa w-full mt-6 text-base py-3"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner spinner-dark" /> Signing in...</>
              ) : '🔐 Sign In'}
            </button>

            <p className="text-center mt-4 text-xs" style={{ color: '#9a7050' }}>
              Admin access only — unauthorized access is monitored
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
