import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
    setToasts(t => [...t, { tag: 'success', text: 'Item removed.' }]);
  };

  const increase = async (productId) => {
    await apiPost(`/api/react/cart/add/${productId}/`);
    fetchCart();
  };

  const decrease = async (productId) => {
    await apiPost(`/api/react/cart/decrease/${productId}/`);
    fetchCart();
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning" role="status"></div></div>;

  return (
    <div className="container my-0 my-md-4 px-0 px-md-3">
      <h1 className="mb-2 mb-md-4 fs-5 px-3 pt-3" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>
        Your Shopping Cart
      </h1>

      {data.cart?.length > 0 ? (
        <div className="row g-0 g-md-4">
          {/* Cart Items */}
          <div className="col-lg-8">
            <div className="cart-list bg-white" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              {data.cart.map(item => (
                <div key={item.id}
                  className="d-flex p-3 border-bottom position-relative bg-white touch-feedback"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/item/${item.product.id}`)}>

                  {/* Image */}
                  <div className="me-3 flex-shrink-0"
                    style={{ width: '96px', height: '96px', background: '#f8f9fa', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <img
                      src={item.product.image || 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?q=80&w=400'}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Details */}
                  <div className="flex-grow-1 d-flex flex-column justify-content-between">
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="fw-bold mb-1 pe-2" style={{ fontSize: '0.95rem', color: 'var(--gg-header)', fontFamily: "'Inter', sans-serif", lineHeight: 1.2 }}>
                        {item.product.name}
                      </h5>
                      <button className="text-danger p-1 btn btn-link"
                        onClick={e => { e.stopPropagation(); removeItem(item.id); }}>
                        <i className="bi bi-trash3" style={{ fontSize: '1.1rem' }}></i>
                      </button>
                    </div>
                    <div className="d-flex justify-content-between align-items-end mt-1">
                      <div className="fw-bold" style={{ fontSize: '1rem', color: 'var(--gg-accent)' }}>₹{item.product_total}</div>
                      <div className="qty-controls" onClick={e => e.stopPropagation()}>
                        <button className="qty-btn" onClick={() => decrease(item.product.id)}>
                          <i className="bi bi-dash"></i>
                        </button>
                        <span className="fw-bold px-2" style={{ fontSize: '0.85rem' }}>{item.product_quantity}</span>
                        <button className="qty-btn" onClick={() => increase(item.product.id)}>
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4 mt-2 mt-lg-0">
            <div className="p-3 bg-white" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 className="mb-3 fs-5" style={{ fontFamily: "'Inter', sans-serif" }}>Order Summary</h3>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Subtotal</span>
                <span className="fw-bold small">₹{data.grand_total}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Shipping</span>
                <span className="text-success fw-bold small">FREE</span>
              </div>
              <hr className="my-2 text-muted" />
              <div className="d-flex justify-content-between mb-3 align-items-center">
                <span className="fs-6 fw-bold">Total</span>
                <span className="fs-5 fw-bold" style={{ color: 'var(--gg-accent)' }}>₹{data.grand_total}</span>
              </div>
              <div className="mt-2 mb-1">
                <Link to="/checkout" className="btn-checkout touch-feedback">Proceed to Checkout</Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="cart-card" style={{ background: 'white', borderRadius: '32px', padding: '2.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid var(--gg-border)', maxWidth: '500px', margin: '0 auto' }}>
            <i className="bi bi-cart-x fs-1 text-muted mb-3 d-block"></i>
            <h2>Your cart is empty</h2>
            <p className="text-muted mb-4">Looks like you haven't added any tools to your cart yet.</p>
            <Link to="/" className="btn-terracotta text-decoration-none">Start Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}
