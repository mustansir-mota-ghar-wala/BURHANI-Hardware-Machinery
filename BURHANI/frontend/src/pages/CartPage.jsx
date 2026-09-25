import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCleanProductImage } from '../utils/imageUrl';

export default function CartPage({ setToasts }) {
  const [data, setData] = useState({ cart: [], grand_total: '0' });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const d = await apiGet('/api/react/cart/');
      setData(d);
      setCartCount(d.cart?.length || 0);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user && user !== null) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchCart();
    }
  }, [user]);

  const removeItem = async (cartItemId, e) => {
    if (e) e.stopPropagation();
    setUpdatingId(cartItemId);
    try {
      await apiPost(`/api/react/cart/remove/${cartItemId}/`);
      await fetchCart();
      if (setToasts) {
        setToasts((t) => [...t, { tag: 'success', text: 'Item removed from cart.' }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const increase = async (productId, itemId, e) => {
    if (e) e.stopPropagation();
    setUpdatingId(itemId);
    try {
      await apiPost(`/api/react/cart/add/${productId}/`);
      await fetchCart();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const decrease = async (productId, itemId, e) => {
    if (e) e.stopPropagation();
    setUpdatingId(itemId);
    try {
      await apiPost(`/api/react/cart/decrease/${productId}/`);
      await fetchCart();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const itemCount = data.cart?.reduce((acc, it) => acc + (it.product_quantity || 1), 0) || 0;

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container cart-compact-container">
        {/* Compact Breadcrumb Header */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2 pb-2 border-bottom border-white-50">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill bg-success-subtle text-success px-2 py-0-5 small fw-semibold" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-shield-check me-1"></i>BURHANI SECURE CART
              </span>
              <span className="text-muted small" style={{ fontSize: '0.78rem' }}>&bull; Industrial Tools</span>
            </div>
            <div className="d-flex align-items-center gap-2 mt-0.5">
              <h3 className="section-title m-0" style={{ fontSize: '1.45rem' }}>Your Shopping Cart</h3>
              {data.cart?.length > 0 && (
                <span className="badge rounded-pill bg-light text-dark border px-2.5 py-1 small fw-semibold">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
          </div>

          <Link to="/" className="detail-back-btn text-decoration-none py-1.5 px-3">
            <i className="bi bi-arrow-left"></i>
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Free Shipping Alert Pill Banner (Compact Single Line) */}
        {data.cart?.length > 0 && (
          <div
            className="py-2 px-3 mb-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(209, 250, 229, 0.8) 0%, rgba(236, 253, 245, 0.9) 100%)',
              border: '1px solid rgba(167, 243, 208, 0.9)',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.05)',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                }}
              >
                <i className="bi bi-truck"></i>
              </div>
              <div>
                <strong className="text-success-emphasis me-2" style={{ fontSize: '0.86rem' }}>
                  Complimentary Doorstep Shipping Unlocked!
                </strong>
                <span className="text-muted small" style={{ fontSize: '0.8rem' }}>Standard safe delivery &amp; insurance included at ₹0.</span>
              </div>
            </div>

            <div className="d-none d-md-flex align-items-center gap-1.5 text-success fw-semibold" style={{ fontSize: '0.78rem' }}>
              <i className="bi bi-patch-check-fill"></i>
              <span>GST Input Credit Eligible</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-success" role="status" style={{ width: '2.4rem', height: '2.4rem' }}></div>
            <p className="mt-2 text-muted fw-medium small">Loading your shopping cart...</p>
          </div>
        ) : data.cart?.length > 0 ? (
          <div className="row g-3">
            {/* Cart Items List (Left Column) */}
            <div className="col-lg-8">
              <div className="d-flex flex-column gap-2">
                {data.cart.map((item) => (
                  <div
                    key={item.id}
                    className="cart-modern-item-card d-flex align-items-center gap-3 flex-wrap flex-sm-nowrap"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/item/${item.product.id}`)}
                  >
                    {/* Transparent Cutout Thumbnail Stage (Compact) */}
                    <div className="cart-thumbnail-stage">
                      <img
                        src={getCleanProductImage(item.product.image) || '/static/images/cat_hardware.jpg'}
                        alt={item.product.name}
                        className="cart-thumbnail-img"
                      />
                    </div>

                    {/* Product Details (Compact) */}
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-1.5 mb-0.5">
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-1.5 py-0 fw-semibold" style={{ fontSize: '0.68rem' }}>
                          <i className="bi bi-check2 me-0.5"></i>In Stock
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.74rem' }}>&bull; Genuine Burhani Quality</span>
                      </div>

                      <h4
                        className="fw-bold mb-0.5 text-truncate"
                        style={{
                          fontSize: '0.94rem',
                          color: '#0f172a',
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: '-0.2px',
                        }}
                      >
                        {item.product.name}
                      </h4>

                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Unit Price: <span className="fw-semibold text-dark">₹{item.product.price}</span>
                      </div>

                      <div className="fw-bold text-success d-sm-none mt-1" style={{ fontSize: '0.88rem' }}>
                        Subtotal: ₹{item.product_total}
                      </div>
                    </div>

                    {/* Quantity Pill, Total & Remove Action (Compact) */}
                    <div
                      className="d-flex flex-column align-items-end justify-content-between gap-2 flex-shrink-0 ms-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div className="text-end d-none d-sm-block">
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>Line Total</div>
                          <div className="fw-bold text-dark" style={{ fontSize: '1.05rem', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                            ₹{item.product_total}
                          </div>
                        </div>

                        {/* Trash Button */}
                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={(e) => removeItem(item.id, e)}
                          title="Remove item from cart"
                          disabled={updatingId === item.id}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>

                      {/* Interactive Quantity Stepper (Compact) */}
                      <div className="cart-qty-pill">
                        <button
                          type="button"
                          className="cart-qty-btn"
                          onClick={(e) => decrease(item.product.id, item.id, e)}
                          disabled={updatingId === item.id}
                          title={item.product_quantity === 1 ? 'Remove from cart' : 'Decrease quantity'}
                        >
                          {item.product_quantity === 1 ? (
                            <i className="bi bi-trash text-danger" style={{ fontSize: '0.7rem' }}></i>
                          ) : (
                            <i className="bi bi-dash"></i>
                          )}
                        </button>

                        <span className="cart-qty-val">
                          {updatingId === item.id ? (
                            <span className="spinner-border spinner-border-sm text-secondary" style={{ width: '10px', height: '10px' }}></span>
                          ) : (
                            item.product_quantity
                          )}
                        </span>

                        <button
                          type="button"
                          className="cart-qty-btn"
                          onClick={(e) => increase(item.product.id, item.id, e)}
                          disabled={updatingId === item.id}
                          title="Increase quantity"
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Secure guarantee banner (Compact Micro Bar) */}
              <div
                className="mt-2.5 py-1.5 px-3 rounded-3 d-flex align-items-center justify-content-around flex-wrap gap-2 text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.65)',
                  border: '1px dashed rgba(203, 213, 225, 0.8)',
                  fontSize: '0.78rem',
                }}
              >
                <div className="d-flex align-items-center gap-1.5 text-muted">
                  <i className="bi bi-box-seam text-success"></i>
                  <span>Tamper-Proof Packaging</span>
                </div>
                <div className="d-flex align-items-center gap-1.5 text-muted">
                  <i className="bi bi-shield-check text-success"></i>
                  <span>100% Genuine Tested</span>
                </div>
                <div className="d-flex align-items-center gap-1.5 text-muted">
                  <i className="bi bi-arrow-repeat text-success"></i>
                  <span>Replacement Guarantee</span>
                </div>
              </div>
            </div>

            {/* Order Summary (Right Column - Compact) */}
            <div className="col-lg-4">
              <div className="order-summary-glass-card position-sticky" style={{ top: '80px' }}>
                <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                  <h4 className="fw-bold m-0" style={{ color: '#0f172a', fontSize: '1rem' }}>
                    <i className="bi bi-bag-check me-1.5 text-success"></i>Order Summary
                  </h4>
                  <span className="badge rounded-pill bg-light text-muted border px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                    {data.cart.length} unique {data.cart.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-1.5 small text-muted">
                  <span>Items Subtotal</span>
                  <span className="fw-bold text-dark">₹{data.grand_total}</span>
                </div>

                <div className="d-flex justify-content-between mb-1.5 small text-muted">
                  <span>Doorstep Freight Delivery</span>
                  <span className="text-success fw-bold">FREE</span>
                </div>

                <div className="d-flex justify-content-between mb-1.5 small text-muted">
                  <span>Protective Transit Insurance</span>
                  <span className="text-success fw-bold">FREE</span>
                </div>

                <div className="d-flex justify-content-between mb-2 small text-muted">
                  <span>Applicable GST (18%)</span>
                  <span className="text-secondary fw-semibold">Included in Price</span>
                </div>

                <hr className="my-2 opacity-25" />

                <div className="d-flex justify-content-between align-items-baseline mb-3">
                  <div>
                    <span className="fw-bold text-dark d-block" style={{ fontSize: '0.92rem' }}>Grand Total</span>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>Inclusive of all taxes &amp; fees</span>
                  </div>
                  <div className="text-end">
                    <span className="fw-bolder text-success fs-4" style={{ letterSpacing: '-0.4px' }}>
                      ₹{data.grand_total}
                    </span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="btn-emerald-gradient"
                >
                  <span>Proceed to Checkout</span>
                  <i className="bi bi-arrow-right ms-1.5"></i>
                </Link>

                {/* Compact Trust Badges */}
                <div className="cart-trust-badge-row">
                  <div className="cart-trust-badge-item">
                    <i className="bi bi-shield-lock-fill"></i>
                    <span>256-Bit SSL Encrypted Razorpay &amp; COD Payment</span>
                  </div>
                  <div className="cart-trust-badge-item">
                    <i className="bi bi-receipt-cutoff"></i>
                    <span>GST Tax Invoice provided for Business Input Credit</span>
                  </div>
                  <div className="cart-trust-badge-item">
                    <i className="bi bi-headset"></i>
                    <span>Dedicated Technical &amp; Spare Parts Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Cart State */
          <div className="text-center py-4">
            <div
              style={{
                maxWidth: '440px',
                margin: '10px auto',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '26px',
                padding: '36px 28px',
                boxShadow: '0 16px 36px rgba(15, 23, 42, 0.05)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  color: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  marginBottom: '16px',
                  boxShadow: '0 6px 16px rgba(5, 150, 105, 0.12)',
                }}
              >
                <i className="bi bi-cart-x"></i>
              </div>

              <h4 className="fw-bold text-dark mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                Your Cart is Empty
              </h4>
              <p className="text-muted small mb-3" style={{ lineHeight: '1.5', fontSize: '0.84rem' }}>
                You haven't added any machinery, industrial power tools, or authentic spare parts yet. Explore our verified catalog to equip your project with top-tier hardware.
              </p>

              <Link
                to="/"
                className="btn-emerald-gradient"
                style={{ width: 'auto', padding: '10px 26px', fontSize: '0.88rem' }}
              >
                <i className="bi bi-grid me-1.5"></i>
                Explore Hardware Catalog
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
