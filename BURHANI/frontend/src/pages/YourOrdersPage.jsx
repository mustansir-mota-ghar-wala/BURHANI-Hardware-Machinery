import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered'];
const STEP_ICONS = ['bi-check', 'bi-gear', 'bi-truck', 'bi-house'];

function getStepIndex(deliveryStatus) {
  if (deliveryStatus === 'Delivered') return 3;
  if (['Shipped', 'Out for Delivery'].includes(deliveryStatus)) return 2;
  if (deliveryStatus === 'Processing') return 1;
  return 0;
}

function getStatusClass(paymentStatus) {
  if (paymentStatus === 'Paid') return 'status-paid';
  if (paymentStatus === 'Refunded') return 'status-refunded';
  if (paymentStatus === 'Cancelled') return 'status-cancelled';
  return 'status-pending';
}

function getCardTheme(deliveryStatus, index) {
  if (deliveryStatus === 'Cancelled') return 'order-theme-cancelled';
  return 'order-theme-green';
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
      setToasts(t => [...t, { tag: 'success', text: res.message }]);
      fetchOrders();
    } else {
      setToasts(t => [...t, { tag: 'error', text: res.message }]);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning" role="status"></div></div>;

  return (
    <div className="container py-3 px-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="fs-4 fw-bold mb-0">My Orders</h1>
        <span className="badge bg-dark rounded-pill">{orders.length} Total</span>
      </div>

      {orders.length > 0 ? orders.map((order, index) => (
        <div key={order.id} className={`order-card ${getCardTheme(order.delivery_status, index)}`}>
          {/* Header */}
          <div className="order-header-compact">
            <div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                Order #{String(order.id).padStart(5, '0')}
              </div>
              <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{order.created_at}</div>
            </div>
            <div className="text-end">
              <div className={`status-badge-small ${getStatusClass(order.payment_status)}`}>
                {order.payment_status}
              </div>
              <div className="fw-bold mt-1" style={{ color: 'var(--gg-accent)' }}>₹{order.bill}</div>
            </div>
          </div>

          {/* Tracking / Cancelled */}
          {order.delivery_status === 'Cancelled' ? (
            <div className="track-cancelled">
              <i className="bi bi-x-octagon-fill me-2" style={{ fontSize: '1.5rem', color: '#dc3545' }}></i>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#dc3545', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Order Cancelled
                {order.payment_status === 'Refunded' && ` — Refund of ₹${order.bill} Initiated`}
              </span>
            </div>
          ) : (
            <div className="track-stepper-compact">
              {STEPS.map((step, i) => (
                <div key={step} className={`track-step-compact ${i <= getStepIndex(order.delivery_status) ? 'active' : ''}`}>
                  <div className="track-dot"><i className={`bi ${STEP_ICONS[i]}`}></i></div>
                  <div className="track-label-compact">{step}</div>
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          <div className="mt-3">
            <h6 className="text-muted fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</h6>
            {order.items.map(item => (
              <div key={item.id} className="order-item-compact">
                {item.product.image
                  ? <img src={item.product.image} className="product-thumb-small" alt={item.product.name} />
                  : <div className="product-thumb-small d-flex align-items-center justify-content-center bg-light">
                      <i className="bi bi-box" style={{ fontSize: '1rem' }}></i>
                    </div>
                }
                <div className="flex-grow-1">
                  <div className="fw-bold" style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>{item.product.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Qty: {item.product_quantity} × ₹{item.product.price}</div>
                </div>
                <div className="fw-bold" style={{ fontSize: '0.8rem' }}>₹{item.product_total}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
            <div>
              <div className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Shipping To:</div>
              <div style={{ fontSize: '0.75rem', color: '#555' }}>
                {order.address ? order.address.substring(0, 60) + (order.address.length > 60 ? '...' : '') : 'N/A'}
              </div>
            </div>
            {['Placed', 'Processing'].includes(order.delivery_status) && (
              <button onClick={() => cancelOrder(order.id)}
                className="btn btn-outline-danger btn-sm fw-bold"
                style={{ borderRadius: '10px', fontSize: '0.7rem', padding: '6px 14px' }}>
                <i className="bi bi-x-circle me-1"></i>Cancel
              </button>
            )}
            {order.delivery_status === 'Cancelled' && (
              <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.7rem' }}>CANCELLED</span>
            )}
          </div>
        </div>
      )) : (
        <div className="text-center py-5">
          <div style={{ fontSize: '3rem', color: '#ddd', marginBottom: '1rem' }}>
            <i className="bi bi-bag-x"></i>
          </div>
          <h3 className="heading-font">No Orders Yet</h3>
          <p className="text-muted small mb-4">Your future tools will appear here once you place an order.</p>
          <Link to="/" className="btn-terracotta text-decoration-none">Start Shopping</Link>
        </div>
      )}
    </div>
  );
}
