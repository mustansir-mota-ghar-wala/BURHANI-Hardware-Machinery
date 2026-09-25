import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCleanProductImage } from '../utils/imageUrl';

export default function CartPage({ setToasts }) {
  const [data, setData] = useState({ cart: [], grand_total: '0' });
  const [loading, setLoading] = useState(true);
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  const fetchCart = async () => {
    const d = await apiGet('/api/react/cart/');
    setData(d);
    setCartCount(d.cart?.length || 0);
    setLoading(false);
  };

  useEffect(() => {
    if (!user && user !== null) { navigate('/login'); return; }
    if (user) fetchCart();
  }, [user]);

  const removeItem = async (cartItemId) => {
    await apiPost(`/api/react/cart/remove/${cartItemId}/`);
    fetchCart();
    setToasts((t) => [...t, { tag: 'success', text: 'Item removed from cart.' }]);
  };

  const increase = async (productId) => {
    await apiPost(`/api/react/cart/add/${productId}/`);
    fetchCart();
  };

  const decrease = async (productId) => {
    await apiPost(`/api/react/cart/decrease/${productId}/`);
    fetchCart();
  };

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-white">
          <div>
            <span className="text-success fw-bold small text-uppercase letter-spacing-1">Burhani Store Checkout</span>
            <h2 className="section-title m-0">Your Shopping Cart</h2>
          </div>
          <Link to="/" className="section-view-all d-flex align-items-center gap-1">
            <i className="bi bi-arrow-left"></i> Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="mt-2 text-muted">Loading your cart...</p>
          </div>
        ) : data.cart?.length > 0 ? (
          <div className="row g-4">
            {/* Cart Items List */}
            <div className="col-lg-8">
              <div className="d-flex flex-column gap-3">
                {data.cart.map((item) => (
                  <div
                    key={item.id}
                    className="product-minimal-card flex-row align-items-center p-3 gap-3"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/item/${item.product.id}`)}
                  >
                    {/* Thumbnail */}
                    <div
                      className="flex-shrink-0"
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '16px',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      }}
                    >
                      <img
                        src={getCleanProductImage(item.product.image) || '/static/images/cat_hardware.jpg'}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-grow-1 min-w-0">
                      <h4
                        className="fw-bold mb-1 text-truncate"
                        style={{ fontSize: '0.95rem', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}
                      >
                        {item.product.name}
                      </h4>
                      <div className="text-muted small mb-2">Price per unit: ₹{item.product.price}</div>
                      <div className="fw-bold fs-6 text-dark">₹{item.product_total}</div>
                    </div>

                    {/* Quantity & Delete Actions */}
                    <div
                      className="d-flex flex-column align-items-end gap-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 border-0"
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                      >
                        <i className="bi bi-trash3 fs-6"></i>
                      </button>

                      {/* Qty Pill */}
                      <div
                        className="d-flex align-items-center"
                        style={{
                          background: '#f1f5f9',
                          borderRadius: '50px',
                          padding: '2px 4px',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-link p-1 text-dark border-0"
                          onClick={() => decrease(item.product.id)}
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <span className="fw-bold px-2 small">{item.product_quantity}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-link p-1 text-dark border-0"
                          onClick={() => increase(item.product.id)}
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Glass Card */}
            <div className="col-lg-4">
              <div
                className="p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.92)',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                }}
              >
                <h4 className="fw-bold mb-3 fs-6" style={{ color: '#0f172a' }}>
                  Order Summary
                </h4>

                <div className="d-flex justify-content-between mb-2 small text-muted">
                  <span>Subtotal ({data.cart.length} items)</span>
                  <span className="fw-bold text-dark">₹{data.grand_total}</span>
                </div>

                <div className="d-flex justify-content-between mb-2 small text-muted">
                  <span>Standard Delivery</span>
                  <span className="text-success fw-bold">FREE</span>
                </div>

                <div className="d-flex justify-content-between mb-2 small text-muted">
                  <span>GST (Included)</span>
                  <span className="text-dark">18%</span>
                </div>

                <hr className="my-3 opacity-25" />

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold text-dark">Grand Total</span>
                  <span className="fs-4 fw-bolder text-success">₹{data.grand_total}</span>
                </div>

                <Link
                  to="/checkout"
                  className="btn btn-success w-100 py-3 fw-bold rounded-pill text-uppercase shadow-sm"
                  style={{
                    letterSpacing: '0.5px',
                    fontSize: '0.9rem',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    border: 'none',
                  }}
                >
                  Proceed to Checkout <i className="bi bi-arrow-right ms-1"></i>
                </Link>

                <div className="mt-3 text-center small text-muted d-flex justify-content-center gap-2">
                  <i className="bi bi-shield-check text-success"></i>
                  <span>Secure Razorpay / COD Options</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                <i className="bi bi-bag-x"></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Your cart is empty</h4>
              <p className="text-muted small mb-4">
                Explore our catalog for industrial power tools, machinery, and authentic spare parts.
              </p>
              <Link to="/" className="btn btn-success rounded-pill px-4 py-2 fw-semibold">
                Explore Products
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
