import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailPage({ setToasts }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiGet(`/api/react/product/${id}/`).then(d => {
      setData(d);
      setActiveImg(d.product?.image);
      setActiveImgIndex(0);
      setLoading(false);
    });
    window.scrollTo(0, 0);
  }, [id]);

  const addToCart = async () => {
    if (!user) { navigate('/login'); return; }
    const res = await apiPost(`/api/react/cart/add/${id}/`);
    if (res.status === 'success') {
      setCartCount(res.cart_count);
      setToasts(t => [...t, { tag: 'success', text: 'Added to cart!' }]);
    } else {
      setToasts(t => [...t, { tag: 'error', text: res.message || 'Error.' }]);
    }
  };

  const buyNow = async () => {
    if (!user) { navigate('/login'); return; }
    const res = await apiPost(`/api/react/cart/add/${id}/`);
    if (res.status === 'success') {
      setCartCount(res.cart_count);
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="scenic-app-wrapper">
        <div className="glass-canvas-container text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-3 text-muted">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div className="scenic-app-wrapper">
        <div className="glass-canvas-container text-center py-5">
          <h3 className="section-title mb-3">Product Not Found</h3>
          <p className="text-muted mb-4">The item you are looking for may have been moved or removed.</p>
          <Link to="/" className="btn btn-success rounded-pill px-4 py-2">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { product, related_products, categories } = data;
  const allImages = [product.image, ...product.additional_images].filter(Boolean);

  const handlePrevImage = () => {
    const newIdx = activeImgIndex === 0 ? allImages.length - 1 : activeImgIndex - 1;
    setActiveImgIndex(newIdx);
    setActiveImg(allImages[newIdx]);
  };

  const handleNextImage = () => {
    const newIdx = activeImgIndex === allImages.length - 1 ? 0 : activeImgIndex + 1;
    setActiveImgIndex(newIdx);
    setActiveImg(allImages[newIdx]);
  };

  const onTouchStartHandler = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMoveHandler = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleNextImage();
    if (distance < -50) handlePrevImage();
  };

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container">
        {/* Breadcrumb Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-white">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb small mb-1">
                <li className="breadcrumb-item"><Link to="/" className="text-success text-decoration-none">Home</Link></li>
                {product.category && (
                  <li className="breadcrumb-item">
                    <Link to={`/product/${product.category.id}`} className="text-success text-decoration-none">
                      {product.category.name}
                    </Link>
                  </li>
                )}
                <li className="breadcrumb-item active text-dark fw-semibold" aria-current="page">
                  {product.name}
                </li>
              </ol>
            </nav>
            <h1 className="section-title m-0">{product.name}</h1>
          </div>
          <Link to="/" className="section-view-all d-flex align-items-center gap-1">
            <i className="bi bi-arrow-left"></i> Back to Store
          </Link>
        </div>

        {/* Main Product Showcase Row */}
        <div className="row g-4 mb-5">
          {/* Left Column: Image Card */}
          <div className="col-lg-6">
            <div className="detail-image-card">
              <div 
                className="detail-main-img-wrap"
                onClick={() => setIsFullscreen(true)}
                onTouchStart={onTouchStartHandler}
                onTouchMove={onTouchMoveHandler}
                onTouchEnd={onTouchEndHandler}
                title="Click to view fullscreen"
              >
                <img
                  src={activeImg || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=800'}
                  alt={product.name}
                  className="detail-main-img"
                />
                <button 
                  className="detail-zoom-btn"
                  onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
                  title="Fullscreen Zoom"
                  type="button"
                >
                  <i className="bi bi-arrows-fullscreen"></i>
                </button>
              </div>

              {/* Navigation Arrows for Multiple Images */}
              {allImages.length > 1 && (
                <div className="detail-img-controls">
                  <button 
                    type="button" 
                    onClick={handlePrevImage} 
                    className="detail-img-arrow left"
                    title="Previous Image"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNextImage} 
                    className="detail-img-arrow right"
                    title="Next Image"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}

              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="detail-thumbnails-row">
                  {allImages.map((img, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setActiveImg(img); setActiveImgIndex(i); }} 
                      className={`detail-thumb-box ${activeImg === img ? 'active' : ''}`}
                    >
                      <img src={img} alt={`Thumbnail ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info Card */}
          <div className="col-lg-6">
            <div className="detail-info-card">
              {product.category && (
                <div className="detail-cat-badge">
                  <i className="bi bi-tag-fill me-1"></i>
                  {product.category.name}
                </div>
              )}

              <h2 className="detail-prod-title">{product.name}</h2>

              <div className="detail-price-row">
                <span className="detail-price">₹{product.price}</span>
                <span className="detail-tax-badge">INCL. GST</span>
                {product.brand && (
                  <span className="detail-brand-badge">Brand: {product.brand}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="detail-actions-row">
                <button 
                  onClick={addToCart} 
                  className="detail-btn-cart"
                  type="button"
                >
                  <i className="bi bi-cart-plus-fill"></i> ADD TO CART
                </button>
                <button 
                  onClick={buyNow} 
                  className="detail-btn-buy"
                  type="button"
                >
                  <i className="bi bi-lightning-charge-fill"></i> BUY NOW
                </button>
              </div>

              {/* WhatsApp Direct Inquiry */}
              <a 
                href={`https://wa.me/917742752753?text=${encodeURIComponent(`Hi, I'm interested in ${product.name} (₹${product.price}). Please share details.`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="detail-btn-whatsapp"
              >
                <i className="bi bi-whatsapp"></i> ENQUIRE ON WHATSAPP
              </a>

              {/* Product Description */}
              {product.description && (
                <div className="detail-description-box">
                  <h5 className="detail-desc-heading">Product Overview</h5>
                  <p className="detail-desc-text">{product.description}</p>
                </div>
              )}

              {/* Trust Badges */}
              <div className="detail-trust-row">
                <div className="trust-item">
                  <i className="bi bi-shield-check"></i>
                  <span>100% Genuine</span>
                </div>
                <div className="trust-item">
                  <i className="bi bi-truck"></i>
                  <span>Fast Dispatch</span>
                </div>
                <div className="trust-item">
                  <i className="bi bi-headset"></i>
                  <span>Expert Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {related_products?.length > 0 && (
          <div className="detail-related-section mt-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="section-title m-0">Related Products</h3>
              <span className="badge bg-light text-dark">{related_products.length} Items</span>
            </div>
            <div className="row g-3">
              {related_products.slice(0, 4).map((prod) => (
                <div key={prod.id} className="col-6 col-md-3">
                  <div 
                    className="prod-card touch-feedback" 
                    onClick={() => navigate(`/item/${prod.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="prod-img">
                      <img 
                        src={prod.image || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=400'} 
                        alt={prod.name} 
                      />
                    </div>
                    <div className="prod-info">
                      <h4>{prod.name}</h4>
                      <div className="prod-price">₹{prod.price}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Fixed Action Buttons */}
        <div className="detail-mobile-action-bar d-lg-none">
          <button onClick={addToCart} className="detail-btn-cart flex-fill" type="button">
            <i className="bi bi-cart-plus-fill"></i> ADD TO CART
          </button>
          <button onClick={buyNow} className="detail-btn-buy flex-fill" type="button">
            <i className="bi bi-lightning-charge-fill"></i> BUY NOW
          </button>
        </div>

        {/* Fullscreen Viewer */}
        {isFullscreen && (
          <div 
            className="detail-fullscreen-backdrop"
            onClick={() => setIsFullscreen(false)}
          >
            <button 
              onClick={() => setIsFullscreen(false)} 
              className="detail-fullscreen-close"
              type="button"
            >
              &times;
            </button>
            
            {allImages.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} 
                className="detail-fullscreen-arrow left"
                type="button"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            )}

            <div
              onTouchStart={onTouchStartHandler}
              onTouchMove={onTouchMoveHandler}
              onTouchEnd={onTouchEndHandler}
              onClick={(e) => e.stopPropagation()}
              className="detail-fullscreen-img-wrap"
            >
              <img src={activeImg} alt="Fullscreen View" />
            </div>

            {allImages.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }} 
                className="detail-fullscreen-arrow right"
                type="button"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
