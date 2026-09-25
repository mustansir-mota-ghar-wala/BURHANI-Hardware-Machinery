import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ setToasts }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiPost('/api/react/login/', form);
      if (res.status === 'success') {
        await fetchUser();
        setToasts((t) => [...t, { tag: 'success', text: `Welcome back, ${res.first_name || res.username}!` }]);
        navigate('/');
      } else {
        setToasts((t) => [...t, { tag: 'error', text: res.message || 'Login failed.' }]);
      }
    } catch {
      setToasts((t) => [...t, { tag: 'error', text: 'Server connection error during login.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container login-glass-canvas">
        {/* Compact Top Header Bar */}
        <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-0.5">
              <span className="badge bg-success-subtle text-success px-2 py-0.5 rounded-pill small fw-bold" style={{ fontSize: '0.72rem' }}>
                Customer &amp; Business Account
              </span>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>&bull; Burhani Hardware</span>
            </div>
            <h3 className="section-title m-0 fs-5" style={{ fontFamily: "'Playfair Display', serif", color: '#0d3829' }}>
              Sign In to Your Account
            </h3>
          </div>

          <div className="d-flex align-items-center gap-2">
            <a
              href="tel:+917742752753"
              className="btn btn-outline-success btn-sm rounded-pill px-2.5 py-1 fw-semibold d-flex align-items-center gap-1"
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-telephone-fill"></i> +91 77427 52753
            </a>
            <Link
              to="/"
              className="btn btn-dark btn-sm rounded-pill px-2.5 py-1 fw-semibold d-flex align-items-center gap-1"
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-arrow-left"></i> Back to Store
            </Link>
          </div>
        </div>

        {/* Centered Clean Sign In Card */}
        <div className="row justify-content-center my-3">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div
              className="p-3.5 p-md-4 rounded-4 bg-white shadow-sm"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-2.5">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ffc107 0%, #e67e22 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0a110f',
                    fontSize: '1.05rem',
                    boxShadow: '0 3px 10px rgba(255,193,7,0.25)',
                    flexShrink: 0,
                  }}
                >
                  <i className="bi bi-person-lock"></i>
                </div>
                <div>
                  <h4 className="fw-bold m-0 text-dark fs-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Welcome Back
                  </h4>
                  <p className="text-muted small m-0" style={{ fontSize: '0.75rem' }}>Sign in to manage orders</p>
                </div>
              </div>

              {/* Google SSO Button */}
              <a
                href="/accounts/google/login/?process=login"
                className="btn btn-light w-100 py-1.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border fw-semibold mb-2 transition-all"
                style={{ background: '#f8fafc', fontSize: '0.82rem' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>

              {/* Divider */}
              <div className="d-flex align-items-center gap-2 my-1.5">
                <hr className="flex-grow-1 m-0 text-muted opacity-25" />
                <span className="text-muted small text-uppercase" style={{ fontSize: '0.66rem', letterSpacing: '0.5px' }}>
                  or phone &amp; password
                </span>
                <hr className="flex-grow-1 m-0 text-muted opacity-25" />
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-2">
                <div>
                  <label className="form-label small fw-bold text-dark mb-0.5" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-telephone me-1 text-success"></i> Phone Number / Username
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-1.5 px-2.5 border"
                    style={{ background: '#f8fafc', fontSize: '0.82rem' }}
                    placeholder="10-digit phone or username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="form-label small fw-bold text-dark mb-0.5" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-key me-1 text-success"></i> Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control rounded-3 py-1.5 px-2.5 pe-5 border"
                      style={{ background: '#f8fafc', fontSize: '0.82rem' }}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted position-absolute top-50 end-0 translate-middle-y me-2 p-1 text-decoration-none"
                      onClick={() => setShowPass((v) => !v)}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success rounded-pill py-1.5 fw-bold text-white shadow-sm mt-1 d-flex align-items-center justify-content-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #0d3829 0%, #16a34a 100%)',
                    border: 'none',
                    fontSize: '0.85rem',
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i>
                      <span>Secure Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer links */}
              <div className="text-center mt-2.5 pt-2 border-top small text-muted" style={{ fontSize: '0.75rem' }}>
                <span>Don't have an account? </span>
                <Link to="/register" className="text-success fw-bold text-decoration-none ms-1">
                  Create Account &rarr;
                </Link>
              </div>

              {/* Business ERP link */}
              <div className="text-center mt-1 small text-muted" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-speedometer2 me-1 text-secondary"></i>
                <span>Store Owner or Staff? </span>
                <Link to="/business" className="text-secondary fw-semibold text-decoration-none">
                  Open Business ERP &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
