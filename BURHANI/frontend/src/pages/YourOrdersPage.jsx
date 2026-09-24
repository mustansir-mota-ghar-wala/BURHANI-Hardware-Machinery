import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('delivered') || s.includes('paid')) {
    return <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2 fw-bold">{status}</span>;
  }
  if (s.includes('cancel') || s.includes('refund')) {
    return <span className="badge rounded-pill bg-danger-subtle text-danger px-3 py-2 fw-bold">{status}</span>;
  }
  return <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis px-3 py-2 fw-bold">{status}</span>;
}

export default function YourOrdersPage({ setToasts }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    const d = await apiGet('/api/react/orders/');
    setOrders(d.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user && user !== null) { navigate('/login'); return; }
    if (user) fetchOrders();
  }, [user]);

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    const res = await apiPost(`/api/react/orders/cancel/${orderId}/`);
    if (res.status === 'success') {
      setToasts((t) => [...t, { tag: 'success', text: res.message }]);
      fetchOrders();
    } else {
      setToasts((t) => [...t, { tag: 'error', text: res.message }]);
    }
  };

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-white">
          <div>
            <span className="text-success fw-bold small text-uppercase letter-spacing-1">Customer Dashboard</span>
            <h2 className="section-title m-0">Order History &amp; Tracking</h2>
          </div>
          <Link to="/" className="section-view-all d-flex align-items-center gap-1">
            <i className="bi bi-arrow-left"></i> Back to Store
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="mt-2 text-muted">Retrieving your order records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5">
            <div
              style={{
                maxWidth: '420px',
                margin: '0 auto',
                background: 'rgba(255,255,255,0.85)',
                borderRadius: '28px',
                padding: '40px 24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  marginBottom: '16px',
                }}
              >
                <i className="bi bi-box-seam"></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">No orders placed yet</h4>
              <p className="text-muted small mb-4">
                You haven't ordered any machinery or tools yet. Browse our store to make your first purchase.
              </p>
              <Link to="/" className="btn btn-success rounded-pill px-4 py-2 fw-semibold">
                Shop Hardware
              </Link>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.92)',
                  borderRadius: '26px',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 10px 26px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* Order Top Bar */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 border-bottom mb-3">
                  <div>
                    <span className="text-muted small">Order ID: </span>
                    <strong className="text-dark">#{ord.id}</strong>
                    <span className="text-muted ms-3 small">&bull; Placed on {ord.created_at}</span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {getStatusBadge(ord.delivery_status || ord.payment_status)}
                    <span className="fs-5 fw-bold text-dark ms-2">₹{ord.bill}</span>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="d-flex flex-column gap-2 mb-3">
                  {ord.items?.map((item) => (
                    <div
                      key={item.id}
                      className="d-flex align-items-center justify-content-between p-2 rounded-3"
                      style={{ background: '#f8fafc' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '10px',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={item.product?.image || '/static/images/cat_hardware.jpg'}
                            alt={item.product?.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <div>
                          <div className="fw-semibold text-dark small">{item.product?.name}</div>
                          <div className="text-muted small">Qty: {item.product_quantity} &times; ₹{item.product?.price}</div>
                        </div>
                      </div>
                      <div className="fw-bold small text-dark">₹{item.product_total}</div>
                    </div>
                  ))}
                </div>

                {/* Footer Details & Actions */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2">
                  <div className="small text-muted">
                    <i className="bi bi-geo-alt me-1 text-success"></i>
                    <span>Delivery Address: {ord.address || 'Standard Delivery'}</span>
                  </div>

                  {['Placed', 'Processing'].includes(ord.delivery_status) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill px-3"
                      onClick={() => cancelOrder(ord.id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
