import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost, apiPostForm } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function HomePage({ setToasts }) {
  const [data, setData] = useState({ categories: [], products: [], query: '' });
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    setLoading(true);
    const url = query ? `/api/react/home/?q=${encodeURIComponent(query)}` : '/api/react/home/';
    apiGet(url).then(d => { setData(d); setLoading(false); });
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.elements.q.value.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  const addToCart = async (productId) => {
    if (!user) { navigate('/login'); return; }
    const res = await apiPost(`/api/react/cart/add/${productId}/`);
    if (res.status === 'success') {
      setCartCount(res.cart_count);
      setToasts(t => [...t, { tag: 'success', text: 'Added to cart!' }]);
    } else {
      setToasts(t => [...t, { tag: 'error', text: res.message || 'Error adding to cart.' }]);
    }
  };

  const handleVisualSearch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show loading modal concept - just navigate to home with placeholder
    const formData = new FormData();
    formData.append('image', file);
    try {
      const data = await apiPostForm('/api/visual-search/', formData);
      if (data.status === 'success' && data.keywords?.length) {
        navigate(`/?q=${encodeURIComponent(data.keywords.join(' '))}`);
      }
    } catch { setToasts(t => [...t, { tag: 'error', text: 'Visual search failed.' }]); }
  };

  const slideNext = () => { if (sliderRef.current) sliderRef.current.scrollBy({ left: 270, behavior: 'smooth' }); };
  const slidePrev = () => { if (sliderRef.current) sliderRef.current.scrollBy({ left: -270, behavior: 'smooth' }); };

  return (
    <>
      {/* ── Mobile Search Bar ── */}
      <form className="mobile-search-bar d-lg-none" id="mobileSearchForm" onSubmit={handleSearch} style={{ margin: '8px 15px 10px', position: 'sticky', top: '62px', zIndex: 1040, background: 'white', borderRadius: '50px', border: '1px solid var(--gg-accent)', boxShadow: '0 5px 15px rgba(230, 126, 34, 0.1)' }}>
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          <input type="text" name="q" id="mobileSearchInput"
            placeholder="Search tools..." defaultValue={query}
            style={{ width: '100%', padding: '8px 15px', paddingRight: '110px', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem' }} />
          <div style={{ position: 'absolute', right: '5px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button type="button" onClick={() => setToasts(t => [...t, { tag: 'info', text: 'Voice search coming soon!' }])}
              style={{ background: 'rgba(211,84,0,0.1)', borderRadius: '50%', border: 'none', fontSize: '1.05rem', color: 'var(--gg-accent)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <i className="bi bi-mic"></i>
            </button>
            <label htmlFor="cameraInputMobile"
              style={{ background: 'rgba(211,84,0,0.1)', borderRadius: '8px', border: 'none', fontSize: '1.05rem', color: 'var(--gg-accent)', padding: '5px 8px', height: '32px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <i className="bi bi-camera-fill"></i>
            </label>
            <input type="file" id="cameraInputMobile" accept="image/*" capture="environment" className="d-none" onChange={handleVisualSearch} />
            <button type="submit"
              style={{ background: 'transparent', border: 'none', padding: '5px', color: 'var(--gg-header)', cursor: 'pointer' }}>
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>
      </form>

      {/* ── Mobile Category Pills ── */}
      {!query && (
        <div className="cat-pill-container d-lg-none" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 15px 5px', scrollbarWidth: 'none' }}>
          {data.categories.map(cat => (
            <Link key={cat.id} to={`/product/${cat.id}`} className="cat-pill" style={{ background: '#fae5d3', color: '#d35400', padding: '6px 12px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', textDecoration: 'none' }}>{cat.name}</Link>
          ))}
        </div>
      )}

      {/* ── Hero Section ── */}
      {!query && (
        <div className="container hero-container">
          <div className="hero-box"
            style={{ background: `linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.18)), url('/static/images/120534CD-5AF1-44FC-8322-939E9A693A33.jpg')`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
            <div className="hero-content">
              <a href="#categories" className="btn-terracotta text-decoration-none">Explore Categories</a>
            </div>
          </div>
          <div className="hero-categories">
            <h2 className="heading-font">Latest Products</h2>
            <div className="hero-category-grid">
              {data.products.map(product => (
                <Link key={product.id} to={`/item/${product.id}`} className="prod-card touch-feedback d-block text-decoration-none text-dark position-relative">
                  <div className="prod-img d-block">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=800&auto=format&fit=crop'}
                      alt={product.name}
                    />
                  </div>
                  <div className="prod-info text-center p-2">
                    <h4 style={{ fontSize: '0.8rem', marginBottom: '4px', height: '2.4em', overflow: 'hidden' }}>{product.name}</h4>
                    <div className="prod-price" style={{ fontSize: '0.9rem' }}>₹{product.price}</div>
                  </div>
                </Link>
              ))}
              
              {/* Render empty placeholders to guarantee 2 rows of 3 columns (6 slots total) */}
              {Array.from({ length: Math.max(0, 6 - (data.products ? data.products.length : 0)) }).map((_, idx) => (
                <div key={`empty-${idx}`} className="prod-card d-block position-relative" style={{ opacity: 0.4, pointerEvents: 'none' }}>
                  <div className="prod-img d-block" style={{ background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-image text-muted fs-3"></i>
                  </div>
                  <div className="prod-info text-center p-2">
                    <div style={{ background: '#e0e0e0', height: '0.8rem', width: '80%', margin: '0 auto 8px', borderRadius: '4px' }}></div>
                    <div style={{ background: '#e0e0e0', height: '0.9rem', width: '40%', margin: '0 auto', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Categories Slider ── */}
      {!query && (
        <div className="container pb-1 pt-0" id="categories">
          <h2 className="section-title m-0 pb-2 pt-1" style={{ fontSize: '1.2rem' }}>Shop By Category</h2>

          {/* Desktop Slider */}
          <div className="d-none d-md-block slider-nav-container">
            <button className="slider-btn btn-prev" onClick={slidePrev}><i className="bi bi-chevron-left"></i></button>
            <button className="slider-btn btn-next" onClick={slideNext}><i className="bi bi-chevron-right"></i></button>
            <div className="cat-slider-container" ref={sliderRef}>
              {data.categories.map(cat => (
                <div key={cat.id} className="cat-slide-item">
                  <Link to={`/product/${cat.id}`} className="cat-card">
                    <div className="cat-img">
                      {cat.image
                        ? <img src={cat.image} alt={cat.name} />
                        : <img src="/static/images/cat_hardware.png" alt="Hardware" />
                      }
                    </div>
                    <h3 className="mt-3 fs-5" style={{ textTransform: 'capitalize' }}>{cat.name}</h3>
                    <p className="small text-muted d-none d-md-block">Shop Essentials</p>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Grid */}
          <div className="row g-3 d-flex d-md-none">
            {data.categories.map(cat => (
              <div key={cat.id} className="col-6">
                <Link to={`/product/${cat.id}`} className="mobile-cat-card" style={{
                  display: 'block',
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  <img src={cat.image || "/static/images/cat_hardware.png"} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    padding: '40px 15px 12px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
                    color: 'white',
                    zIndex: 2,
                  }}>
                    <h3 className="m-0 fw-bold" style={{ color: 'white', textTransform: 'capitalize', fontSize: '1rem', textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{cat.name}</h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Products Grid ── */}
      <div className="container pb-1 pt-0">
        {!query && (
          <div className="d-flex justify-content-center align-items-center gap-2 flex-nowrap" style={{ margin: '0 0 0.5rem' }}>
            <h2 className="section-title m-0 text-nowrap pb-1 pt-1" style={{ margin: '0 !important', fontSize: 'clamp(1.2rem, 5vw, 2rem)' }}>New Arrivals</h2>
            <span className="badge bg-danger rounded-pill shadow-sm px-2 py-1" style={{ fontSize: '0.7rem', transform: 'translateY(-8px)' }}>🔥 NEW</span>
          </div>
        )}

        {query && (
          <div className="py-3 text-muted">
            {loading ? 'Searching...' : `${data.products.length} result${data.products.length !== 1 ? 's' : ''} for "${query}"`}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : (
          <div className="row g-3">
            {data.products.length > 0 ? data.products.map(product => (
              <div key={product.id} className="col-6 col-md-3">
                <Link to={`/item/${product.id}`} className="prod-card touch-feedback d-block text-decoration-none text-dark position-relative">
                  <div className="prod-img d-block">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=800&auto=format&fit=crop'}
                      alt={product.name}
                    />
                  </div>
                  <div className="prod-info text-center">
                    <h4>{product.name}</h4>
                    <div className="prod-price">₹{product.price}</div>
                    <button className="btn-add position-relative" style={{ zIndex: 2 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product.id); }}>Add to Cart</button>
                  </div>
                </Link>
              </div>
            )) : (
              <div className="col-12 text-center py-5">
                <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
                <h3>No results found</h3>
                <p className="text-muted">Try a different search term.</p>
                <Link to="/" className="btn-terracotta text-decoration-none">Back to Home</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── About Section ── */}
      {!query && (
        <div className="container py-1" id="about">
          <div className="row align-items-center g-2">
            <div className="col-lg-6">
              <p className="text-uppercase fw-bold" style={{ letterSpacing: '3px', color: 'var(--gg-accent)', fontSize: '0.85rem' }}>About Us</p>
              <h2 className="heading-font mb-4">Bhawani Mandi's Trusted Hardware Store</h2>
              <p className="text-muted mb-3 lh-lg">
                Burhani Hardware and Machinery, owned by <strong>Huzaifa Bhai Boraji</strong>, has been serving customers in Bhawani Mandi with premium quality tools, machinery, motors, pipes, and agricultural equipment.
              </p>
              <ul className="list-unstyled">
                {['Chainsaw & Power Tools', 'Welding Machines (200A-400A)', 'Openwell & Tubewell Motor Pumps', 'Electric Cables & PVC Wires', 'Carpenter Tools & Spare Parts'].map(item => (
                  <li key={item} className="mb-2">
                    <i className="bi bi-check-circle-fill text-warning me-2"></i>{item}
                  </li>
                ))}
              </ul>
              <a href="https://maps.app.goo.gl/xJR2zs7dau7Srehg7" target="_blank" rel="noopener"
                className="btn-terracotta text-decoration-none mt-3 d-inline-block">
                <i className="bi bi-geo-alt-fill me-2"></i>Find Us on Maps
              </a>
            </div>
            <div className="col-lg-6">
              <div style={{ background: 'var(--gg-header)', borderRadius: '24px', padding: '2.5rem', color: 'white' }}>
                <h4 className="text-warning mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Store Details</h4>
                {[
                  { icon: 'bi-person-fill', label: 'Owner', value: 'Huzaifa Bhai Boraji' },
                  { icon: 'bi-geo-alt-fill', label: 'Address', value: 'Balaji Chauraha, Station Road, Bhawani Mandi, Jhalawar, Rajasthan' },
                  { icon: 'bi-telephone-fill', label: 'Phone', value: '+91 77427 52753' },
                  { icon: 'bi-clock-fill', label: 'Hours', value: '8:00 AM – 8:00 PM (Mon–Sun)' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="d-flex gap-3 mb-3">
                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,193,7,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`bi ${icon} text-warning`}></i>
                    </div>
                    <div>
                      <div className="text-white-50 small">{label}</div>
                      <div className="fw-bold">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
