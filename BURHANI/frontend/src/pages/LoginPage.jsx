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
        {/* Top Context Bar */}
        <div className="auth-top-bar">
          <div className="d-flex align-items-center gap-2">
            <span className="auth-brand-badge">
              <i className="bi bi-shield-check"></i> Official Burhani Storefront
            </span>
            <span className="text-muted small d-none d-sm-inline">&bull; Bhawani Mandi</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <a href="tel:+917742752753" className="auth-nav-link call-store">
              <i className="bi bi-telephone-fill"></i> +91 77427 52753
            </a>
            <Link to="/" className="auth-nav-link back-store">
              <i className="bi bi-arrow-left"></i> Back to Store
            </Link>
          </div>
        </div>

        {/* Main 2-Column Split Stage */}
        <div className="auth-stage-row">
          {/* Left Brand Showcase Panel */}
          <div className="auth-showcase-panel">
            <div>
              <div className="auth-emblem-badge">
                <i className="bi bi-tools"></i>
              </div>
              <h1 className="auth-showcase-title">
                Heavy Machinery &amp; Industrial Hardware.
              </h1>
              <p className="auth-showcase-subtitle">
                Sign in to manage machinery orders, track nationwide dispatches, and access contractor wholesale pricing.
              </p>

              <div className="auth-features-list">
                <div className="auth-feature-pill">
                  <div className="auth-feature-icon">
                    <i className="bi bi-lightning-charge-fill"></i>
                  </div>
                  <div>
                    <div className="auth-feature-title">Express Warehouse Dispatch</div>
                    <div className="auth-feature-desc">Fast dispatch for chainsaws, welders &amp; water motors.</div>
                  </div>
                </div>

                <div className="auth-feature-pill">
                  <div className="auth-feature-icon">
                    <i className="bi bi-patch-check-fill"></i>
                  </div>
                  <div>
                    <div className="auth-feature-title">100% Genuine Spare Parts</div>
                    <div className="auth-feature-desc">Authentic armatures, carburetors &amp; heavy-duty blades.</div>
                  </div>
                </div>

                <div className="auth-feature-pill">
                  <div className="auth-feature-icon">
                    <i className="bi bi-file-earmark-text-fill"></i>
                  </div>
                  <div>
                    <div className="auth-feature-title">GST Billing &amp; Contractor ERP</div>
                    <div className="auth-feature-desc">Instant digital invoices, purchase histories &amp; party ledgers.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-showcase-footer">
              <i className="bi bi-geo-alt-fill text-warning"></i>
              <span>Bhawani Mandi, Rajasthan &bull; Serving Rajasthan &amp; MP since 1998</span>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className="auth-form-badge">
                <i className="bi bi-person-lock"></i>
              </div>
              <h2 className="auth-form-title">Welcome Back</h2>
              <p className="auth-form-subtitle">Sign in to your customer or contractor account</p>
            </div>

            {/* Google SSO Button */}
            <a
              href="/accounts/google/login/?process=login"
              className="auth-google-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
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
            <div className="auth-divider">
              <hr />
              <span>or sign in with mobile</span>
              <hr />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label className="auth-label">
                  <i className="bi bi-phone"></i> Phone Number or Username
                </label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="10-digit phone or username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="auth-label m-0">
                    <i className="bi bi-shield-lock"></i> Password
                  </label>
                </div>
                <div className="auth-input-wrapper">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="auth-input"
                    style={{ paddingRight: '44px' }}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-pass-toggle"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="auth-card-footer">
              <div className="auth-switch-text">
                <span>Don't have an account yet? </span>
                <Link to="/register">Create Free Account &rarr;</Link>
              </div>

              <Link to="/business" className="auth-erp-pill">
                <i className="bi bi-speedometer2 text-success"></i>
                <span>Staff &amp; Owner? Open Business ERP Suite</span>
              </Link>

              <div className="auth-trust-note">
                <i className="bi bi-lock-fill text-success"></i>
                <span>256-Bit SSL Encrypted &bull; Official Burhani Hardware Portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
