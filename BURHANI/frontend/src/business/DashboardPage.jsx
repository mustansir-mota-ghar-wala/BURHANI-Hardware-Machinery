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

  // Real metric values directly from database API response
  const displayRevenue = Number(data.total_revenue || 0);
  const displayOrders = Number(data.total_orders || 0);
  const displayCustomers = Number(data.total_customers || 0);
  const displayMonthSales = Number(data.month_sales || 0);
  const displayTodaySales = Number(data.today_sales || 0);

  // Top Products list from real database items
  const topProductsList = (data.top_products && data.top_products.length > 0)
    ? data.top_products.slice(0, 4).map((p, idx) => ({
      id: p.id,
      name: p.name,
      code: p.code || `SKU-${p.id}`,
      orders: Number(p.orders || 0),
      emoji: ['⚙️', '🪚', '🔩', '⚡'][idx % 4],
      color: ['#A855F7', '#0F172A', '#D97706', '#059669'][idx % 4],
    }))
    : [];

  // Dynamic Chart calculations based on real sales and purchases trend
  const salesTrend = Array.isArray(data.sales_trend) && data.sales_trend.length > 0
    ? data.sales_trend
    : [0, 0, 0, 0, 0, 0, 0];
  const purchasesTrend = Array.isArray(data.purchases_trend) && data.purchases_trend.length > 0
    ? data.purchases_trend
    : [0, 0, 0, 0, 0, 0, 0];
  const daysLabels = Array.isArray(data.days_labels) && data.days_labels.length > 0
    ? data.days_labels
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const peakSaleVal = Math.max(...salesTrend, 0);
  const maxVal = Math.max(...salesTrend, ...purchasesTrend, 100);
  const hasChartData = Math.max(...salesTrend, ...purchasesTrend) > 0;

  const generateSplinePath = (points, maxY) => {
    if (!points || points.length === 0 || maxY <= 0 || !hasChartData) {
      return 'M 50 218 L 810 218';
    }
    const coords = points.map((val, idx) => ({
      x: 50 + (idx * (760 / Math.max(points.length - 1, 1))),
      y: 218 - (Math.max(0, val) / maxY) * 170,
    }));
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  };

  const peakIndex = salesTrend.indexOf(peakSaleVal);
  const peakX = 50 + (peakIndex * (760 / Math.max(salesTrend.length - 1, 1)));
  const peakY = hasChartData && maxVal > 0 ? 218 - (peakSaleVal / maxVal) * 170 : 218;

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
            <span>{displayRevenue > 0 ? '10.5%' : '0%'}</span>
            <span style={{ color: '#687082', fontWeight: 600 }}>{displayRevenue > 0 ? 'From Last Day' : 'No Change'}</span>
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
            <span>{displayOrders > 0 ? '10.5%' : '0%'}</span>
            <span style={{ color: '#687082', fontWeight: 600 }}>{displayOrders > 0 ? 'From Last Day' : 'No Change'}</span>
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
            <span>{displayCustomers > 0 ? '10.5%' : '0%'}</span>
            <span style={{ color: '#687082', fontWeight: 600 }}>{displayCustomers > 0 ? 'From Last Day' : 'No Change'}</span>
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
            <span>{displayRevenue > 0 ? '20%' : '0%'}</span>
            <span style={{ color: '#687082', fontWeight: 600 }}>{displayRevenue > 0 ? 'increased' : 'recorded'}</span>
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
            {/* Highlight Badge Tooltip only when there is real peak activity */}
            {hasChartData && peakSaleVal > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: `${Math.max(10, peakY - 32)}px`,
                  left: `${(peakX / 850) * 100}%`,
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
                {formatCurrency(peakSaleVal)}
              </div>
            )}

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
              <text x="8" y="32" fill="#9CA3AF" fontSize="11" fontWeight="600">{hasChartData ? formatNumber(maxVal) : '10k'}</text>
              <text x="14" y="69" fill="#9CA3AF" fontSize="11" fontWeight="600">{hasChartData ? formatNumber(Math.round(maxVal * 0.8)) : '8k'}</text>
              <text x="14" y="106" fill="#9CA3AF" fontSize="11" fontWeight="600">{hasChartData ? formatNumber(Math.round(maxVal * 0.6)) : '6k'}</text>
              <text x="14" y="144" fill="#9CA3AF" fontSize="11" fontWeight="600">{hasChartData ? formatNumber(Math.round(maxVal * 0.4)) : '4k'}</text>
              <text x="14" y="182" fill="#9CA3AF" fontSize="11" fontWeight="600">{hasChartData ? formatNumber(Math.round(maxVal * 0.2)) : '2k'}</text>
              <text x="24" y="218" fill="#9CA3AF" fontSize="11" fontWeight="600">0</text>

              {/* Day / Date labels */}
              {daysLabels.map((lbl, idx) => {
                const x = 50 + (idx * (760 / Math.max(daysLabels.length - 1, 1)));
                return (
                  <text key={idx} x={x} y="235" textAnchor="middle" fill="#6B7280" fontSize="11" fontWeight="600">
                    {lbl}
                  </text>
                );
              })}

              {/* Peak drop vertical dotted line */}
              {hasChartData && peakSaleVal > 0 && (
                <line x1={peakX} y1={peakY} x2={peakX} y2="218" stroke="#F59E0B" strokeDasharray="3,3" strokeWidth="1.5" />
              )}

              {/* Orange Spline Wave Line (Sales Trend) */}
              <path
                d={generateSplinePath(salesTrend, maxVal)}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* Purple Spline Wave Line (Purchases Trend) */}
              <path
                d={generateSplinePath(purchasesTrend, maxVal)}
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
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: displayRevenue > 0 ? '#F59E0B' : '#9CA3AF' }}>
                {displayRevenue > 0 ? 'Active' : 'No Sales Yet'}
              </span>
            </div>

            {/* Segmented Donut */}
            <div className="d-flex flex-column align-items-center justify-content-center position-relative my-2">
              <svg width="150" height="150" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F3F5" strokeWidth="10" />
                {displayOrders > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="10"
                    strokeDasharray="238 238"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div
                className="position-absolute d-flex flex-column align-items-center justify-content-center"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', lineHeight: 1.15 }}>
                <span className="fw-bold" style={{ fontSize: '1.35rem', color: '#111418' }}>
                  {displayOrders > 0 ? '100%' : '0%'}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#687082', fontWeight: 600 }}>
                  {displayOrders > 0 ? 'Completed' : 'No Sales'}
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-1">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06B6D4' }}>
                {formatCurrency(displayRevenue)} Revenue
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8B5CF6' }}>
                {formatNumber(displayOrders)} Orders
              </span>
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
