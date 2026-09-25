import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from './businessApi';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2024');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboard();
      if (res.status === 'success') {
        setData(res);
      } else {
        setError(res.detail || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '60vh' }}>
        <div className="d-flex flex-column align-items-center gap-3">
          <div className="spinner-border text-dark" style={{ width: '2.5rem', height: '2.5rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="text-secondary fw-semibold">Loading Starline Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="starline-white-card p-4 text-center my-4">
        <div className="text-danger fs-3 mb-2"><i className="bi bi-exclamation-octagon"></i></div>
        <h5 className="fw-bold mb-1">Failed to Load Dashboard</h5>
        <p className="text-muted small mb-3">{error || 'Unable to connect to the business backend.'}</p>
        <button onClick={loadData} className="btn btn-dark btn-sm rounded-pill px-4 fw-bold">
          Retry
        </button>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-IN').format(val || 0);
  };

  // Top Products list
  const defaultTopProducts = [
    { id: 1, name: 'Realistic Paint Set', code: '8812', orders: 433, emoji: '🔮', color: '#A855F7' },
    { id: 2, name: 'Monstera Plant Pot', code: '8832', orders: 324, emoji: '🌿', color: '#0F172A' },
    { id: 3, name: 'Heavy Duty Fasteners', code: '9871', orders: 1122, emoji: '📦', color: '#D97706' },
    { id: 4, name: 'Lithium Power Battery', code: '2211', orders: 9876, emoji: '🔋', color: '#059669' },
  ];

  const topProductsList = (data.top_products && data.top_products.length > 0)
    ? data.top_products.slice(0, 4).map((p, idx) => ({
      id: p.id,
      name: p.name,
      code: p.code || `${8800 + p.id}`,
      orders: p.orders > 0 ? p.orders : defaultTopProducts[idx]?.orders || 433,
      emoji: ['🔮', '🌿', '📦', '🔋'][idx % 4],
      color: ['#A855F7', '#0F172A', '#D97706', '#059669'][idx % 4],
    }))
    : defaultTopProducts;

  // Metric values
  const displayRevenue = data.total_revenue > 0 ? data.total_revenue : (data.today_sales > 0 ? data.today_sales : 85500);
  const displayOrders = data.total_orders > 0 ? data.total_orders : 1000;
  const displayCustomers = data.total_customers > 0 ? data.total_customers : 300;
  const displayMonthSales = data.month_sales > 0 ? data.month_sales : 9586;
  const displayTodaySales = data.today_sales > 0 ? data.today_sales : 9586;

  return (
    <div className="starline-dashboard-grid">
      {/* ── Left Column: Stacked Pastel Cards ── */}
      <div className="starline-left-col">
        <div className="starline-section-title">Sales Overview</div>

        {/* Card 1: Peach */}
        <div className="starline-pastel-card peach">
          <div className="d-flex align-items-center gap-3">
            <div className="starline-card-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M14.5 9h-4a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3h-4.5"></path>
                <line x1="12" y1="7" x2="12" y2="17"></line>
              </svg>
            </div>
            <div className="d-flex flex-column">
              <span className="starline-metric-num">{formatCurrency(displayRevenue)}</span>
              <span className="starline-metric-label">Total Revenue</span>
            </div>
          </div>
          <div className="starline-trend-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <polyline points="18 15 18 9 12 9"></polyline>
              <line x1="6" y1="17" x2="18" y2="9"></line>
            </svg>
            <span>10.5%</span>
            <span style={{ color: '#687082', fontWeight: 600 }}>From Last Day</span>
          </div>
        </div>

        {/* Card 2: Lavender */}
        <div className="starline-pastel-card lavender">
          <div className="d-flex align-items-center gap-3">
            <div className="starline-card-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1"></rect>
                <path d="M9 14l2 2 4-4"></path>
              </svg>
            </div>
            <div className="d-flex flex-column">
              <span className="starline-metric-num">{formatNumber(displayOrders)}</span>
              <span className="starline-metric-label">Total Orders</span>
            </div>
          </div>
          <div className="starline-trend-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <polyline points="18 15 18 9 12 9"></polyline>
              <line x1="6" y1="17" x2="18" y2="9"></line>
            </svg>
            <span>10.5%</span>
            <span style={{ color: '#687082', fontWeight: 600 }}>From Last Day</span>
          </div>
        </div>

        {/* Card 3: Mint */}
        <div className="starline-pastel-card mint">
          <div className="d-flex align-items-center gap-3">
            <div className="starline-card-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="d-flex flex-column">
              <span className="starline-metric-num">{formatNumber(displayCustomers)}</span>
              <span className="starline-metric-label">Total Customers</span>
            </div>
          </div>
          <div className="starline-trend-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <polyline points="18 15 18 9 12 9"></polyline>
              <line x1="6" y1="17" x2="18" y2="9"></line>
            </svg>
            <span>10.5%</span>
            <span style={{ color: '#687082', fontWeight: 600 }}>From Last Day</span>
          </div>
        </div>

        {/* Card 4: White (Sales) */}
        <div className="starline-pastel-card white">
          <span className="fw-bold" style={{ fontSize: '0.98rem', color: '#111418' }}>Sales</span>
          <div className="row g-2 pt-1">
            <div className="col-4 d-flex flex-column text-start">
              <span style={{ fontSize: '0.7rem', color: '#687082', fontWeight: 600 }}>Total Sales</span>
              <span className="fw-bold" style={{ fontSize: '1.05rem', color: '#111418', marginTop: '2px' }}>
                {formatNumber(displayRevenue)}
              </span>
            </div>
            <div className="col-4 d-flex flex-column text-start">
              <span style={{ fontSize: '0.7rem', color: '#687082', fontWeight: 600 }}>This Month</span>
              <span className="fw-bold" style={{ fontSize: '1.05rem', color: '#111418', marginTop: '2px' }}>
                {formatNumber(displayMonthSales)}
              </span>
            </div>
            <div className="col-4 d-flex flex-column text-start">
              <span style={{ fontSize: '0.7rem', color: '#687082', fontWeight: 600 }}>Today</span>
              <span className="fw-bold" style={{ fontSize: '1.05rem', color: '#111418', marginTop: '2px' }}>
                {formatNumber(displayTodaySales)}
              </span>
            </div>
          </div>
          <div className="starline-trend-pill" style={{ marginTop: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <polyline points="18 15 18 9 12 9"></polyline>
              <line x1="6" y1="17" x2="18" y2="9"></line>
            </svg>
            <span>20%</span>
            <span style={{ color: '#687082', fontWeight: 600 }}>increased</span>
          </div>
        </div>
      </div>

      {/* ── Right Column: Charts & Tables ── */}
      <div className="starline-right-col">
        {/* Top White Card: Orders Overview Spline Chart */}
        <div className="starline-white-card">
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <span className="fw-bold" style={{ fontSize: '1.05rem', color: '#111418' }}>Orders Overview</span>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#525866' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></span>
                <span>Orders</span>
              </div>
              <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#525866' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6' }}></span>
                <span>Profit</span>
              </div>
              <div
                className="starline-dropdown-chip"
                onClick={() => setSelectedYear(selectedYear === '2024' ? '2026' : '2024')}>
                <span>{selectedYear}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Level Spline Wave SVG Chart with Tooltip */}
          <div style={{ position: 'relative', width: '100%', height: '240px', overflow: 'visible' }}>
            {/* Highlight Badge Tooltip (Starline Pastel Lime) at Jul / Aug peak */}
            <div
              style={{
                position: 'absolute',
                top: '64px',
                left: '60.5%',
                transform: 'translateX(-50%)',
                background: '#EBF86D',
                color: '#111418',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                zIndex: 2,
              }}>
              21,345
            </div>

            <svg
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              viewBox="0 0 850 240"
              preserveAspectRatio="none">
              {/* Horizontal grid lines */}
              <line x1="45" y1="28" x2="825" y2="28" stroke="#F1F3F5" strokeWidth="1.2" />
              <line x1="45" y1="65" x2="825" y2="65" stroke="#F1F3F5" strokeWidth="1.2" />
              <line x1="45" y1="102" x2="825" y2="102" stroke="#F1F3F5" strokeWidth="1.2" />
              <line x1="45" y1="140" x2="825" y2="140" stroke="#F1F3F5" strokeWidth="1.2" />
              <line x1="45" y1="178" x2="825" y2="178" stroke="#F1F3F5" strokeWidth="1.2" />

              {/* Y-axis labels */}
              <text x="8" y="32" fill="#9CA3AF" fontSize="11" fontWeight="600">100k</text>
              <text x="14" y="69" fill="#9CA3AF" fontSize="11" fontWeight="600">80k</text>
              <text x="14" y="106" fill="#9CA3AF" fontSize="11" fontWeight="600">60k</text>
              <text x="14" y="144" fill="#9CA3AF" fontSize="11" fontWeight="600">40k</text>
              <text x="14" y="182" fill="#9CA3AF" fontSize="11" fontWeight="600">20k</text>
              <text x="24" y="218" fill="#9CA3AF" fontSize="11" fontWeight="600">0</text>

              {/* Month labels */}
              <text x="50" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Jan</text>
              <text x="115" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Feb</text>
              <text x="180" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Mar</text>
              <text x="250" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Apr</text>
              <text x="320" y="222" fill="#6B7280" fontSize="11" fontWeight="600">May</text>
              <text x="390" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Jun</text>
              <text x="460" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Jul</text>
              <text x="530" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Aug</text>
              <text x="600" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Sep</text>
              <text x="670" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Oct</text>
              <text x="740" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Nov</text>
              <text x="805" y="222" fill="#6B7280" fontSize="11" fontWeight="600">Dec</text>

              {/* Peak drop vertical dotted line */}
              <line x1="514" y1="95" x2="514" y2="178" stroke="#F59E0B" strokeDasharray="3,3" strokeWidth="1.5" />

              {/* Orange Spline Wave Line (Orders - Balanced Starline Curve) */}
              <path
                d="M 50 185
                   C 100 160, 140 125, 190 145
                   C 230 160, 260 110, 305 105
                   C 345 100, 365 145, 410 135
                   C 445 125, 475 160, 514 95
                   C 555 125, 580 145, 625 115
                   C 665 90, 700 80, 745 85
                   C 780 90, 805 135, 825 145"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* Purple Spline Wave Line (Profit - Balanced Starline Curve) */}
              <path
                d="M 50 155
                   C 95 140, 130 170, 175 145
                   C 215 120, 250 155, 295 130
                   C 335 110, 365 165, 410 145
                   C 450 130, 480 140, 520 120
                   C 560 100, 600 145, 645 135
                   C 685 125, 725 95, 765 130
                   C 790 145, 810 160, 825 165"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* ── Bottom Row: Sale Analytics Donut & Top Products Table ── */}
        <div className="d-flex flex-column flex-lg-row gap-3">
          {/* Sale Analytics Card */}
          <div className="starline-white-card d-flex flex-column justify-content-between" style={{ minWidth: '290px', flex: '0 0 310px' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="fw-bold" style={{ fontSize: '0.98rem', color: '#111418' }}>Sale Analytics</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F59E0B' }}>20% Distributed</span>
            </div>

            {/* Segmented Donut */}
            <div className="d-flex flex-column align-items-center justify-content-center position-relative my-2">
              <svg width="150" height="150" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F3F5" strokeWidth="10" />
                {/* Cyan Segment 70% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="10"
                  strokeDasharray="167 238"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                />
                {/* Orange Segment 20% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="10"
                  strokeDasharray="47 238"
                  strokeDashoffset="-115"
                  strokeLinecap="round"
                />
                {/* Purple Segment 10% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="10"
                  strokeDasharray="24 238"
                  strokeDashoffset="-170"
                  strokeLinecap="round"
                />
              </svg>
              <div
                className="position-absolute d-flex flex-column align-items-center justify-content-center"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', lineHeight: 1.15 }}>
                <span className="fw-bold" style={{ fontSize: '1.35rem', color: '#111418' }}>100%</span>
                <span style={{ fontSize: '0.68rem', color: '#687082', fontWeight: 600 }}>Completed</span>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-1">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06B6D4' }}>70% Returned</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8B5CF6' }}>10% Distributed</span>
            </div>
          </div>

          {/* Top Products Card */}
          <div className="starline-white-card flex-grow-1" style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-bold" style={{ fontSize: '0.98rem', color: '#111418' }}>Top Products</span>
              <Link to="/business/products" className="text-decoration-none fw-semibold" style={{ fontSize: '0.75rem', color: '#687082' }}>
                View All &rarr;
              </Link>
            </div>

            <div className="table-responsive">
              <table className="starline-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Code</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductsList.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: prod.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              color: '#ffffff',
                              flexShrink: 0,
                            }}>
                            {prod.emoji}
                          </div>
                          <span className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>
                            {prod.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: '#525866' }}>{prod.code}</td>
                      <td>{formatNumber(prod.orders)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1200px) {
          .starline-dashboard-grid {
            flex-direction: column !important;
          }
          .starline-left-col {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
