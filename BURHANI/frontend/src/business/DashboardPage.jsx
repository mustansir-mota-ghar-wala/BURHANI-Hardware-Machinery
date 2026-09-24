import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from './businessApi';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2">
        <i className="bi bi-exclamation-triangle-fill"></i>
        <span>{error || 'Unable to load dashboard data.'}</span>
        <button onClick={loadData} className="btn btn-sm btn-outline-danger ms-auto">Retry</button>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const maxTrend = Math.max(
    ...data.sales_trend,
    ...data.purchases_trend,
    100
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* ── Page Header ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold m-0" style={{ letterSpacing: '-0.3px' }}>Business Overview</h4>
          <p className="text-muted small m-0">Real-time financial performance and inventory status.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/business/sales" className="btn btn-warning fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ borderRadius: '10px' }}>
            <i className="bi bi-plus-circle"></i> New Sale
          </Link>
          <Link to="/business/purchases" className="btn btn-dark fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ borderRadius: '10px' }}>
            <i className="bi bi-truck"></i> New Purchase
          </Link>
          <Link to="/business/products" className="btn btn-white border fw-bold d-flex align-items-center gap-1.5" style={{ borderRadius: '10px' }}>
            <i className="bi bi-box-seam"></i> Products
          </Link>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="row g-3">
        {/* Today's Sales */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #fffbf0 100%)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase">Today's Sales</span>
              <span className="rounded-3 p-2 bg-warning bg-opacity-25 text-warning d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <i className="bi bi-cash-stack fs-5"></i>
              </span>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{formatCurrency(data.today_sales)}</h3>
            <span className="small text-muted">Billed today</span>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase">Today's Purchases</span>
              <span className="rounded-3 p-2 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <i className="bi bi-cart-check fs-5"></i>
              </span>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{formatCurrency(data.today_purchases)}</h3>
            <span className="small text-muted">Inward stock value</span>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase">Stock Valuation</span>
              <span className="rounded-3 p-2 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <i className="bi bi-boxes fs-5"></i>
              </span>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{formatCurrency(data.stock_value)}</h3>
            <span className="small text-muted">{data.total_products} items in catalog</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase">Gross Profit</span>
              <span className="rounded-3 p-2 bg-purple bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <i className="bi bi-graph-up-arrow fs-5"></i>
              </span>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{formatCurrency(data.gross_profit)}</h3>
            <span className="small text-muted">Taxable sales - COGS</span>
          </div>
        </div>
      </div>

      {/* ── Receivables & Payables & GST Bar ── */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-medium">Customer Receivables</span>
                <h5 className="fw-bold text-danger m-0">{formatCurrency(data.pending_customer_payments)}</h5>
              </div>
              <Link to="/business/parties" className="btn btn-sm btn-light border">Details</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-medium">Supplier Payables</span>
                <h5 className="fw-bold text-warning text-dark m-0">{formatCurrency(data.pending_supplier_payments)}</h5>
              </div>
              <Link to="/business/parties" className="btn btn-sm btn-light border">Details</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-medium">GST Input Credit</span>
                <h5 className="fw-bold text-success m-0">{formatCurrency(data.gst_credit)}</h5>
              </div>
              <Link to="/business/reports" className="btn btn-sm btn-light border">Tax Report</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7-Day Performance Bar Chart ── */}
      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
          <div>
            <h5 className="fw-bold mb-0">7-Day Revenue &amp; Purchase Trend</h5>
            <small className="text-muted">Daily comparison of Sales vs Purchases</small>
          </div>
          <div className="d-flex gap-3 small fw-semibold">
            <span className="d-flex align-items-center gap-1.5">
              <span className="d-inline-block rounded-circle" style={{ width: '10px', height: '10px', background: '#f59e0b' }}></span> Sales
            </span>
            <span className="d-flex align-items-center gap-1.5">
              <span className="d-inline-block rounded-circle" style={{ width: '10px', height: '10px', background: '#3b82f6' }}></span> Purchases
            </span>
          </div>
        </div>

        {/* Visual Bar Columns */}
        <div className="d-flex align-items-end justify-content-between gap-2" style={{ height: '180px' }}>
          {data.days_labels.map((day, idx) => {
            const saleHeight = maxTrend > 0 ? (data.sales_trend[idx] / maxTrend) * 140 : 0;
            const purchaseHeight = maxTrend > 0 ? (data.purchases_trend[idx] / maxTrend) * 140 : 0;
            return (
              <div key={day} className="d-flex flex-column align-items-center flex-grow-1 h-100 justify-content-end">
                <div className="d-flex align-items-end gap-1 w-100 justify-content-center" style={{ height: '140px' }}>
                  <div
                    title={`Sales: ${formatCurrency(data.sales_trend[idx])}`}
                    style={{
                      width: '18px',
                      height: `${Math.max(saleHeight, 4)}px`,
                      background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <div
                    title={`Purchases: ${formatCurrency(data.purchases_trend[idx])}`}
                    style={{
                      width: '18px',
                      height: `${Math.max(purchaseHeight, 4)}px`,
                      background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                </div>
                <span className="text-muted mt-2 fw-medium" style={{ fontSize: '0.72rem' }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two Columns: Recent Sales & Low Stock Warnings ── */}
      <div className="row g-4">
        {/* Recent Sales */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
              <h5 className="fw-bold mb-0">Recent Invoices</h5>
              <Link to="/business/sales" className="text-warning text-decoration-none fw-semibold small">View All</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Inv #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_sales?.length > 0 ? (
                    data.recent_sales.map((s) => (
                      <tr key={s.id}>
                        <td className="fw-bold">#{s.id}</td>
                        <td className="fw-semibold text-truncate" style={{ maxWidth: '150px' }}>{s.customer_name}</td>
                        <td className="text-muted small">{s.sale_date.split(',')[0]}</td>
                        <td className="fw-bold">{formatCurrency(s.total_amount)}</td>
                        <td>
                          {s.balance_amount > 0 ? (
                            <span className="badge bg-danger bg-opacity-10 text-danger">{formatCurrency(s.balance_amount)}</span>
                          ) : (
                            <span className="badge bg-success bg-opacity-10 text-success">Paid</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No recent sales recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
              <div className="d-flex align-items-center gap-2">
                <span className="rounded-circle p-1 bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                  <i className="bi bi-exclamation-triangle-fill small"></i>
                </span>
                <h5 className="fw-bold mb-0">Low Stock Alert</h5>
              </div>
              <Link to="/business/products?low_stock=true" className="text-danger text-decoration-none fw-semibold small">
                {data.low_stock_count} Items
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Stock</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.low_stock_products?.length > 0 ? (
                    data.low_stock_products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="fw-semibold text-truncate" style={{ maxWidth: '140px' }}>{p.name}</div>
                          <small className="text-muted">{p.category}</small>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-danger fw-bold">{p.stock_qty} / {p.low_stock_limit}</span>
                        </td>
                        <td className="text-end">
                          <Link to="/business/purchases" className="btn btn-sm btn-outline-dark" style={{ fontSize: '0.75rem', borderRadius: '6px' }}>
                            Restock
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-success py-4">
                        <i className="bi bi-check-circle-fill me-1"></i> All products are adequately stocked!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
