import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost, apiPostForm } from '../utils/api';

export default function RegisterPage({ setToasts }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [form, setForm] = useState({ first_name: '', username: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
    const timer = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    const phone = form.username.replace(/\D/g, '');
    if (phone.length !== 10) { setToasts(t => [...t, { tag: 'error', text: 'Enter a valid 10-digit phone number.' }]); return; }
    const res = await apiPost('/api/react/send-otp/', { phone });
    if (res.status === 'success') {
      setOtpSent(true);
      setToasts(t => [...t, { tag: 'success', text: 'OTP sent to your phone!' }]);
      startCooldown(60);
    } else if (res.status === 'cooldown') {
      setToasts(t => [...t, { tag: 'warning', text: res.message }]);
    } else {
      setToasts(t => [...t, { tag: 'error', text: res.message || 'OTP failed.' }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setToasts(t => [...t, { tag: 'error', text: 'Passwords do not match.' }]); return;
    }
    setLoading(true);
    const res = await apiPost('/api/react/register/', {
      first_name: form.first_name,
      username: form.username,
      password: form.password,
      otp,
    });
    if (res.status === 'success') {
      setToasts(t => [...t, { tag: 'success', text: 'Account created! Please login.' }]);
      navigate('/login');
    } else {
      setToasts(t => [...t, { tag: 'error', text: res.message || 'Registration failed.' }]);
    }
    setLoading(false);
  };

  const inputGroupStyle = { borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #eee', transition: '0.3s' };
  const spanStyle = { background: '#fdfdfd', border: 'none', color: '#999', padding: '0 1.2rem' };
  const inputStyle = { border: 'none', padding: '0.5rem 0.8rem', fontSize: '0.9rem' };

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
              style={{ borderRadius: '12px', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <i className="bi bi-telephone-fill"></i><span className="d-none d-sm-inline">Contact</span>
            </a>
            <Link to="/" className="text-white-50 text-decoration-none small fw-bold">HOME</Link>
          </div>
        </div>
      </header>

      <div className="auth-container">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="text-muted small mb-2">Sign up to start shopping.</p>

          {/* Google */}
          <div className="mb-2">
            <a href="/accounts/google/login/?process=login" className="btn-google">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="me-2" width="18" />
              Sign up with Google
            </a>
            <div className="divider"><span>Or register with phone</span></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="form-label" style={{ marginBottom: '0.2rem' }}>Full Name</label>
              <div className="input-group" style={inputGroupStyle}>
                <span className="input-group-text" style={spanStyle}><i className="bi bi-person"></i></span>
                <input type="text" className="form-control" placeholder="Your full name"
                  value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })}
                  style={inputStyle} required />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ marginBottom: '0.2rem' }}>Phone Number</label>
              <div className="d-flex gap-2">
                <div className="input-group flex-grow-1" style={inputGroupStyle}>
                  <span className="input-group-text" style={spanStyle}><i className="bi bi-telephone"></i></span>
                  <input type="tel" className="form-control" placeholder="10-digit phone"
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    style={inputStyle} required />
                </div>
                <button type="button" onClick={sendOtp} disabled={cooldown > 0}
                  className="btn btn-warning fw-bold" style={{ borderRadius: '12px', whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>
                  {cooldown > 0 ? `${cooldown}s` : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="mb-2">
                <label className="form-label" style={{ marginBottom: '0.2rem' }}>OTP</label>
                <div className="input-group" style={inputGroupStyle}>
                  <span className="input-group-text" style={spanStyle}><i className="bi bi-shield-check"></i></span>
                  <input type="text" className="form-control" placeholder="6-digit OTP (use 000000 for test)"
                    value={otp} onChange={e => setOtp(e.target.value)}
                    style={inputStyle} maxLength={6} required />
                </div>
              </div>
            )}

            <div className="mb-2">
              <label className="form-label" style={{ marginBottom: '0.2rem' }}>Password</label>
              <div className="input-group" style={inputGroupStyle}>
                <span className="input-group-text" style={spanStyle}><i className="bi bi-key"></i></span>
                <input type="password" className="form-control" placeholder="Create a strong password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  style={inputStyle} required />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ marginBottom: '0.2rem' }}>Confirm Password</label>
              <div className="input-group" style={inputGroupStyle}>
                <span className="input-group-text" style={spanStyle}><i className="bi bi-key-fill"></i></span>
                <input type="password" className="form-control" placeholder="Repeat password"
                  value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  style={inputStyle} required />
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={loading || !otpSent} style={{ marginTop: 0 }}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              Create Account
            </button>
          </form>
          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
