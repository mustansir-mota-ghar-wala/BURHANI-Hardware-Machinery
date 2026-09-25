import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCleanProductImage } from '../utils/imageUrl';

export default function ProductListPage({ setToasts }) {
  const { id } = useParams();
  const [data, setData] = useState({ categories: [], selected_category: null, products: [] });
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('burhani_wishlist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiGet(`/api/react/products/${id}/`).then((d) => {
      setData(d);
      setLoading(false);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const addToCart = async (productId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) {
      navigate('/login');
      return;
    }
    const res = await apiPost(`/api/react/cart/add/${productId}/`);
    if (res.status === 'success') {
      setCartCount(res.cart_count);
      if (setToasts) {
        setToasts((t) => [...t, { tag: 'success', text: 'Item added to cart!' }]);
      }
    } else {
      if (setToasts) {
        setToasts((t) => [...t, { tag: 'error', text: res.message || 'Failed to add item.' }]);
      }
    }
  };

  const toggleWishlist = (productId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setWishlist((prev) => {
      const next = { ...prev, [productId]: !prev[productId] };
      try {
        localStorage.setItem('burhani_wishlist', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
    if (!wishlist[productId] && setToasts) {
      setToasts((t) => [...t, { tag: 'success', text: 'Saved to wishlist!' }]);
    }
  };

  const getCategoryIcon = (catName) => {
    const name = (catName || '').toLowerCase();
    if (name.includes('power') || name.includes('drill')) return 'bi-tools';
    if (name.includes('chain') || name.includes('saw')) return 'bi-slash-circle';
    if (name.includes('weld')) return 'bi-lightning-charge';
    if (name.includes('pump') || name.includes('water')) return 'bi-droplet';
    if (name.includes('spare') || name.includes('part')) return 'bi-gear';
    if (name.includes('wire') || name.includes('cable')) return 'bi-reception-4';
    return 'bi-tag';
  };

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container">
        {/* Top Breadcrumb Navigation */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom border-white-50">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-0" style={{ fontSize: '0.8rem' }}>
              <li className="breadcrumb-item">
                <Link to="/" className="text-success text-decoration-none fw-medium">
                  <i className="bi bi-house-door me-1"></i>Home
                </Link>
              </li>
              <li className="breadcrumb-item text-muted">Categories</li>
              <li className="breadcrumb-item active text-dark fw-semibold text-capitalize" aria-current="page">
                {data.selected_category?.name || 'Category'}
              </li>
            </ol>
          </nav>

          <Link to="/" className="detail-back-btn text-decoration-none py-1 px-3" style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-arrow-left"></i>
            <span>Back to Store</span>
          </Link>
        </div>

        {/* Category Hero Title Banner */}
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-0.5 small fw-semibold" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-tag-fill me-1"></i>BURHANI HARDWARE CATALOG
              </span>
              <span className="text-muted small" style={{ fontSize: '0.76rem' }}>&bull; 100% Authentic Industrial Tools</span>
            </div>

            <h2 className="section-title m-0 text-capitalize" style={{ fontSize: '1.65rem' }}>
              {data.selected_category ? data.selected_category.name : 'Hardware Products'}
            </h2>
            <div className="text-muted small mt-0.5" style={{ fontSize: '0.82rem' }}>
              Showing {data.products.length} {data.products.length === 1 ? 'industrial machine' : 'industrial machines & tools'} available in stock
            </div>
          </div>

          <div className="d-none d-md-flex align-items-center gap-2 text-success fw-semibold small">
            <i className="bi bi-shield-check fs-5"></i>
            <span>Factory Direct Quality Warranty</span>
          </div>
        </div>

        {/* Modern Category Filter Pills Strip */}
        <div className="cat-filter-pill-strip">
          {/* All Link */}
          <Link to="/" className="cat-filter-pill">
            <i className="bi bi-grid me-1.5"></i>
            <span>All Machinery</span>
          </Link>

          {/* Dynamic Categories */}
          {data.categories.map((cat) => {
            const isActive = String(cat.id) === String(id);
            return (
              <Link
                key={cat.id}
                to={`/product/${cat.id}`}
                className={`cat-filter-pill ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${getCategoryIcon(cat.name)} me-1.5`}></i>
                <span>{cat.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-3 text-muted fw-medium">Loading hardware collection...</p>
          </div>
        ) : (
          /* Products Grid matching Home & Detail pages */
          <div className="products-minimal-grid">
            {data.products.length > 0 ? (
              data.products.map((product) => {
                const numPrice = parseFloat(product.price) || 0;
                const originalPrice = (numPrice * 1.15).toFixed(0);
                const isFav = wishlist[product.id];

                return (
                  <article
                    key={product.id}
                    className="product-minimal-card"
                    onClick={() => navigate(`/item/${product.id}`)}
                  >
                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      className={`card-wishlist-btn ${isFav ? 'active' : ''}`}
                      onClick={(e) => toggleWishlist(product.id, e)}
                      title={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <i className={`bi ${isFav ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                    </button>

                    {/* Cutout Image Stage */}
                    <div className="card-image-stage">
                      <img
                        src={getCleanProductImage(product.image) || '/static/images/cat_hardware.jpg'}
                        alt={product.name}
                        className="product-feature-img"
                        loading="lazy"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="card-info-stage">
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-1.5 py-0" style={{ fontSize: '0.64rem' }}>
                          <i className="bi bi-check2 me-0.5"></i>In Stock
                        </span>
                      </div>

                      <h3 className="card-product-title" title={product.name}>
                        {product.name}
                      </h3>

                      {/* Pricing & Add to Cart Button Row */}
                      <div className="card-footer-row">
                        <div className="card-price-block">
                          <span className="price-main">₹{numPrice.toLocaleString('en-IN')}</span>
                          <span className="price-struck">₹{parseFloat(originalPrice).toLocaleString('en-IN')}</span>
                        </div>

                        <button
                          type="button"
                          className="card-quick-add-btn"
                          onClick={(e) => addToCart(product.id, e)}
                          title="Add to Cart"
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              /* Empty Category State */
              <div className="col-12 text-center py-5">
                <div
                  style={{
                    maxWidth: '420px',
                    margin: '10px auto',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '28px',
                    padding: '36px 24px',
                    boxShadow: '0 14px 34px rgba(15, 23, 42, 0.05)',
                    border: '1.5px solid rgba(255, 255, 255, 0.95)',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      marginBottom: '16px',
                    }}
                  >
                    <i className="bi bi-box-seam"></i>
                  </div>
                  <h4 className="fw-bold text-dark mb-1.5">No products in this category</h4>
                  <p className="text-muted small mb-3" style={{ lineHeight: '1.5' }}>
                    We are currently restocking machinery and tools for this department. Check out our complete store catalog.
                  </p>
                  <Link
                    to="/"
                    className="btn-emerald-gradient"
                    style={{ width: 'auto', padding: '10px 24px', fontSize: '0.88rem' }}
                  >
                    Browse All Products
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
