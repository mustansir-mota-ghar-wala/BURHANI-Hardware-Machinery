import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPostForm } from '../utils/api';

export default function Navbar({ query, setQuery, mobileMenuOpen, setMobileMenuOpen }) {
  const { user, cartCount, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchMicListening, setSearchMicListening] = useState(false);
  const offcanvasRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleDesktopSearch = (e) => {
    e.preventDefault();
    const q = e.target.elements.q.value;
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
    setMobileMenuOpen(false);
  };

  const startVoiceSearch = async (inputId, micIconId) => {
    const micIcon = document.getElementById(micIconId);
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;

    const originalPlaceholder = searchInput.placeholder;

    if (micIcon) micIcon.className = 'spinner-grow spinner-grow-sm';
    searchInput.placeholder = 'Listening...';
    setSearchMicListening(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice_search.webm');
        formData.append('language', 'en');
        try {
          const data = await apiPostForm('/api/transcribe/', formData);
          if (data.status === 'success' && data.text) {
            const q = data.text.replace(/[.,!?]+$/, '').trim();
            navigate(`/?q=${encodeURIComponent(q)}`);
          }
        } catch (err) { console.error(err); }
        if (micIcon) micIcon.className = 'bi bi-mic-fill fs-5';
        searchInput.placeholder = originalPlaceholder;
        setSearchMicListening(false);
      };

      mediaRecorder.start();
      setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 5000);
    } catch {
      alert('Microphone access denied.');
      if (micIcon) micIcon.className = 'bi bi-mic-fill fs-5';
      searchInput.placeholder = originalPlaceholder;
      setSearchMicListening(false);
    }
  };

  return (
    <>
      {/* ── Main Header ── */}
      <header className="site-header" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1050, padding: '8px 0', background: 'var(--gg-header)' }}>
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center text-decoration-none">
            <div className="logo-circle">
              <i className="bi bi-tools fs-5"></i>
            </div>
            <span className="heading-font fs-5 text-white d-none d-sm-inline" style={{ letterSpacing: '0.5px' }}>BURHANI HARDWARE</span>
            <span className="heading-font fs-5 text-white d-inline d-sm-none" style={{ letterSpacing: '0.5px' }}>BURHANI</span>
          </Link>

          {/* Desktop nav links */}
          <div className="d-none d-lg-flex nav-links">
            <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
            <a href="/#categories">Shop Tools</a>
            <Link to="/your_orders" className={isActive('/your_orders') ? 'active' : ''}>My Orders</Link>
            <a href="/#about">About Us</a>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Contact button */}
            <a href="tel:+917742752753"
              className="d-flex align-items-center gap-2 text-decoration-none fw-bold text-dark bg-warning px-3 py-2"
              style={{ borderRadius: '12px', fontSize: '0.78rem', letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              <i className="bi bi-telephone-fill"></i>
              <span className="d-none d-sm-inline">Contact</span>
              <span className="d-none d-xl-inline">+91 77427 52753</span>
            </a>

            {/* Desktop auth */}
            <div className="d-none d-lg-flex gap-3 fs-5 align-items-center me-3">
              {user ? (
                <>
                  <span className="fs-6 fw-bold text-white-50">Hi, {user.first_name || user.username}</span>
                  <button onClick={logout} className="text-white text-decoration-none fs-6 fw-bold bg-transparent border-0 cursor-pointer">LOGOUT</button>
                </>
              ) : (
                <Link to="/login" className="text-white text-decoration-none fs-6 fw-bold">LOGIN</Link>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className="text-white fs-5">
              <i className="bi bi-cart3 position-relative">
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.5rem' }}>
                    {cartCount}
                  </span>
                )}
              </i>
            </Link>

            {/* Mobile hamburger */}
            <button className="btn btn-link text-white d-lg-none fs-4 p-0 ms-2"
              onClick={() => setMobileMenuOpen(true)}>
              <i className="bi bi-list"></i>
            </button>
          </div>
        </div>
      </header>

      {/* ── Floating Desktop Search ── */}
      <div className="floating-search d-none d-lg-block">
        <form onSubmit={handleDesktopSearch}
          className="d-flex align-items-center bg-white rounded-pill px-4 py-2 shadow-lg"
          style={{ width: '520px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 15px 35px rgba(0,0,0,0.15) !important' }}>
          <i className="bi bi-search text-muted me-3 fs-5"></i>
          <input type="text" id="desktopSearchInput" name="q"
            placeholder="Search for any tool or machinery..."
            defaultValue={query || ''}
            className="border-0 bg-transparent text-dark w-100"
            style={{ outline: 'none', fontSize: '1.05rem' }} />
          <button type="button" onClick={() => startVoiceSearch('desktopSearchInput', 'searchMicIcon')}
            className="btn btn-light rounded-circle p-2 mx-1 d-flex align-items-center justify-content-center border-0"
            style={{ width: '42px', height: '42px', color: '#dc3545', background: 'rgba(220,53,69,0.15)' }}>
            <i className="bi bi-mic-fill fs-5" id="searchMicIcon"></i>
          </button>
          <button type="submit" className="btn btn-warning rounded-pill px-4 fw-bold" style={{ fontSize: '0.9rem' }}>Search</button>
        </form>
      </div>

      {/* ── Mobile Offcanvas Bottom Sheet ── */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050 }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 'auto', maxHeight: '85vh',
            borderRadius: '28px 28px 0 0',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(245,247,246,0.98) 100%)',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(20px)',
            overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            {/* Drag handle */}
            <div className="d-flex justify-content-center" style={{ paddingTop: '12px', paddingBottom: '6px' }}>
              <div style={{ width: '36px', height: '4.5px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}></div>
            </div>

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between border-bottom border-light-subtle px-3 pb-3">
              <h5 className="offcanvas-title heading-font text-dark d-flex align-items-center gap-2 mb-0"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 900 }}>
                <i className="bi bi-grid-fill text-warning fs-5"></i> Navigation Menu
              </h5>
              <button className="btn-close" onClick={() => setMobileMenuOpen(false)}></button>
            </div>

            {/* Body */}
            <div className="px-3 py-3">
              <div className="d-flex flex-column" style={{ gap: '10px' }}>
                {[
                  { to: '/', icon: 'bi-house-door-fill', label: 'Home', iconBg: 'rgba(255,193,7,0.15)', iconColor: '#ffc107' },
                  { to: '/#categories', icon: 'bi-tools', label: 'Shop Tools', iconBg: 'rgba(255,193,7,0.15)', iconColor: '#ffc107' },
                  { to: '/your_orders', icon: 'bi-bag-check-fill', label: 'My Orders', iconBg: 'rgba(25,135,84,0.15)', iconColor: '#198754' },
                  { to: '/#about', icon: 'bi-info-circle-fill', label: 'About Us', iconBg: 'rgba(13,110,253,0.15)', iconColor: '#0d6efd' },
                ].map(({ to, icon, label, iconBg, iconColor }) => (
                  <Link key={to} to={to}
                    className="d-flex align-items-center justify-content-between text-decoration-none text-dark"
                    style={{ background: 'rgba(11,34,22,0.04)', borderRadius: '12px', border: '1px solid rgba(11,34,22,0.05)', padding: '12px 16px' }}
                    onClick={() => setMobileMenuOpen(false)}>
                    <div className="d-flex align-items-center gap-3">
                      <span className="d-flex align-items-center justify-content-center rounded-3"
                        style={{ width: '34px', height: '34px', background: iconBg, color: iconColor, flexShrink: 0 }}>
                        <i className={`bi ${icon} fs-5`}></i>
                      </span>
                      <span className="fw-semibold text-dark" style={{ fontSize: '0.92rem' }}>{label}</span>
                    </div>
                    <i className="bi bi-chevron-right text-black-50 small"></i>
                  </Link>
                ))}

                <div className="my-1 border-top border-light-subtle opacity-75"></div>

                {/* Contact */}
                <div className="d-flex flex-column" style={{ gap: '8px' }}>
                  <div className="text-black-50 small fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</div>
                  <div className="d-flex gap-2">
                    <a href="tel:+917742752753"
                      className="d-flex align-items-center justify-content-center flex-grow-1 text-decoration-none text-dark"
                      style={{ background: 'rgba(11,34,22,0.04)', borderRadius: '12px', border: '1px solid rgba(11,34,22,0.05)', padding: '10px', gap: '8px' }}>
                      <span className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: '28px', height: '28px', background: 'rgba(13,110,253,0.15)', color: '#0d6efd' }}>
                        <i className="bi bi-telephone-fill small"></i>
                      </span>
                      <span className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>+91 77427 52753</span>
                    </a>
                    <a href="https://wa.me/917742752753" target="_blank" rel="noopener"
                      className="d-flex align-items-center justify-content-center flex-grow-1 text-decoration-none text-dark"
                      style={{ background: 'rgba(11,34,22,0.04)', borderRadius: '12px', border: '1px solid rgba(11,34,22,0.05)', padding: '10px', gap: '8px' }}>
                      <span className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: '28px', height: '28px', background: 'rgba(25,135,84,0.15)', color: '#198754' }}>
                        <i className="bi bi-whatsapp small"></i>
                      </span>
                      <span className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="my-1 border-top border-light-subtle opacity-75"></div>

                {/* Auth section */}
                {user ? (
                  <div className="d-flex align-items-center justify-content-between"
                    style={{ background: 'linear-gradient(135deg, rgba(11,34,22,0.04) 0%, rgba(11,34,22,0.01) 100%)', borderRadius: '16px', border: '1px solid rgba(11,34,22,0.06)', padding: '14px' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
                        style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, var(--gg-accent) 0%, #d35400 100%)', fontSize: '1.1rem', flexShrink: 0 }}>
                        {(user.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-black-50 small fw-medium" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</div>
                        <h4 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{user.first_name || user.username}</h4>
                      </div>
                    </div>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1"
                      style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem' }}>
                      <i className="bi bi-box-arrow-right"></i> Logout
                    </button>
                  </div>
                ) : (
                  <Link to="/login"
                    className="btn btn-warning w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: '12px', fontSize: '0.88rem' }}
                    onClick={() => setMobileMenuOpen(false)}>
                    <i className="bi bi-box-arrow-in-right fs-5"></i> Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
