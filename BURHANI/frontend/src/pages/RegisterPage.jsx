import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';

export default function RegisterPage({ setToasts }) {
  const [form, setForm] = useState({ first_name: '', username: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    const phone = form.username.replace(/\D/g, '');
    if (phone.length !== 10) {
      setToasts((t) => [...t, { tag: 'error', text: 'Enter a valid 10-digit phone number.' }]);
      return;
    }
    const res = await apiPost('/api/react/send-otp/', { phone });
    if (res.status === 'success') {
      setOtpSent(true);
      setToasts((t) => [...t, { tag: 'success', text: 'OTP sent to your phone!' }]);
      startCooldown(60);
    } else if (res.status === 'cooldown') {
      setToasts((t) => [...t, { tag: 'warning', text: res.message }]);
    } else {
      setToasts((t) => [...t, { tag: 'error', text: res.message || 'OTP failed.' }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setToasts((t) => [...t, { tag: 'error', text: 'Passwords do not match.' }]);
      return;
    }
    if (!otpSent) {
      setToasts((t) => [...t, { tag: 'warning', text: 'Please send and enter the OTP to verify your mobile number.' }]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost('/api/react/register/', {
        first_name: form.first_name,
        username: form.username,
        password: form.password,
        otp,
      });
      if (res.status === 'success') {
        setToasts((t) => [...t, { tag: 'success', text: 'Account created successfully! Please sign in.' }]);
        navigate('/login');
      } else {
        setToasts((t) => [...t, { tag: 'error', text: res.message || 'Registration failed.' }]);
      }
    } catch {
      setToasts((t) => [...t, { tag: 'error', text: 'Server connection error during registration.' }]);
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
                <i className="bi bi-award-fill"></i>
              </div>
              <h1 className="auth-showcase-title">
                Join Central India's Industrial Network.
              </h1>
              <p className="auth-showcase-subtitle">
                Create a contractor or personal buyer account to unlock special rate tiers, express priority logistics, and official GST purchase records.
              </p>

              <div className="auth-features-list">
                <div className="auth-feature-pill">
                  <div className="auth-feature-icon">
                    <i className="bi bi-tags-fill"></i>
                  </div>
                  <div>
                    <div className="auth-feature-title">Contractor &amp; Wholesale Rates</div>
                    <div className="auth-feature-desc">Exclusive tier pricing for builders, fabricators and workshops.</div>
                  </div>
                </div>

                <div className="auth-feature-pill">
                  <div className="auth-feature-icon">
                    <i className="bi bi-truck"></i>
                  </div>
                  <div>
                    <div className="auth-feature-title">Priority Transport Dispatch</div>
                    <div className="auth-feature-desc">Same-day packaging and fast dispatch to your site or workshop.</div>
                  </div>
                </div>

                <div className="auth-feature-pill">
                  <div className="auth-feature-icon">
                    <i className="bi bi-shield-fill-check"></i>
                  </div>
                  <div>
                    <div className="auth-feature-title">100% Verified Warranties</div>
                    <div className="auth-feature-desc">Genuine factory parts with verified manufacturer guarantees.</div>
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
                <i className="bi bi-person-plus-fill"></i>
              </div>
              <h2 className="auth-form-title">Create Free Account</h2>
              <p className="auth-form-subtitle">Register in seconds with phone verification</p>
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
              <span>Sign up with Google</span>
            </a>

            {/* Divider */}
            <div className="auth-divider">
              <hr />
              <span>or register with mobile</span>
              <hr />
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label className="auth-label">
                  <i className="bi bi-person"></i> Full Name
                </label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter your full name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">
                  <i className="bi bi-phone"></i> Mobile Phone Number
                </label>
                <div className="auth-input-group">
                  <div className="auth-input-wrapper flex-grow-1">
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="10-digit phone number"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                      autoComplete="tel"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={cooldown > 0}
                    className="auth-addon-btn"
                  >
                    {cooldown > 0 ? (
                      `${cooldown}s`
                    ) : otpSent ? (
                      <>
                        <i className="bi bi-arrow-repeat me-1"></i> Resend
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-1"></i> Send OTP
                      </>
                    )}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="auth-field-group">
                  <label className="auth-label">
                    <i className="bi bi-shield-check"></i> Verification Code (OTP)
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Enter 6-digit OTP (use 000000 for demo)"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="auth-field-group">
                <label className="auth-label">
                  <i className="bi bi-shield-lock"></i> Password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="auth-input"
                    style={{ paddingRight: '44px' }}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="new-password"
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

              <div className="auth-field-group">
                <label className="auth-label">
                  <i className="bi bi-check-circle"></i> Confirm Password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || !otpSent}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="auth-card-footer">
              <div className="auth-switch-text">
                <span>Already have an account? </span>
                <Link to="/login">Sign In &rarr;</Link>
              </div>

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
