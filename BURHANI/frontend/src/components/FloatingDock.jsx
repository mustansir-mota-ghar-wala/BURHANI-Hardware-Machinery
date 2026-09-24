import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost, apiPostForm } from '../utils/api';

export default function FloatingDock() {
  const { user, cartCount, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Search Modal state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [micListening, setMicListening] = useState(false);

  // AI Chatbot Modal state
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your Burhani Hardware AI assistant 🔧 Ask me about any tool, machine, or part!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const messagesEndRef = useRef(null);

  // User Account Popover state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const isAuthenticated = Boolean(user && (user.is_authenticated || user.username));

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (aiChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, aiChatOpen]);

  // Close account menu popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        if (!e.target.closest('.user-menu-toggle-btn')) {
          setUserMenuOpen(false);
        }
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [userMenuOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
    }
  };

  const startVoiceSearch = async () => {
    setMicListening(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');
        formData.append('language', 'en');
        try {
          const res = await apiPostForm('/api/transcribe/', formData);
          if (res.status === 'success' && res.text) {
            const q = res.text.replace(/[.,!?]+$/, '').trim();
            navigate(`/?q=${encodeURIComponent(q)}`);
            setSearchOpen(false);
          }
        } catch (err) {
          console.error(err);
        }
        setMicListening(false);
      };
      mediaRecorder.start();
      setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 4000);
    } catch {
      alert('Microphone permission denied.');
      setMicListening(false);
    }
  };

  const handleVisualSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiPostForm('/api/visual-search/', formData);
      if (res.status === 'success' && res.keywords?.length) {
        navigate(`/?q=${encodeURIComponent(res.keywords.join(' '))}`);
        setSearchOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chat message send
  const sendChatMessage = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const data = await apiPost('/api/chat/', { message: text, language });
      if (data.status === 'success') {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: data.reply, productsHtml: data.products_html }
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'bot', text: 'Sorry, unable to answer right now.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Network error. Please try again.' }]);
    }
    setChatLoading(false);
  };

  return (
    <>
      {/* ── Left Floating Expanding Dock (Desktop) ── */}
      <aside className="floating-dock-aside d-none d-lg-flex" aria-label="Quick Navigation">
        <div className="floating-dock-container expanding-dock">
          
          {/* 1. Home Item */}
          <Link
            to="/"
            className={`dock-row-link ${isActive('/') ? 'active' : ''}`}
            title="Storefront"
          >
            <div className="dock-icon-bubble">
              <i className="bi bi-house-door-fill"></i>
            </div>
            <div className="dock-expanded-text">
              <span className="dock-item-title">Storefront</span>
              <span className="dock-item-desc">Featured tools &amp; equipment</span>
            </div>
          </Link>

          {/* 2. Search Item */}
          <button
            type="button"
            className="dock-row-link"
            onClick={() => setSearchOpen(true)}
            title="Search Catalog"
          >
            <div className="dock-icon-bubble">
              <i className="bi bi-search"></i>
            </div>
            <div className="dock-expanded-text">
              <span className="dock-item-title">Search</span>
              <span className="dock-item-desc">Voice &amp; visual scan</span>
            </div>
          </button>

          {/* 3. Orders Item */}
          <Link
            to="/your_orders"
            className={`dock-row-link ${isActive('/your_orders') ? 'active' : ''}`}
            title="Your Orders"
          >
            <div className="dock-icon-bubble">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="dock-expanded-text">
              <span className="dock-item-title">Orders</span>
              <span className="dock-item-desc">Track shipments &amp; invoices</span>
            </div>
          </Link>

          {/* 4. Ask AI Assistant Item (Moved inside dock!) */}
          <button
            type="button"
            className={`dock-row-link ai-dock-row ${aiChatOpen ? 'active' : ''}`}
            onClick={() => setAiChatOpen((o) => !o)}
            title="AI Hardware Assistant"
          >
            <div className="dock-icon-bubble ai-icon-bubble">
              <i className="bi bi-stars"></i>
            </div>
            <div className="dock-expanded-text">
              <span className="dock-item-title text-success">Ask AI</span>
              <span className="dock-item-desc">Instant tool consultation</span>
            </div>
          </button>

          {/* 5. Business ERP Item (for staff/owner) */}
          {(user?.is_staff || user?.is_owner || user?.is_superuser) && (
            <Link
              to="/business"
              className={`dock-row-link ${isActive('/business') ? 'active' : ''}`}
              title="Business ERP Panel"
            >
              <div className="dock-icon-bubble erp-icon-bubble">
                <i className="bi bi-speedometer2"></i>
              </div>
              <div className="dock-expanded-text">
                <span className="dock-item-title" style={{ color: '#047857' }}>Business ERP</span>
                <span className="dock-item-desc">POS billing &amp; GST reports</span>
              </div>
            </Link>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }}></div>

          {/* 6. User Profile / Account Item */}
          {isAuthenticated ? (
            <div className="w-100 position-relative">
              <button
                className={`dock-row-link user-menu-toggle-btn w-100 border-0 bg-transparent text-start ${userMenuOpen ? 'active' : ''}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen((prev) => !prev);
                }}
                title={`Account: ${user.first_name || user.username} - Click for menu`}
              >
                <div className="dock-icon-bubble user-avatar-bubble">
                  {(user.first_name || user.username || 'U')[0].toUpperCase()}
                </div>
                <div className="dock-expanded-text">
                  <span className="dock-item-title text-truncate">{user.first_name || user.username}</span>
                  <span className="dock-item-desc">
                    {userMenuOpen ? 'Click to close menu' : 'Account & session'}
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <Link to="/login" className="dock-row-link" title="Sign In">
              <div className="dock-icon-bubble">
                <i className="bi bi-person"></i>
              </div>
              <div className="dock-expanded-text">
                <span className="dock-item-title">Sign In</span>
                <span className="dock-item-desc">Login to your account</span>
              </div>
            </Link>
          )}

        </div>
      </aside>

      {/* ── Modern User Account Popover Card (Desktop & Mobile) ── */}
      {isAuthenticated && userMenuOpen && (
        <div className="dock-account-popover" ref={userMenuRef}>
          <div className="account-popover-header">
            <div className="account-popover-avatar">
              {(user.first_name || user.username || 'U')[0].toUpperCase()}
            </div>
            <div className="account-popover-user-info">
              <div className="account-popover-name text-truncate">
                {user.first_name || user.username}
              </div>
              <div className="account-popover-subtext text-truncate">
                {user.username}
              </div>
            </div>
            <button
              type="button"
              className="account-popover-close-btn"
              onClick={() => setUserMenuOpen(false)}
              title="Close account menu"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>

          <div className="account-popover-divider"></div>

          <div className="account-popover-menu-list">
            <Link
              to="/your_orders"
              className="account-popover-item"
              onClick={() => setUserMenuOpen(false)}
            >
              <div className="account-popover-item-icon blue">
                <i className="bi bi-box-seam-fill"></i>
              </div>
              <div className="account-popover-item-text">
                <span className="account-popover-item-title">Your Orders</span>
                <span className="account-popover-item-desc">Track and view history</span>
              </div>
              <i className="bi bi-chevron-right ms-auto text-muted small"></i>
            </Link>

            {(user.is_staff || user.is_owner || user.is_superuser) && (
              <Link
                to="/business"
                className="account-popover-item"
                onClick={() => setUserMenuOpen(false)}
              >
                <div className="account-popover-item-icon emerald">
                  <i className="bi bi-speedometer2"></i>
                </div>
                <div className="account-popover-item-text">
                  <span className="account-popover-item-title">Business Panel</span>
                  <span className="account-popover-item-desc">Store ERP &amp; inventory</span>
                </div>
                <i className="bi bi-chevron-right ms-auto text-muted small"></i>
              </Link>
            )}

            <button
              type="button"
              className="account-popover-item sign-out-btn"
              onClick={async () => {
                setUserMenuOpen(false);
                await logout();
                navigate('/');
              }}
            >
              <div className="account-popover-item-icon red">
                <i className="bi bi-box-arrow-right"></i>
              </div>
              <div className="account-popover-item-text">
                <span className="account-popover-item-title text-danger">Sign Out</span>
                <span className="account-popover-item-desc">End your active session</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Top-Right Floating Bag Button with Hover Tooltip ── */}
      <div className="floating-cart-pill-wrapper">
        <Link to="/cart" className="floating-cart-pill" title="View Shopping Cart">
          <i className="bi bi-bag"></i>
          {cartCount > 0 && <span className="cart-badge-pill">{cartCount}</span>}
        </Link>
        <div className="cart-hover-tooltip">
          <span>{cartCount > 0 ? `${cartCount} items in cart` : 'Cart is empty'}</span>
        </div>
      </div>

      {/* ── Search Modal Overlay ── */}
      {searchOpen && (
        <div className="search-modal-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                <i className="bi bi-search text-success"></i> Search Burhani Store
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSearchOpen(false)}
                aria-label="Close"
              ></button>
            </div>

            <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
              <i className="bi bi-search search-icon-left"></i>
              <input
                type="text"
                className="search-main-input"
                placeholder="Search tools, machinery, welding, chainsaws..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="search-actions-right">
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className={`search-action-btn ${micListening ? 'listening' : ''}`}
                  title="Voice Search"
                >
                  <i className={`bi ${micListening ? 'bi-mic-fill' : 'bi-mic'}`}></i>
                </button>
                <label className="search-action-btn m-0" title="Visual Image Search">
                  <i className="bi bi-camera"></i>
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleVisualSearch}
                  />
                </label>
                <button type="submit" className="btn btn-success rounded-pill px-3 py-1 btn-sm">
                  Search
                </button>
              </div>
            </form>

            <div className="mt-3 d-flex flex-wrap gap-2 align-items-center">
              <span className="text-muted small">Popular:</span>
              {['Welding Machine', 'Angle Grinder', 'Chainsaw', 'Drill Machine', 'Water Pump'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="quick-tag-chip"
                  onClick={() => {
                    navigate(`/?q=${encodeURIComponent(tag)}`);
                    setSearchOpen(false);
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Assistant Glass Modal (Triggered directly from Left Dock) ── */}
      {aiChatOpen && (
        <div className="ai-chat-dock-panel" onClick={(e) => e.stopPropagation()}>
          <div className="ai-chat-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="ai-avatar-badge">
                <i className="bi bi-stars"></i>
              </div>
              <div>
                <div className="fw-bold text-dark small" style={{ lineHeight: 1.2 }}>Burhani AI Assistant</div>
                <div className="text-muted" style={{ fontSize: '0.68rem' }}>Hardware &amp; Machinery Specialist</div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Language toggle */}
              <div className="ai-lang-toggle">
                <button
                  type="button"
                  className={language === 'english' ? 'active' : ''}
                  onClick={() => setLanguage('english')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={language === 'hindi' ? 'active' : ''}
                  onClick={() => setLanguage('hindi')}
                >
                  हिं
                </button>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={() => setAiChatOpen(false)}
                aria-label="Close"
              ></button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="ai-chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-bubble-row ${msg.role}`}>
                <div className={`ai-bubble ${msg.role}`}>
                  {msg.text}
                </div>
                {msg.productsHtml && (
                  <div
                    className="ai-products-preview mt-2"
                    dangerouslySetInnerHTML={{ __html: msg.productsHtml }}
                    onClick={(e) => {
                      const link = e.target.closest('a');
                      if (link && link.getAttribute('href')) {
                        e.preventDefault();
                        navigate(link.getAttribute('href'));
                        setAiChatOpen(false);
                      }
                    }}
                  />
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="ai-bubble-row bot">
                <div className="ai-bubble bot">
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Analyzing catalog...
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Chat Input */}
          <form onSubmit={sendChatMessage} className="ai-chat-input-row">
            <input
              type="text"
              className="ai-chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about tools, chainsaw, welding..."
              disabled={chatLoading}
              autoFocus
            />
            <button
              type="submit"
              className="ai-send-btn"
              disabled={chatLoading || !chatInput.trim()}
              title="Send message"
            >
              <i className="bi bi-arrow-up"></i>
            </button>
          </form>
        </div>
      )}

      {/* ── Mobile Bottom Floating Dock (< 992px) ── */}
      <nav className="mobile-floating-dock d-flex d-lg-none" aria-label="Mobile Navigation">
        <Link to="/" className={`mobile-dock-item ${isActive('/') ? 'active' : ''}`}>
          <i className="bi bi-house-door-fill"></i>
          <span>Home</span>
        </Link>
        <button
          type="button"
          className="mobile-dock-item"
          onClick={() => setSearchOpen(true)}
        >
          <i className="bi bi-search"></i>
          <span>Search</span>
        </button>
        <button
          type="button"
          className={`mobile-dock-item ${aiChatOpen ? 'active' : ''}`}
          onClick={() => setAiChatOpen((o) => !o)}
        >
          <i className="bi bi-stars text-success"></i>
          <span>AI Help</span>
        </button>
        <Link to="/cart" className={`mobile-dock-item position-relative ${isActive('/cart') ? 'active' : ''}`}>
          <i className="bi bi-bag"></i>
          <span>Cart</span>
          {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
        </Link>
        <Link to="/your_orders" className={`mobile-dock-item ${isActive('/your_orders') ? 'active' : ''}`}>
          <i className="bi bi-box-seam"></i>
          <span>Orders</span>
        </Link>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className={`mobile-dock-item user-menu-toggle-btn ${userMenuOpen ? 'active' : ''}`}
            title="Account Menu"
          >
            <div className="mobile-avatar-circle">
              {(user.first_name || user.username || 'U')[0].toUpperCase()}
            </div>
            <span>Account</span>
          </button>
        ) : (
          <Link to="/login" className={`mobile-dock-item ${isActive('/login') ? 'active' : ''}`}>
            <i className="bi bi-person"></i>
            <span>Login</span>
          </Link>
        )}
      </nav>
    </>
  );
}
