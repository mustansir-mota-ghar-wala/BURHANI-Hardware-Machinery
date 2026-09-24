import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BusinessLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/business', end: true, icon: 'bi-speedometer2', label: 'Dashboard' },
    { to: '/business/products', icon: 'bi-box-seam', label: 'Inventory & Stock' },
    { to: '/business/sales', icon: 'bi-receipt', label: 'Sales & Invoices' },
    { to: '/business/purchases', icon: 'bi-truck', label: 'Purchases & Inward' },
    { to: '/business/parties', icon: 'bi-people', label: 'Customers & Suppliers' },
    { to: '/business/payments', icon: 'bi-cash-coin', label: 'Payments & Ledger' },
    { to: '/business/reports', icon: 'bi-file-earmark-bar-graph', label: 'GST & Reports' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* ── Sidebar Backdrop (Mobile) ── */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`d-flex flex-column position-fixed top-0 start-0 h-100 ${sidebarOpen ? 'translate-middle-x-0' : ''}`}
        style={{
          width: '260px',
          background: '#0f172a',
          color: '#e2e8f0',
          zIndex: 1045,
          transition: 'transform 0.3s ease',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          ...(window.innerWidth >= 992 ? { transform: 'none' } : {}),
        }}>
        {/* Brand */}
        <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
          <Link to="/business" className="d-flex align-items-center gap-2 text-decoration-none text-white">
            <div className="d-flex align-items-center justify-content-center rounded-3 bg-warning text-dark fw-bold" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-tools fs-5"></i>
            </div>
            <div>
              <div className="fw-bold fs-6 lh-1">BURHANI</div>
              <small className="text-warning text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Smart Business ERP</small>
            </div>
          </Link>
          <button className="btn btn-sm btn-link text-white-50 d-lg-none p-0" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-grow-1 py-3 px-2 overflow-y-auto">
          <div className="text-uppercase text-secondary fw-bold px-3 mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
            Main Menu
          </div>
          <nav className="nav flex-column gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 fw-medium transition-all ${
                    isActive
                      ? 'bg-warning text-dark fw-bold shadow-sm'
                      : 'text-light text-opacity-75 hover-bg-slate'
                  }`
                }
                style={{ fontSize: '0.9rem' }}>
                <i className={`bi ${item.icon} fs-5`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer profile & return to store */}
        <div className="p-3 border-top border-secondary border-opacity-25 bg-black bg-opacity-20">
          <Link
            to="/"
            className="btn btn-outline-warning btn-sm w-100 d-flex align-items-center justify-content-center gap-2 mb-3 fw-semibold"
            style={{ borderRadius: '10px' }}>
            <i className="bi bi-arrow-left"></i> Back to Storefront
          </Link>

          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                {(user?.username || 'A')[0].toUpperCase()}
              </div>
              <div className="text-truncate">
                <div className="fw-semibold text-white small text-truncate">{user?.first_name || user?.username}</div>
                <div className="text-secondary small" style={{ fontSize: '0.7rem' }}>Business Owner</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-sm btn-link text-danger p-0" title="Logout">
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: window.innerWidth >= 992 ? '260px' : '0', minWidth: 0 }}>
        {/* Top Navbar */}
        <header className="bg-white border-bottom border-light-subtle px-3 py-2.5 sticky-top d-flex align-items-center justify-content-between shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-light d-lg-none d-flex align-items-center justify-content-center p-2 rounded-3 border"
              onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-list fs-5"></i>
            </button>
            <div className="d-none d-sm-block">
              <span className="badge bg-warning text-dark fw-bold px-2 py-1 me-2">ERP PANEL</span>
              <span className="text-muted small">Burhani Hardware &amp; Machinery</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/" className="btn btn-sm btn-light border fw-semibold d-flex align-items-center gap-1.5" style={{ borderRadius: '8px' }}>
              <i className="bi bi-shop text-warning"></i>
              <span className="d-none d-md-inline">Live Store</span>
            </Link>
            <div className="vr mx-1 opacity-25"></div>
            <div className="d-flex align-items-center gap-2 text-dark small fw-semibold">
              <span className="d-none d-sm-inline">Hi, {user?.first_name || user?.username}</span>
              <button onClick={handleLogout} className="btn btn-sm btn-outline-danger py-1 px-2 fw-semibold" style={{ borderRadius: '8px', fontSize: '0.78rem' }}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Child Page Content */}
        <main className="flex-grow-1 p-3 p-md-4">
          <Outlet />
        </main>
      </div>

      <style>{`
        .hover-bg-slate:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
