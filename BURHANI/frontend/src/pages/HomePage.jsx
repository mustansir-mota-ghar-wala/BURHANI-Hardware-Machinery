import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCleanProductImage } from '../utils/imageUrl';

const CATEGORY_HERO_ITEMS = [
  {
    id: 1,
    name: 'Power Tools',
    catFilter: 'Power Tools',
    image: '/static/category_images/cat_power_tools.png',
    tag: 'Power Tools & Cordless',
    heading: 'Heavy-Duty & Cordless Power Tools',
    description: 'High-torque drill machines, rotary hammers, angle grinders & precision industrial cutters engineered for extreme endurance.',
  },
  {
    id: 2,
    name: 'Chain Saw',
    catFilter: 'Chain Saw',
    image: '/static/category_images/cat_chainsaw.png',
    tag: 'Chainsaws & Forestry',
    heading: 'Precision Cutting & Heavy-Duty Saws',
    description: 'Powerful 58cc 2-stroke petrol chainsaws, electric tree pruners & high-strength diamond chain blades for clean lumber cuts.',
  },
  {
    id: 3,
    name: 'Welding Machine',
    catFilter: 'Welding Machine',
    image: '/static/category_images/cat_welding.png',
    tag: 'Welding & Fabrication',
    heading: 'Inverter ARC & TIG Welding Machinery',
    description: 'Next-gen IGBT inverter welders, plasma cutting equipment, electrodes & heavy industrial fabrication accessories.',
  },
  {
    id: 4,
    name: 'Water Pumps',
    catFilter: 'Water Pumps',
    image: '/static/category_images/cat_machinery.png',
    tag: 'Pumps & Motors',
    heading: 'Agricultural & Submersible Water Pumps',
    description: 'High-discharge submersible pumps, monoblock induction motors & pressure booster systems for commercial and farm use.',
  },
  {
    id: 5,
    name: 'Wires And Cables',
    catFilter: 'Wires And Cables',
    image: '/static/category_images/cat_hardware.png',
    tag: 'Electrical & Cabling',
    heading: 'Pure Copper Heavy-Duty Wiring & Cables',
    description: 'ISI certified flame-retardant industrial cables, submersible wires & heavy-load multi-strand electrical power lines.',
  },
  {
    id: 6,
    name: 'Spare parts',
    catFilter: 'Spare parts',
    image: '/static/category_images/cat_spare_parts.png',
    tag: 'Genuine Spares',
    heading: 'Precision Spares & Replacement Parts',
    description: 'Authentic armatures, carbon brushes, high-speed bearings, carburetors and precision machinery parts to keep your equipment running.',
  },
  {
    id: 7,
    name: 'Hand Tools',
    catFilter: 'Hand Tools',
    image: '/static/category_images/cat_hand_tools.png',
    tag: 'Hand Tools & Kits',
    heading: 'Industrial Hand Tools & Toolkits',
    description: 'Chrome vanadium spanners, impact socket sets, heavy-duty pliers, torque wrenches & precision hand tools for craftsmen.',
  },
  {
    id: 8,
    name: 'Pneumatic Tools',
    catFilter: 'Pneumatic Tools',
    image: '/static/category_images/cat_pneumatic.png',
    tag: 'Air & Pneumatics',
    heading: 'High-Pressure Pneumatic Air Tools',
    description: 'Industrial air compressors, pneumatic impact wrenches, air nailers, spray guns & durable high-pressure fittings.',
  },
  {
    id: 9,
    name: 'Safety Equipment',
    catFilter: 'Safety Equipment',
    image: '/static/category_images/cat_safety.png',
    tag: 'Workplace Safety',
    heading: 'Certified Industrial Protection & Safety Gear',
    description: 'Heavy-duty safety helmets, impact-resistant goggles, cut-resistant gloves & protective high-visibility workwear.',
  },
  {
    id: 10,
    name: 'Lubricants & Oils',
    catFilter: 'Lubricants',
    image: '/static/category_images/cat_lubricants.png',
    tag: 'Maintenance & Fluids',
    heading: 'High-Grade Lubricants & Maintenance Oils',
    description: 'High-performance 2T engine lubricants, chain oils, industrial anti-rust grease sprays & precision machinery fluids.',
  },
];

const CATEGORY_IMAGE_MAP = {
  'all': '/static/category_images/cat_all.png',
  'all categories': '/static/category_images/cat_all.png',
  'power tools': '/static/category_images/cat_power_tools.png',
  'power': '/static/category_images/cat_power_tools.png',
  'chain saw': '/static/category_images/cat_chainsaw.png',
  'chainsaw': '/static/category_images/cat_chainsaw.png',
  'welding machine': '/static/category_images/cat_welding.png',
  'welding': '/static/category_images/cat_welding.png',
  'water pumps': '/static/category_images/cat_machinery.png',
  'water pump': '/static/category_images/cat_machinery.png',
  'machinery': '/static/category_images/cat_machinery.png',
  'wires and cables': '/static/category_images/cat_hardware.png',
  'wires & cables': '/static/category_images/cat_hardware.png',
  'spare parts': '/static/category_images/cat_spare_parts.png',
  'spare part': '/static/category_images/cat_spare_parts.png',
  'hand tools': '/static/category_images/cat_hand_tools.png',
  'pneumatic tools': '/static/category_images/cat_pneumatic.png',
  'safety equipment': '/static/category_images/cat_safety.png',
  'lubricants': '/static/category_images/cat_lubricants.png',
  'precision': '/static/category_images/cat_precision.png',
};

