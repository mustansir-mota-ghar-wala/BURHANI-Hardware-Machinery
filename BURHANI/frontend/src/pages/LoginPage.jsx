import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ setToasts }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await apiPost('/api/react/login/', form);
    if (res.status === 'success') {
      await fetchUser();
      setToasts(t => [...t, { tag: 'success', text: `Welcome back, ${res.first_name || res.username}!` }]);
      navigate('/');
    } else {
      setToasts(t => [...t, { tag: 'error', text: res.message || 'Login failed.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <header className="site-header">
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center text-decoration-none">
            <div className="logo-circle"><i className="bi bi-tools"></i></div>
            <span className="fs-5 text-white fw-bold" style={{ letterSpacing: '0.5px', fontFamily: "'Playfair Display', serif" }}>BURHANI HARDWARE</span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            <a href="tel:+917742752753"
              className="d-flex align-items-center gap-2 text-decoration-none fw-bold text-dark bg-warning px-3 py-2"
              style={{ borderRadius: '12px', fontSize: '0.78rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              <i className="bi bi-telephone-fill"></i><span className="d-none d-sm-inline">Contact</span>
            </a>
            <Link to="/" className="text-white-50 text-decoration-none small fw-bold">HOME</Link>
          </div>
        </div>
      </header>

      <div className="auth-container">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="text-muted small mb-2">Enter details to login.</p>

          {/* Google Sign In */}
          <div className="mb-2">
            <a href="/accounts/google/login/?process=login" className="btn-google">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="me-2" width="18" />
              Sign in with Google
            </a>
            <div className="divider"><span>Or login with password</span></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="form-label" style={{ marginBottom: '0.2rem' }}>Phone Number</label>
              <div className="input-group" style={{ borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #eee', transition: '0.3s' }}>
                <span className="input-group-text" style={{ background: '#fdfdfd', border: 'none', color: '#999', padding: '0 1.2rem' }}>
                  <i className="bi bi-telephone"></i>
                </span>
                <input type="tel" className="form-control" placeholder="+91 XXXXX XXXXX"
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  style={{ border: 'none', padding: '0.5rem 0.8rem', fontSize: '0.9rem' }} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ marginBottom: '0.2rem' }}>Password</label>
              <div className="input-group" style={{ borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #eee', transition: '0.3s' }}>
                <span className="input-group-text" style={{ background: '#fdfdfd', border: 'none', color: '#999', padding: '0 1.2rem' }}>
                  <i className="bi bi-key"></i>
                </span>
                <input type="password" className="form-control" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ border: 'none', padding: '0.5rem 0.8rem', fontSize: '0.9rem' }} required />
              </div>
            </div>
            <button type="submit" className="btn-auth" disabled={loading} style={{ marginTop: 0 }}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              Secure Login
            </button>
          </form>
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
