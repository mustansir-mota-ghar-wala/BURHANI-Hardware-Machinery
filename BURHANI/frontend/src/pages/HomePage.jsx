import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function HomePage({ setToasts }) {
  const [data, setData] = useState({ categories: [], products: [], query: '' });
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [wishlist, setWishlist] = useState({});
  const [searchParams] = useSearchParams();
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';

  useEffect(() => {
    setLoading(true);
    const url = query ? `/api/react/home/?q=${encodeURIComponent(query)}` : '/api/react/home/';
    apiGet(url).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [query]);

  const addToCart = async (productId, e) => {
    e.stopPropagation();
    if (!user?.is_authenticated) {
      navigate('/login');
      return;
    }
    const res = await apiPost(`/api/react/cart/add/${productId}/`);
    if (res.status === 'success') {
      setCartCount(res.cart_count);
      setToasts((t) => [...t, { tag: 'success', text: 'Added to cart!' }]);
    } else {
      setToasts((t) => [...t, { tag: 'error', text: res.message || 'Error adding to cart.' }]);
    }
  };

  const toggleWishlist = (productId, e) => {
    e.stopPropagation();
    setWishlist((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Get icon for categories
  const getCategoryIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('power')) return 'bi-lightning-charge';
    if (n.includes('hand')) return 'bi-wrench-adjustable';
    if (n.includes('weld')) return 'bi-fire';
    if (n.includes('machin')) return 'bi-gear-wide-connected';
    if (n.includes('chain') || n.includes('saw')) return 'bi-tree';
    if (n.includes('pneu') || n.includes('air')) return 'bi-wind';
    if (n.includes('safe')) return 'bi-shield-check';
    if (n.includes('spare') || n.includes('part')) return 'bi-nut';
    if (n.includes('lub')) return 'bi-droplet-half';
    return 'bi-tools';
  };

  const filteredProducts = selectedCatId
    ? data.products.filter((p) => p.category_id === selectedCatId || p.category === selectedCatId)
    : data.products;

  // Curated 10 latest updated products from different categories for interactive deck
  const heroDeckItems = React.useMemo(() => {
    if (!data.products || data.products.length === 0) {
      return [
        { id: 1, name: 'Powerbuilt Chain Saw 58cc', category: 'Chain Saw', price: '7,000', image: '/static/images/cat_chainsaw.jpg' },
        { id: 2, name: 'Grinder Bosch Professional', category: 'Power Tools', price: '2,100', image: '/static/images/cat_powertools.jpg' },
        { id: 3, name: 'Inverter ARC Welding Machine', category: 'Welding Machine', price: '4,500', image: '/static/images/cat_machinery.jpg' },
        { id: 4, name: 'Heavy Duty Drill Machine', category: 'Power Tools', price: '3,200', image: '/static/images/hero_powertools.jpg' },
        { id: 5, name: 'Submersible Water Pump 1HP', category: 'Water Pumps', price: '6,200', image: '/static/images/cat_machinery.jpg' },
        { id: 6, name: 'Copper Core Electrical Wire 90m', category: 'Electrical', price: '1,850', image: '/static/images/cat_powertools.jpg' },
        { id: 7, name: 'Industrial Safety Helmet & Visor', category: 'Safety Equipment', price: '850', image: '/static/images/cat_chainsaw.jpg' },
        { id: 8, name: 'Heavy Duty Hand Tool Set 82-pc', category: 'Hand Tools', price: '2,900', image: '/static/images/hero_powertools.jpg' },
        { id: 9, name: 'Diamond Cutting Disc 4-inch', category: 'Abrasives', price: '450', image: '/static/images/cat_machinery.jpg' },
        { id: 10, name: 'Carburetor Spare for Chain Saw', category: 'Spare Parts', price: '1,150', image: '/static/images/cat_chainsaw.jpg' },
      ];
    }

    // Group latest products by category
    const categoryGroups = {};
    for (const p of data.products) {
      const cat = (typeof p.category === 'object' ? p.category?.name : p.category) || 'General';
      if (!categoryGroups[cat]) {
        categoryGroups[cat] = [];
      }
      categoryGroups[cat].push(p);
    }

    const selected = [];
    const selectedIds = new Set();
    const catNames = Object.keys(categoryGroups);

    // Round-robin selection across different categories to guarantee maximum diversity
    const maxPerGroup = Math.max(...catNames.map((k) => categoryGroups[k].length), 1);
    for (let r = 0; r < maxPerGroup; r++) {
      for (const cat of catNames) {
        if (selected.length >= 10) break;
        const prod = categoryGroups[cat][r];
        if (prod && !selectedIds.has(prod.id)) {
          selected.push(prod);
          selectedIds.add(prod.id);
        }
      }
      if (selected.length >= 10) break;
    }

    // If still under 10, fill with remaining latest products
    if (selected.length < 10) {
      for (const p of data.products) {
        if (selected.length >= 10) break;
        if (!selectedIds.has(p.id)) {
          selected.push(p);
          selectedIds.add(p.id);
        }
      }
    }

    return selected.slice(0, 10);
  }, [data.products]);

  const [deckIndex, setDeckIndex] = useState(0);

  // Auto-switch hero deck every 4 seconds (resets timer upon user interaction)
  useEffect(() => {
    if (heroDeckItems.length === 0) return;
    const interval = setInterval(() => {
      setDeckIndex((prev) => (prev + 1) % heroDeckItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroDeckItems.length, deckIndex]);

  const handlePrevDeck = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeckIndex((prev) => (prev - 1 + heroDeckItems.length) % heroDeckItems.length);
  };

  const handleNextDeck = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeckIndex((prev) => (prev + 1) % heroDeckItems.length);
  };

  const getDeckCardItem = (offset) => {
    if (!heroDeckItems || heroDeckItems.length === 0) return null;
    const len = heroDeckItems.length;
    const idx = ((deckIndex + offset) % len + len) % len;
    return heroDeckItems[idx];
  };

  const farLeftItem = getDeckCardItem(-2);
  const leftItem = getDeckCardItem(-1);
  const centerItem = getDeckCardItem(0);
  const rightItem = getDeckCardItem(1);
  const farRightItem = getDeckCardItem(2);

  const renderDeckCard = (item, layerClass, isActive = false) => {
    if (!item) return null;

    const handleCardClick = (e) => {
      e.stopPropagation();
      if (isActive) {
        navigate(`/item/${item.id}`);
      } else if (layerClass.includes('layer-left')) {
        handlePrevDeck();
      } else if (layerClass.includes('layer-right')) {
        handleNextDeck();
      } else if (layerClass.includes('layer-far-left')) {
        setDeckIndex((prev) => (prev - 2 + heroDeckItems.length) % heroDeckItems.length);
      } else if (layerClass.includes('layer-far-right')) {
        setDeckIndex((prev) => (prev + 2) % heroDeckItems.length);
      }
    };

    return (
      <div
        key={`${item.id}-${layerClass}`}
        className={`hero-deck-card ${layerClass} ${isActive ? 'active-card' : ''}`}
        onClick={handleCardClick}
        title={isActive ? `View ${item.name} details` : `Switch to ${item.name}`}
      >
        <div className="deck-card-image-full">
          <img
            src={item.image || '/static/images/cat_powertools.jpg'}
            alt={item.name}
            onError={(e) => { e.target.src = '/static/images/cat_powertools.jpg'; }}
          />
        </div>
        <div className="deck-card-name-overlay">
          <span className="deck-card-name-text">{item.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="scenic-app-wrapper">
      {/* ── Main Floating Glassmorphic Canvas ── */}
      <div className="glass-canvas-container">
        
        {/* ── Active Search Filter Notice ── */}
        {query && (
          <div className="search-filter-banner mb-4 d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted small">Search Results for: </span>
              <strong className="text-dark">"{query}"</strong>
              <span className="badge bg-light text-dark ms-2">{filteredProducts.length} items</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn btn-sm btn-outline-secondary rounded-pill"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* ── Top Hero Banner (Matching Reference Design with Card Deck) ── */}
        {!query && (
          <section className="reference-hero-banner" aria-label="Featured Hardware">
            <div className="hero-banner-content">
              <div className="hero-pill-tag">Burhani Hardware</div>
              <h1 className="hero-banner-heading">
                Heavy-Duty Tools &amp;<br />Industrial Machinery
              </h1>
              <p className="hero-banner-subtext">
                Engineered for performance. Heavy industrial machinery, cordless power tools &amp; genuine spare parts.
              </p>

              {/* Carousel indicator dots synced with 4-second deck */}
              <div className="hero-dots-row">
                {heroDeckItems.map((_, i) => (
                  <span
                    key={i}
                    className={`hero-dot ${deckIndex === i ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeckIndex(i);
                    }}
                    style={{ cursor: 'pointer' }}
                  ></span>
                ))}
              </div>
            </div>

            {/* Glowing Hero Showcase - Interactive 3D Card Deck UI */}
            <div className="hero-showcase-visual">
              <div className="hero-glow-backdrop"></div>
              
              <div className="hero-deck-container">
                <button
                  type="button"
                  className="hero-deck-arrow left"
                  onClick={handlePrevDeck}
                  title="Previous Product"
                  aria-label="Previous Product"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                <div className="hero-deck-cards-stage">
                  {renderDeckCard(farLeftItem, 'layer-far-left')}
                  {renderDeckCard(leftItem, 'layer-left')}
                  {renderDeckCard(farRightItem, 'layer-far-right')}
                  {renderDeckCard(rightItem, 'layer-right')}
                  {renderDeckCard(centerItem, 'active-card', true)}
                </div>

                <button
                  type="button"
                  className="hero-deck-arrow right"
                  onClick={handleNextDeck}
                  title="Next Product"
                  aria-label="Next Product"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Horizontal Squircle Category Strip (Full Image + Clear Name) ── */}
        <section className="category-strip-section" aria-label="Product Categories">
          <div className="category-scroll-strip">
            {/* "All" Card */}
            <button
              type="button"
              className={`squircle-cat-card all-card ${selectedCatId === null ? 'active' : ''}`}
              onClick={() => setSelectedCatId(null)}
              title="All Categories"
            >
              <div className="squircle-icon-wrap">
                <i className="bi bi-grid-fill"></i>
              </div>
              <span className="squircle-card-name">All</span>
            </button>

            {/* Dynamic Categories: Full image filling card, name written clearly on it */}
            {data.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`squircle-cat-card ${selectedCatId === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCatId(selectedCatId === cat.name ? null : cat.name)}
                title={cat.name}
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="squircle-card-bg-img" />
                ) : (
                  <div className="squircle-icon-wrap">
                    <i className={`bi ${getCategoryIcon(cat.name)}`}></i>
                  </div>
                )}
                <div className="squircle-card-scrim"></div>
                <span className="squircle-card-name">
                  {cat.name.replace(/ tools| equipment/i, '')}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Recommended For You Section Header ── */}
        <div className="section-header-row">
          <h2 className="section-title">
            {selectedCatId ? `${selectedCatId}` : 'Recommended For You'}
          </h2>
          <Link to={selectedCatId ? `/` : '/product/1'} className="section-view-all">
            View All
          </Link>
        </div>

        {/* ── Product Cards Grid ── */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="mt-2 text-muted">Loading premium catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm my-3">
            <i className="bi bi-search fs-1 text-muted"></i>
            <h5 className="mt-3 fw-bold">No products found</h5>
            <p className="text-muted">Try a different keyword or category.</p>
            <button
              onClick={() => { setSelectedCatId(null); navigate('/'); }}
              className="btn btn-outline-success rounded-pill px-4"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="products-minimal-grid">
            {filteredProducts.map((p) => {
              const numPrice = parseFloat(p.price) || 0;
              const originalPrice = (numPrice * 1.15).toFixed(0);
              const isFav = wishlist[p.id];

              return (
                <article
                  key={p.id}
                  className="product-minimal-card"
                  onClick={() => navigate(`/item/${p.id}`)}
                >
                  {/* Wishlist Heart Button */}
                  <button
                    type="button"
                    className={`card-wishlist-btn ${isFav ? 'active' : ''}`}
                    onClick={(e) => toggleWishlist(p.id, e)}
                    title={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className={`bi ${isFav ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                  </button>

                  {/* Product Image */}
                  <div className="card-image-stage">
                    <img
                      src={p.image || '/static/images/cat_hardware.jpg'}
                      alt={p.name}
                      className="product-feature-img"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="card-info-stage">
                    <h3 className="card-product-title" title={p.name}>
                      {p.name}
                    </h3>

                    {/* Pricing & Add Button Row */}
                    <div className="card-footer-row">
                      <div className="card-price-block">
                        <span className="price-main">₹{numPrice.toLocaleString('en-IN')}</span>
                        <span className="price-struck">₹{parseFloat(originalPrice).toLocaleString('en-IN')}</span>
                      </div>

                      <button
                        type="button"
                        className="card-quick-add-btn"
                        onClick={(e) => addToCart(p.id, e)}
                        title="Add to Cart"
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