const getCategoryImageUrl = (cat) => {
  if (!cat) return '/static/category_images/cat_power_tools.png';
  const name = (cat.name || '').toLowerCase().trim();
  if (CATEGORY_IMAGE_MAP[name]) return CATEGORY_IMAGE_MAP[name];
  if (name.includes('power')) return '/static/category_images/cat_power_tools.png';
  if (name.includes('chain') || name.includes('saw')) return '/static/category_images/cat_chainsaw.png';
  if (name.includes('weld')) return '/static/category_images/cat_welding.png';
  if (name.includes('pump') || name.includes('water')) return '/static/category_images/cat_machinery.png';
  if (name.includes('wire') || name.includes('cable')) return '/static/category_images/cat_hardware.png';
  if (name.includes('spare') || name.includes('part')) return '/static/category_images/cat_spare_parts.png';
  if (name.includes('hand')) return '/static/category_images/cat_hand_tools.png';
  if (name.includes('pneu') || name.includes('air')) return '/static/category_images/cat_pneumatic.png';
  if (name.includes('safe')) return '/static/category_images/cat_safety.png';
  if (name.includes('lub')) return '/static/category_images/cat_lubricants.png';
  if (name.includes('precis')) return '/static/category_images/cat_precision.png';
  return cat.image || '/static/category_images/cat_power_tools.png';
};

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
    if (!user || (!user.is_authenticated && !user.username)) {
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
    ? data.products.filter((p) => {
        const catStr = (typeof p.category === 'object' ? p.category?.name : p.category) || '';
        return (
          p.category_id === selectedCatId ||
          catStr.toLowerCase() === selectedCatId.toLowerCase() ||
          p.name.toLowerCase().includes(selectedCatId.toLowerCase())
        );
      })
    : data.products;

  // Curated category items with images from media/category_images and synced descriptions
  const heroDeckItems = CATEGORY_HERO_ITEMS;

  const [deckIndex, setDeckIndex] = useState(0);

  // Active category synced with the front center card
  const activeCategory = heroDeckItems[deckIndex] || heroDeckItems[0];

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
        setSelectedCatId(item.catFilter || item.name);
        const el = document.querySelector('.products-minimal-grid') || document.querySelector('.category-strip-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        title={isActive ? `Explore ${item.name} products` : `Switch to ${item.name}`}
      >
        <div className="deck-card-image-full">
          <img
            src={item.image}
            alt={item.name}
            onError={(e) => {
              if (e.target.src.includes('/static/')) {
                e.target.src = e.target.src.replace('/static/', '/media/');
              } else if (!e.target.src.includes('cat_power_tools.png')) {
                e.target.src = '/static/category_images/cat_power_tools.png';
              }
            }}
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

        {/* ── Top Hero Banner (Categories 3D Card Deck + Dynamic Left Description) ── */}
        {!query && (
          <section className="reference-hero-banner" aria-label="Featured Hardware Categories">
            <div className="hero-banner-content" key={activeCategory.id || deckIndex}>
              <div className="hero-pill-tag">
                <i className="bi bi-tag-fill me-1"></i>
                {activeCategory.tag}
              </div>
              <h1 className="hero-banner-heading">
                {activeCategory.heading}
              </h1>
              <p className="hero-banner-subtext">
                {activeCategory.description}
              </p>

              <div className="hero-action-row mb-3">
                <button
                  type="button"
                  className="hero-explore-cat-btn"
                  onClick={() => {
                    setSelectedCatId(activeCategory.catFilter || activeCategory.name);
                    const el = document.querySelector('.products-minimal-grid') || document.querySelector('.category-strip-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  title={`Browse ${activeCategory.name} products`}
                >
                  <span>Explore {activeCategory.name}</span>
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>

              {/* Carousel indicator dots synced with 4-second deck */}
              <div className="hero-dots-row">
                {heroDeckItems.map((cat, i) => (
                  <span
                    key={cat.id || i}
                    className={`hero-dot ${deckIndex === i ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeckIndex(i);
                    }}
                    title={`View ${cat.name}`}
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

        {/* ── Horizontal Squircle Category Strip (Browse by Categories in Same Row) ── */}
        <section className="category-strip-section" aria-label="Browse by Categories">
          <div className="category-inline-row">
            <div className="category-strip-label-inline">
              <i className="bi bi-grid-3x3-gap-fill text-success"></i>
              <span className="category-strip-label-text">
                Browse by<br className="d-none d-md-inline" /> Categories
              </span>
            </div>

            <div className="category-scroll-strip">
              {/* "All" Card with generated category image */}
              <button
                type="button"
                className={`squircle-cat-card all-card ${selectedCatId === null ? 'active' : ''}`}
                onClick={() => setSelectedCatId(null)}
                title="All Categories"
              >
                <img
                  src="/static/category_images/cat_all.png"
                  alt="All Categories"
                  className="squircle-card-bg-img"
                  onError={(e) => {
                    if (e.target.src.includes('/static/')) {
                      e.target.src = e.target.src.replace('/static/', '/media/');
                    }
                  }}
                />
                <div className="squircle-card-scrim"></div>
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
                  <img
                    src={getCategoryImageUrl(cat)}
                    alt={cat.name}
                    className="squircle-card-bg-img"
                    onError={(e) => {
                      if (e.target.src.includes('/static/')) {
                        e.target.src = e.target.src.replace('/static/', '/media/');
                      } else if (!e.target.src.includes('cat_power_tools.png')) {
                        e.target.src = '/static/category_images/cat_power_tools.png';
                      }
                    }}
                  />
                  <div className="squircle-card-scrim"></div>
                  <span className="squircle-card-name">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

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
                      src={getCleanProductImage(p.image) || '/static/images/cat_hardware.jpg'}
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
