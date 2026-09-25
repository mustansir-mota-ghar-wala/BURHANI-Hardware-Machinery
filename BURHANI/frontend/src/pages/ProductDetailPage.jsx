import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCleanProductImage } from '../utils/imageUrl';

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
      setActiveImg(getCleanProductImage(d.product?.image));
      setActiveImgIndex(0);
      setLoading(false);
    });
    window.scrollTo(0, 0);
  }, [id]);

  const addToCart = async (targetId = id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) { navigate('/login'); return; }
    const actualId = (typeof targetId === 'object' ? id : targetId) || id;
    const res = await apiPost(`/api/react/cart/add/${actualId}/`);
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
        <div className="glass-canvas-container product-detail-compact-container text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-3 text-muted">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div className="scenic-app-wrapper">
        <div className="glass-canvas-container product-detail-compact-container text-center py-5">
          <h3 className="section-title mb-3">Product Not Found</h3>
          <p className="text-muted mb-4">The item you are looking for may have been moved or removed.</p>
          <Link to="/" className="btn btn-success rounded-pill px-4 py-2">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { product, related_products, categories, more_products = [] } = data;
  const bottomShowcaseProducts = (more_products && more_products.length > 0) ? more_products : (related_products || []);
  const allImages = [product.image, ...product.additional_images].filter(Boolean).map(getCleanProductImage);

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

  // Generate smart specifications matching Concept 1
  const getProductSpecs = (p) => {
    const cat = (p.category?.name || '').toLowerCase();
    const name = (p.name || '').toLowerCase();

    let power = '1750W';
    if (cat.includes('weld') || name.includes('weld')) power = '200A / 220V';
    else if (cat.includes('pump') || name.includes('pump')) power = '1.0 HP';
    else if (cat.includes('chain') || name.includes('saw')) power = '58cc 2-Stroke';
    else if (cat.includes('grind') || name.includes('grind')) power = '850W Heavy';
    else if (cat.includes('drill') || name.includes('drill')) power = '650W Corded';

    let impact = '45J';
    if (cat.includes('weld') || name.includes('weld')) impact = 'IGBT Inverter';
    else if (cat.includes('pump') || name.includes('pump')) impact = '3500 L/hr';
    else if (cat.includes('chain') || name.includes('saw')) impact = '11,000 RPM';
    else if (cat.includes('drill') || cat.includes('grind')) impact = '2800 RPM';

    let weight = '16kg';
    if (name.includes('16kg')) weight = '16kg';
    else if (cat.includes('pump') || name.includes('pump')) weight = '8.5kg';
    else if (cat.includes('weld') || name.includes('weld')) weight = '5.8kg';
    else if (cat.includes('hand') || name.includes('drill')) weight = '2.4kg';
    else if (cat.includes('chain')) weight = '6.2kg';

    return [
      { label: 'Power', val: power, icon: 'bi-lightning-charge-fill' },
      { label: 'Impact', val: impact, icon: 'bi-hammer' },
      { label: 'Weight', val: weight, icon: 'bi-box-seam' },
      { label: 'Warranty', val: '1 Year', icon: 'bi-shield-check' },
    ];
  };

  const specs = getProductSpecs(product);

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container product-detail-compact-container">
        {/* Breadcrumb Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-white-50">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-0">
              <li className="breadcrumb-item"><Link to="/" className="text-success text-decoration-none fw-medium"><i className="bi bi-house-door me-1"></i>Home</Link></li>
              {product.category && (
                <li className="breadcrumb-item">
                  <Link to={`/product/${product.category.id}`} className="text-success text-decoration-none fw-medium">
                    {product.category.name}
                  </Link>
                </li>
              )}
              <li className="breadcrumb-item active text-dark fw-semibold" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>
          <Link to="/" className="detail-back-btn">
            <i className="bi bi-arrow-left"></i> <span>Back to Store</span>
          </Link>
        </div>

        {/* ── SIDE-BY-SIDE MAIN ROW (Product Details Card on Left + Other Products on Right) ── */}
        <div className="row g-4 align-items-stretch">
          {/* ── 1. ACTIVE PRODUCT DETAILS SHOWCASE CARD (Primary Hero Island - Left) ── */}
          <div className={related_products && related_products.length > 0 ? "col-lg-8" : "col-12"}>
            <div className="detail-hero-showcase-card h-100">
              <div className="row g-3 g-lg-4 align-items-center">
                {/* Left Column: 3D Illuminated Studio Stage */}
                <div className="col-md-5">
                  <div className="detail-stage-studio">
                    <div className="concept1-stage">
                      <div 
                        className="concept1-pedestal-container"
                        onClick={() => setIsFullscreen(true)}
                        onTouchStart={onTouchStartHandler}
                        onTouchMove={onTouchMoveHandler}
                        onTouchEnd={onTouchEndHandler}
                        title="Click to view fullscreen zoom"
                      >
                        {/* 3D Circular Illuminated Pedestal */}
                        <div className="concept1-pedestal-base"></div>
                        <div className="concept1-pedestal-glow"></div>
                        
                        {/* 360 Degree Orbit Ring & Badge */}
                        <div className="concept1-orbit-ring"></div>
                        <div className="concept1-orbit-badge">
                          <i className="bi bi-arrow-repeat"></i> 360&deg;
                        </div>

                        {/* Floating Machinery Image */}
                        <img
                          src={getCleanProductImage(activeImg) || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=800'}
                          alt={product.name}
                          className="concept1-floating-image"
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

                      {/* Floating Thumbnail Selector Pills */}
                      {allImages.length > 1 && (
                        <div className="concept1-thumbnails-strip">
                          {allImages.map((img, i) => (
                            <div 
                              key={i} 
                              onClick={() => { setActiveImg(img); setActiveImgIndex(i); }} 
                              className={`concept1-thumb-pill ${activeImg === img ? 'active' : ''}`}
                              title={`Photo ${i + 1}`}
                            >
                              <img src={getCleanProductImage(img)} alt={`Thumbnail ${i + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Active Product Specifications & Ordering Actions */}
                <div className="col-md-7">
                  <div className="detail-content-panel">
                    {/* Category Pill Tag & In-Stock indicator */}
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="concept1-tag-badge m-0">
                        <i className="bi bi-lightning-charge-fill me-1"></i>
                        {product.category?.name || 'POWER TOOLS'}
                      </span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold px-2 py-1" style={{ fontSize: '0.68rem' }}>
                        <i className="bi bi-check-circle-fill me-1"></i> In Stock & Ready to Ship
                      </span>
                    </div>

                    {/* Bold Product Heading */}
                    <h2 className="concept1-title">{product.name}</h2>

                    {/* Price & GST Tag */}
                    <div className="concept1-price-row">
                      <span className="concept1-price">₹{product.price}</span>
                      <span className="concept1-gst-badge">GST inclusive</span>
                      {product.brand && (
                        <span className="badge bg-light text-dark fw-bold border ms-1">{product.brand}</span>
                      )}
                    </div>

                    {/* 4 Technical Specification Micro-Cards (2x2 Grid) */}
                    <div className="concept1-specs-grid">
                      {specs.map((item, idx) => (
                        <div key={idx} className="concept1-spec-card">
                          <div className="concept1-spec-icon">
                            <i className={`bi ${item.icon}`}></i>
                          </div>
                          <div className="concept1-spec-text">
                            <span className="concept1-spec-label">{item.label}</span>
                            <span className="concept1-spec-val">{item.val}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dual Action Buttons (Add to Cart & Buy Now) */}
                    <div className="concept1-cta-row">
                      <button 
                        onClick={() => addToCart(product.id)} 
                        className="concept1-btn-cart"
                        type="button"
                      >
                        <i className="bi bi-cart-plus-fill"></i> Add to Cart
                      </button>
                      <button 
                        onClick={buyNow} 
                        className="concept1-btn-buy"
                        type="button"
                      >
                        <i className="bi bi-lightning-charge-fill"></i> Buy Now
                      </button>
                    </div>

                    {/* WhatsApp Quick Inquiry Button */}
                    <a 
                      href={`https://wa.me/917742752753?text=${encodeURIComponent(`Hi, I'm interested in ${product.name} (₹${product.price}). Please share more details.`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="concept1-btn-whatsapp"
                    >
                      <i className="bi bi-whatsapp"></i> WhatsApp Inquiry
                    </a>

                    {/* Description Snippet if present */}
                    {product.description && (
                      <div className="detail-description-box">
                        <h6 className="detail-desc-heading">Overview</h6>
                        <p className="detail-desc-text small text-muted mb-0">{product.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. DISTINCT OTHER PRODUCTS SIDEBAR CARD (Right Side) ── */}
          {related_products && related_products.length > 0 && (
            <div className="col-lg-4">
              <aside className="detail-sidebar-other-card h-100 d-flex flex-column" aria-label="Other Products">
                {/* Sidebar Header Bar */}
                <div className="detail-sidebar-header mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="shelf-accent-pill">
                      <i className="bi bi-grid-3x3-gap-fill me-1"></i> OTHER PRODUCTS
                    </span>
                    <span className="shelf-count-badge">
                      {related_products.length} Items Available
                    </span>
                  </div>
                  <h4 className="detail-sidebar-title mb-0">
                    {data.related_title || 'Explore More Equipment'}
                  </h4>
                </div>

                {/* Vertical Scrollable Products List */}
                <div className="detail-sidebar-list flex-grow-1 custom-thin-scrollbar">
                  {related_products.map((prod) => {
                    const numPrice = parseFloat(prod.price) || 0;
                    const originalPrice = (numPrice * 1.15).toFixed(0);

                    return (
                      <div
                        key={prod.id}
                        className="other-product-side-item"
                        onClick={() => {
                          navigate(`/item/${prod.id}`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        role="button"
                        tabIndex={0}
                        title={`View ${prod.name}`}
                      >
                        {/* Thumbnail */}
                        <div className="other-product-side-thumb">
                          <img
                            src={getCleanProductImage(prod.image) || '/static/images/cat_hardware.jpg'}
                            alt={prod.name}
                            loading="lazy"
                          />
                        </div>

                        {/* Info */}
                        <div className="other-product-side-info">
                          {prod.category && (
                            <span className="other-product-side-cat">
                              {prod.category}
                            </span>
                          )}
                          <h5 className="other-product-side-title" title={prod.name}>
                            {prod.name}
                          </h5>
                          <div className="other-product-side-price-row">
                            <span className="other-product-side-price">₹{numPrice.toLocaleString('en-IN')}</span>
                            {parseFloat(originalPrice) > numPrice && (
                              <span className="other-product-side-old-price">₹{parseFloat(originalPrice).toLocaleString('en-IN')}</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Add Button */}
                        <button
                          type="button"
                          className="other-product-side-add-btn"
                          onClick={(e) => addToCart(prod.id, e)}
                          title={`Add ${prod.name} to Cart`}
                        >
                          <i className="bi bi-cart-plus"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Sidebar Footer Link */}
                <div className="detail-sidebar-footer mt-auto pt-2 text-center border-top">
                  <Link to="/" className="detail-sidebar-view-all">
                    Browse Full Store Catalog <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>

        {/* ── 3. FULL-WIDTH MORE PRODUCTS SHOWCASE CARD (Below Detail & Sidebar) ── */}
        {bottomShowcaseProducts && bottomShowcaseProducts.length > 0 && (
          <section className="detail-bottom-showcase-card mt-4" aria-label="Explore More Products">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="shelf-accent-pill">
                    <i className="bi bi-grid-3x3-gap-fill me-1"></i> STORE CATALOG
                  </span>
                  <span className="shelf-count-badge">
                    {bottomShowcaseProducts.length} Items Available
                  </span>
                </div>
                <h3 className="detail-bottom-showcase-title m-0">
                  Explore More Machinery, Tools & Hardware
                </h3>
              </div>
              <span className="text-muted small d-none d-md-block">
                Industrial grade power tools, motors & machinery from Burhani Hardware
              </span>
            </div>

            {/* 4-Column Grid of Products */}
            <div className="row g-3">
              {bottomShowcaseProducts.map((prod) => {
                const numPrice = parseFloat(prod.price) || 0;
                const originalPrice = (numPrice * 1.15).toFixed(0);

                return (
                  <div key={prod.id} className="col-6 col-md-4 col-lg-3">
                    <article
                      className="shelf-product-card"
                      onClick={() => {
                        navigate(`/item/${prod.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title={`View ${prod.name}`}
                    >
                      <div className="shelf-card-stage">
                        <img
                          src={getCleanProductImage(prod.image) || '/static/images/cat_hardware.jpg'}
                          alt={prod.name}
                          className="shelf-card-img"
                          loading="lazy"
                        />
                      </div>
                      <div className="shelf-card-body">
                        {prod.category && (
                          <span className="shelf-card-category">{prod.category}</span>
                        )}
                        <h4 className="shelf-card-title" title={prod.name}>
                          {prod.name}
                        </h4>
                        <div className="shelf-card-footer mt-auto pt-2">
                          <div className="shelf-price-block">
                            <span className="shelf-price-current">₹{numPrice.toLocaleString('en-IN')}</span>
                            {parseFloat(originalPrice) > numPrice && (
                              <span className="shelf-price-orig">₹{parseFloat(originalPrice).toLocaleString('en-IN')}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="shelf-add-btn"
                            onClick={(e) => addToCart(prod.id, e)}
                            title={`Add ${prod.name} to Cart`}
                          >
                            <i className="bi bi-plus-lg"></i>
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </section>
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
              <img src={getCleanProductImage(activeImg)} alt="Fullscreen View" />
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
