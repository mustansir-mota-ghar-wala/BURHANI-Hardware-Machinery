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

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning" role="status"></div></div>;
  if (!data?.product) return <div className="container py-5 text-center"><h3>Product not found.</h3><Link to="/" className="btn-terracotta text-decoration-none mt-3 d-inline-block">Home</Link></div>;

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
    <div style={{ background: '#f5f7fa', minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container py-3">
        {/* Breadcrumb - Optional, can hide on mobile if desired */}
        <nav aria-label="breadcrumb" className="mb-2 d-none d-md-block">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            {product.category && (
              <li className="breadcrumb-item">
                <Link to={`/product/${product.category.id}`}>{product.category.name}</Link>
              </li>
            )}
            <li className="breadcrumb-item active">{product.name}</li>
          </ol>
        </nav>

      <div className="row g-3 mb-5">
        {/* Mobile Style Image Container */}
        <div className="col-lg-5">
          <div style={{ background: 'white', borderRadius: '25px', padding: '15px', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', textAlign: 'center', margin: '0 auto', maxWidth: '450px' }}>
            <div 
              style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => setIsFullscreen(true)}
              onTouchStart={onTouchStartHandler}
              onTouchMove={onTouchMoveHandler}
              onTouchEnd={onTouchEndHandler}
            >
              <img
                src={activeImg || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=800'}
                alt={product.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button onClick={handlePrevImage} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-chevron-left"></i></button>
                <button onClick={handleNextImage} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-chevron-right"></i></button>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                  {allImages.map((img, i) => (
                    <div key={i} onClick={() => { setActiveImg(img); setActiveImgIndex(i); }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeImg === img ? 'var(--gg-accent)' : '#ffdcb5', cursor: 'pointer' }}></div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Style Info Container */}
        <div className="col-lg-7">
          <div style={{ background: 'white', borderRadius: '25px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            {product.category && (
              <div style={{ display: 'inline-block', background: '#fae5d3', color: '#d35400', padding: '6px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>
                {product.category.name}
              </div>
            )}
            
            <h1 className="heading-font fs-2 mb-3 fw-bold" style={{ color: '#111' }}>{product.name}</h1>
            
            <div className="d-flex align-items-center gap-2 mb-4">
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--gg-accent)', lineHeight: 1 }}>₹{product.price}</span>
              <span style={{ background: '#fae5d3', color: '#d35400', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>INCL. GST</span>
            </div>

            <div className="row g-2 mb-4 d-none d-lg-flex">
              <div className="col-6">
                <button onClick={addToCart} style={{ width: '100%', background: '#198754', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                  <i className="bi bi-cart-plus"></i> ADD TO CART
                </button>
              </div>
              <div className="col-6">
                <button onClick={buyNow} style={{ width: '100%', background: 'var(--gg-accent)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                  <i className="bi bi-lightning-fill"></i> BUY NOW
                </button>
              </div>
            </div>

            {product.description && (
              <div className="mb-4">
                <p className="text-muted lh-lg" style={{ fontSize: '0.95rem' }}>{product.description}</p>
              </div>
            )}

            {/* Contact strip full width green */}
            <a href="https://wa.me/917742752753" target="_blank" rel="noopener" style={{ display: 'block', width: '100%', background: '#25D366', color: 'white', textAlign: 'center', padding: '14px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '1px' }}>
              <i className="bi bi-whatsapp me-2"></i> CHAT ON WHATSAPP
            </a>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related_products?.length > 0 && (
        <div className="container px-0">
          <h2 className="section-title mb-4">Related Products</h2>
          <div className="row g-3">
            {related_products.slice(0, 4).map(prod => (
              <div key={prod.id} className="col-6 col-md-3">
                <div className="prod-card touch-feedback">
                  <Link to={`/item/${prod.id}`} className="prod-img d-block text-decoration-none">
                    <img src={prod.image || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=400'} alt={prod.name} />
                  </Link>
                  <div className="prod-info text-center">
                    <Link to={`/item/${prod.id}`} className="text-decoration-none text-dark"><h4>{prod.name}</h4></Link>
                    <div className="prod-price">₹{prod.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Mobile Fixed Action Buttons */}
      <div className="d-flex d-lg-none" style={{ position: 'fixed', bottom: '75px', left: 0, right: 0, background: 'transparent', padding: '10px 15px', zIndex: 900, gap: '10px' }}>
        <button onClick={addToCart} style={{ flex: 1, background: '#198754', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <i className="bi bi-cart-plus"></i> ADD TO CART
        </button>
        <button onClick={buyNow} style={{ flex: 1, background: 'var(--gg-accent)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 10px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <i className="bi bi-lightning-fill"></i> BUY NOW
        </button>
      </div>

      </div>

      {isFullscreen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setIsFullscreen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
          
          {allImages.length > 1 && (
             <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: 'white', width: '50px', height: '50px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><i className="bi bi-chevron-left"></i></button>
          )}

          <div
             onTouchStart={onTouchStartHandler}
             onTouchMove={onTouchMoveHandler}
             onTouchEnd={onTouchEndHandler}
             style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
             <img src={activeImg} alt="Fullscreen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>

          {allImages.length > 1 && (
             <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: 'white', width: '50px', height: '50px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><i className="bi bi-chevron-right"></i></button>
          )}
        </div>
      )}
    </div>
  );
}
