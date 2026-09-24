import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BusinessLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      to: '/business',
      end: true,
      label: 'Dashboard',
      icon: (
        <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      ),
    },
    {
      to: '/business/products',
      label: 'Inventory & Stock',
      icon: (
        <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
    },
    {
      to: '/business/sales',
      label: 'Sales & Invoices',
      icon: (
        <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      ),
    },
    {
      to: '/business/purchases',
      label: 'Purchases & Inward',
      icon: (
        <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
    },
    {
      to: '/business/parties',
      label: 'Customers & Parties',
      icon: (
        <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      to: '/business/payments',
      label: 'Payments & Ledger',
      icon: (
        <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
    },
    {
      to: '/business/reports',
      label: 'GST & Reports',
      icon: (
        <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine header greeting/title based on current route
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/business') {
      const displayName = user?.first_name || user?.username || 'Mustansir';
      return {
        title: `Welcome, ${displayName}! 🎉`,
        sub: "Here's what happening in your store.",
      };
    }
    if (path.startsWith('/business/products')) {
      return { title: 'Inventory & Stock Management', sub: 'Manage items, stock counts, cost pricing, and GST tax slabs.' };
    }
    if (path.startsWith('/business/sales')) {
      return { title: 'Sales & Tax Invoices', sub: 'Create GST-compliant customer bills and track payments.' };
    }
    if (path.startsWith('/business/purchases')) {
      return { title: 'Purchases & Stock Inward', sub: 'Record incoming goods from suppliers and auto-recalculate inventory costs.' };
    }
    if (path.startsWith('/business/parties')) {
      return { title: 'Customers & Suppliers Directory', sub: 'Manage customer ledgers, supplier accounts, and outstanding balances.' };
    }
    if (path.startsWith('/business/payments')) {
      return { title: 'Payments & Cashbook Ledger', sub: 'Record collections from customers and disbursements to suppliers.' };
    }
    if (path.startsWith('/business/reports')) {
      return { title: 'GST & Business Reports', sub: 'GSTR-1, GSTR-3B tax calculations and profit statements.' };
    }
    return { title: 'Business ERP', sub: 'Store Management System' };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="starline-root d-flex" style={{ minHeight: '100vh', width: '100%' }}>
      {/* ── Mobile Backdrop ── */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ background: 'rgba(0,0,0,0.4)', zIndex: 1040, backdropFilter: 'blur(3px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Starline Left Sidebar ── */}
      <aside
        className={`starline-sidebar position-fixed top-0 start-0 h-100 ${sidebarOpen ? 'translate-middle-x-0' : ''}`}
        style={{
          width: '235px',
          background: '#E7E9ED',
          borderRight: '1px solid rgba(0,0,0,0.04)',
          zIndex: 1045,
          transition: 'transform 0.25s ease',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          overflowY: 'auto',
        }}>
        {/* Brand */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <Link to="/business" className="starline-brand-row">
            <svg className="starline-brand-icon" viewBox="0 0 24 24" fill="none" stroke="#111418" strokeWidth="2.6" strokeLinecap="round">
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line>
            </svg>
            <span className="starline-brand-text">Burhani ERP</span>
          </Link>
          <button className="btn btn-sm btn-link text-muted d-lg-none p-0" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="starline-nav-list flex-grow-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `starline-nav-item ${isActive ? 'active' : ''}`}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="pt-3 border-top border-secondary border-opacity-10 d-flex flex-column gap-2">
          <Link
            to="/"
            className="starline-nav-item"
            style={{ color: '#525866' }}>
            <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Live Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="starline-nav-item border-0 bg-transparent text-start w-100"
            style={{ color: '#EF4444' }}>
            <svg className="starline-nav-icon" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: '235px',
          padding: '24px 28px',
          minWidth: 0,
          background: '#E7E9ED',
        }}>
        {/* Top Header Row with Starline Pill */}
        <div className="starline-header-row">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-light d-lg-none d-flex align-items-center justify-content-center p-2 rounded-3 border"
              onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-list fs-5"></i>
            </button>
            <div>
              <h1 className="starline-greeting-title">{headerInfo.title}</h1>
              <p className="starline-greeting-sub">{headerInfo.sub}</p>
            </div>
          </div>

          {/* Floating White Pill */}
          <div className="starline-header-pill">
            <button className="starline-pill-btn" title="Search" onClick={() => navigate('/business/products')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <button className="starline-pill-btn" title="Theme">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </button>
            <button className="starline-pill-btn" title="Low Stock Notifications" onClick={() => navigate('/business/products?low_stock=true')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="starline-notif-badge">2</span>
            </button>
            <button className="starline-pill-btn" title="Calendar / Sales" onClick={() => navigate('/business/sales')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>
            <div className="starline-avatar-bubble">
              {(user?.first_name || user?.username || 'M')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content Outlet */}
        <main className="flex-grow-1">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 991px) {
          .starline-sidebar {
            transform: translateX(-100%);
          }
          div[style*="margin-left: 235px"] {
            margin-left: 0 !important;
            padding: 16px 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
