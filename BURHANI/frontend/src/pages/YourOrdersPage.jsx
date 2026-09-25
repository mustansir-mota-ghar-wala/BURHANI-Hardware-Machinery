import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCleanProductImage } from '../utils/imageUrl';
import OrderInvoiceModal from '../components/OrderInvoiceModal';
import CancelOrderModal from '../components/CancelOrderModal';

// Status badge styling helper
function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('delivered')) {
    return (
      <span className="badge rounded-pill bg-success-subtle text-success px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
        <i className="bi bi-check-circle-fill"></i> Delivered
      </span>
    );
  }
  if (s.includes('cancel') || s.includes('refund')) {
    return (
      <span className="badge rounded-pill bg-danger-subtle text-danger px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
        <i className="bi bi-x-circle-fill"></i> Cancelled
      </span>
    );
  }
  if (s.includes('out')) {
    return (
      <span className="badge rounded-pill bg-info-subtle text-info-emphasis px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
        <i className="bi bi-bicycle"></i> Out for Delivery
      </span>
    );
  }
  if (s.includes('ship')) {
    return (
      <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
        <i className="bi bi-truck"></i> Shipped &bull; In Transit
      </span>
    );
  }
  if (s.includes('process')) {
    return (
      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
        <i className="bi bi-gear-wide-connected"></i> Processing
      </span>
    );
  }
  return (
    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
      <i className="bi bi-clock-history"></i> Order Placed
    </span>
  );
}

// Payment badge helper
function getPaymentBadge(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('paid')) {
    return <span className="badge bg-success-subtle text-success border border-success-subtle">Paid Online (Razorpay)</span>;
  }
  if (s.includes('cod')) {
    return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Cash on Delivery (Pending)</span>;
  }
  if (s.includes('cancel') || s.includes('refund')) {
    return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Refunded / Cancelled</span>;
  }
  return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">{status}</span>;
}

// Milestone tracker steps definition
const TRACKING_STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Received & verified by store', icon: 'bi-receipt-cutoff' },
  { key: 'processing', label: 'Processing & Packed', desc: 'Quality check passed & packaging complete', icon: 'bi-box-seam' },
  { key: 'shipped', label: 'Shipped & In Transit', desc: 'Dispatched with Burhani Express Cargo', icon: 'bi-truck' },
  { key: 'out', label: 'Out for Delivery', desc: 'Courier agent assigned for doorstep drop', icon: 'bi-geo-alt-fill' },
  { key: 'delivered', label: 'Delivered', desc: 'Handed over safely to customer', icon: 'bi-patch-check-fill' },
];

function getStepIndex(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('delivered')) return 4;
  if (s.includes('out')) return 3;
  if (s.includes('ship')) return 2;
  if (s.includes('process')) return 1;
  return 0;
}

function parseOrderAddress(raw) {
  if (!raw) return { contactName: '', contactPhone: '', addressText: 'Standard Delivery Address', shortCity: 'Standard Delivery' };
  let contactName = '';
  let contactPhone = '';
  let addressText = raw;

  const match = raw.match(/\[CONTACT:\s*([^|\]]+)(?:\|\s*([^\]]+))?\]\s*(.*)/i);
  if (match) {
    contactName = (match[1] || '').trim();
    contactPhone = (match[2] || '').trim();
    addressText = (match[3] || '').trim() || 'Standard Delivery Address';
  }

  // Generate short city / destination
  const segments = addressText.split(',').map((s) => s.trim()).filter(Boolean);
  const shortCity = segments.slice(0, 2).join(', ') || 'Standard Delivery';

  return { contactName, contactPhone, addressText, shortCity };
}

export default function YourOrdersPage({ setToasts }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, 30days, pending, active, delivered, cancelled
  const [sortBy, setSortBy] = useState('newest');
  const [copiedId, setCopiedId] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const d = await apiGet('/api/react/orders/');
      const list = d.orders || [];
      setOrders(list);
      if (list.length > 0) {
        setSelectedOrderId((prev) => (prev ? prev : list[0].id));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else if (user === false) {
      setLoading(false);
    }
  }, [user, fetchOrders]);

  // Copy Order ID with visual feedback
  const handleCopyOrderId = (id) => {
    navigator.clipboard?.writeText(String(id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    setToasts((t) => [...t, { tag: 'info', text: `Order ID #${id} copied to clipboard!` }]);
  };

  // Re-order / Buy Again action
  const handleBuyAgain = async (item) => {
    if (!item?.product?.id) return;
    try {
      const res = await apiPost(`/api/react/cart/add/${item.product.id}/`);
      if (res.status === 'success') {
        if (setCartCount && res.cart_count) setCartCount(res.cart_count);
        setToasts((t) => [
          ...t,
          { tag: 'success', text: `Re-added "${item.product.name}" to your cart!` },
        ]);
      } else {
        setToasts((t) => [...t, { tag: 'error', text: res.message || 'Unable to add to cart' }]);
      }
    } catch {
      setToasts((t) => [...t, { tag: 'error', text: 'Error adding product to cart.' }]);
    }
  };

  // Cancel order handler
  const handleConfirmCancel = async (orderId, reason) => {
    setIsCancelling(true);
    try {
      const res = await apiPost(`/api/react/orders/cancel/${orderId}/`, { reason });
      if (res.status === 'success') {
        setToasts((t) => [...t, { tag: 'success', text: res.message || 'Order cancelled successfully' }]);
        setShowCancelModal(false);
        await fetchOrders();
      } else {
        setToasts((t) => [...t, { tag: 'error', text: res.message || 'Could not cancel order.' }]);
      }
    } catch {
      setToasts((t) => [...t, { tag: 'error', text: 'Server error cancelling order.' }]);
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper to determine if an order was placed within last 30 days
  const isWithin30Days = (created_at_iso, created_at_str) => {
    if (!created_at_iso && !created_at_str) return true;
    const orderDate = created_at_iso ? new Date(created_at_iso) : new Date(created_at_str);
    if (isNaN(orderDate.getTime())) return true;
    const diffDays = Math.ceil(Math.abs(new Date() - orderDate) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Filter & Sort calculation
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 1. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((ord) => {
        const idMatch = String(ord.id).includes(q) || (ord.tracking_id || '').toLowerCase().includes(q);
        const addressMatch = (ord.address || '').toLowerCase().includes(q);
        const itemMatch = ord.items?.some((it) => (it.product?.name || '').toLowerCase().includes(q));
        return idMatch || addressMatch || itemMatch;
      });
    }

    // 2. Quick Filters (Highlighted: Last 30 days, Pending, Cancelled)
    if (activeFilter === '30days') {
      result = result.filter((ord) => isWithin30Days(ord.created_at_iso, ord.created_at));
    } else if (activeFilter === 'pending') {
      result = result.filter((ord) => {
        const delStatus = (ord.delivery_status || '').toLowerCase();
        const payStatus = (ord.payment_status || '').toLowerCase();
        return (
          delStatus === 'placed' ||
          delStatus === 'processing' ||
          payStatus.includes('pending')
        );
      });
    } else if (activeFilter === 'active') {
      result = result.filter((ord) => {
        const s = (ord.delivery_status || '').toLowerCase();
        return ['placed', 'processing', 'shipped', 'out for delivery'].includes(s);
      });
    } else if (activeFilter === 'delivered') {
      result = result.filter((ord) => (ord.delivery_status || '').toLowerCase().includes('delivered'));
    } else if (activeFilter === 'cancelled') {
      result = result.filter((ord) => {
        const del = (ord.delivery_status || '').toLowerCase();
        const pay = (ord.payment_status || '').toLowerCase();
        return del.includes('cancel') || pay.includes('cancel') || pay.includes('refund');
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'highest') return parseFloat(b.bill || 0) - parseFloat(a.bill || 0);
      if (sortBy === 'lowest') return parseFloat(a.bill || 0) - parseFloat(b.bill || 0);
      return 0;
    });

    return result;
  }, [orders, searchQuery, activeFilter, sortBy]);

  // Selected Order object
  const selectedOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    const match = orders.find((o) => o.id === selectedOrderId);
    return match || filteredOrders[0] || orders[0];
  }, [orders, selectedOrderId, filteredOrders]);

  const cancellableStatuses = ['placed', 'processing'];
  const isSelectedCancellable =
    selectedOrder && cancellableStatuses.includes((selectedOrder.delivery_status || '').toLowerCase());

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container orders-dashboard-canvas">
        {/* Top Header & Navigation */}
        <div className="orders-top-header d-flex justify-content-between align-items-center flex-wrap gap-2 pb-2 mb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 mb-0.5">
              <span className="badge bg-success text-white px-2 py-0.5 rounded-pill small fw-bold" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-person-check-fill me-1"></i> Customer Portal
              </span>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>&bull; Order Fulfillment Center</span>
            </div>
            <h3 className="orders-page-title m-0 fs-4">Orders &amp; Shipment Center</h3>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-success btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1"
              style={{ fontSize: '0.8rem' }}
              onClick={fetchOrders}
              title="Refresh order records"
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
            <Link
              to="/"
              className="btn btn-dark btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1"
              style={{ fontSize: '0.8rem' }}
            >
              <i className="bi bi-arrow-left"></i> Back to Store
            </Link>
          </div>
        </div>

        {/* Loading Spinner or Sign-in Prompt */}
        {!user && user !== null ? (
          <div className="text-center py-5">
            <div
              style={{
                maxWidth: '460px',
                margin: '0 auto',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: '32px',
                padding: '44px 28px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                border: '1px solid rgba(255,255,255,0.8)',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  color: '#16a34a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  marginBottom: '18px',
                }}
              >
                <i className="bi bi-person-lock"></i>
              </div>
              <h3 className="fw-bold text-dark mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sign In to View Orders
              </h3>
              <p className="text-muted small mb-4">
                Please sign in to access your live shipment tracking, order history, and GST tax invoices.
              </p>
              <div className="d-flex flex-column gap-2">
                <Link to="/login" className="btn btn-success rounded-pill px-4 py-2.5 fw-bold shadow-sm">
                  <i className="bi bi-box-arrow-in-right me-1"></i> Sign In to Account
                </Link>
                <Link to="/register" className="btn btn-outline-dark rounded-pill px-4 py-2 fw-semibold">
                  Create New Account
                </Link>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-3 text-muted fw-semibold">Loading your hardware orders and tracking routes...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty Orders State */
          <div className="text-center py-5">
            <div
              style={{
                maxWidth: '460px',
                margin: '0 auto',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: '32px',
                padding: '48px 28px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                border: '1px solid rgba(255,255,255,0.8)',
              }}
            >
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  marginBottom: '20px',
                }}
              >
                <i className="bi bi-box-seam"></i>
              </div>
              <h3 className="fw-bold text-dark mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                No Orders Placed Yet
              </h3>
              <p className="text-muted small mb-4">
                You haven't ordered any power tools, chainsaws, or machinery yet. Explore our hardware catalog and place your first order.
              </p>
              <Link to="/" className="btn btn-success rounded-pill px-5 py-2.5 fw-bold shadow-sm">
                <i className="bi bi-bag-plus me-1"></i> Shop Hardware Catalog
              </Link>
            </div>
          </div>
        ) : (
          /* ── Split-Screen Layout ── */
          <div className="orders-split-layout row g-4">
            {/* ════════ LEFT COLUMN: Filterable Orders List ════════ */}
            <div
              className={`col-lg-5 col-xl-4 orders-sidebar-column ${
                showMobileDetail ? 'd-none d-lg-block' : 'd-block'
              }`}
            >
              <div className="orders-sidebar-panel p-3.5 p-md-4 rounded-4">
                {/* Search Bar */}
                <div className="position-relative mb-3.5">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-pill ps-5 pe-4 py-2 border-0 shadow-sm"
                    style={{ background: '#ffffff', fontSize: '0.85rem' }}
                    placeholder="Search by Order ID, item, address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-decoration-none"
                      onClick={() => setSearchQuery('')}
                    >
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  )}
                </div>

                {/* Quick Filters Strip (Highlighted: Last 30 days, Pending, Cancelled) */}
                <div className="mb-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                      Quick Filters
                    </span>
                    <span className="badge bg-light text-muted border small">
                      {filteredOrders.length} of {orders.length}
                    </span>
                  </div>

                  <div className="quick-filter-pills-row d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm quick-filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('all')}
                    >
                      All
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm quick-filter-chip ${activeFilter === '30days' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('30days')}
                    >
                      <i className="bi bi-calendar-event me-1"></i> Last 30 Days
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm quick-filter-chip ${activeFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('pending')}
                    >
                      <i className="bi bi-hourglass-split me-1 text-warning"></i> Pending
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm quick-filter-chip ${activeFilter === 'active' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('active')}
                    >
                      <i className="bi bi-truck me-1 text-info"></i> In Transit
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm quick-filter-chip ${activeFilter === 'delivered' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('delivered')}
                    >
                      <i className="bi bi-check-circle me-1 text-success"></i> Delivered
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm quick-filter-chip ${activeFilter === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('cancelled')}
                    >
                      <i className="bi bi-x-circle me-1 text-danger"></i> Cancelled
                    </button>
                  </div>
                </div>

                {/* Sort Option Dropdown */}
                <div className="d-flex align-items-center justify-content-between mb-3.5 pt-3 border-top border-light-subtle">
                  <span className="small text-muted">Sort By:</span>
                  <select
                    className="form-select form-select-sm rounded-pill border-0 shadow-none text-muted fw-semibold"
                    style={{ width: 'auto', fontSize: '0.8rem', background: 'transparent' }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest Placed</option>
                    <option value="oldest">Oldest Placed</option>
                    <option value="highest">Price: High to Low</option>
                    <option value="lowest">Price: Low to High</option>
                  </select>
                </div>

                {/* Scrollable Order Cards List */}
                <div className="orders-cards-scroll-container d-flex flex-column gap-3" style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-4 px-2 bg-white rounded-4 shadow-sm border">
                      <i className="bi bi-funnel text-muted fs-3 mb-2 d-block"></i>
                      <div className="fw-bold text-dark small">No matching orders found</div>
                      <p className="text-muted small m-0 mb-3">Try clearing search or filters</p>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success rounded-pill px-3"
                        onClick={() => {
                          setSearchQuery('');
                          setActiveFilter('all');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isSelected = selectedOrder?.id === ord.id;
                      const itemsCount = ord.items?.reduce((acc, it) => acc + (it.product_quantity || 1), 0) || ord.items?.length || 1;
                      const firstItem = ord.items && ord.items.length > 0 ? ord.items[0] : null;
                      const isActiveShipment = ['placed', 'processing', 'shipped', 'out for delivery'].includes(
                        (ord.delivery_status || '').toLowerCase()
                      );

                      return (
                        <div
                          key={ord.id}
                          className={`order-list-card p-3.5 rounded-4 cursor-pointer transition-all ${
                            isSelected ? 'selected' : ''
                          }`}
                          onClick={() => {
                            setSelectedOrderId(ord.id);
                            setShowMobileDetail(true);
                          }}
                        >
                          {/* Card Header */}
                          <div className="d-flex justify-content-between align-items-center mb-2.5">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-dark order-card-id">#{ord.id}</span>
                              {isActiveShipment && (
                                <span className="pulse-dot-indicator" title="Active live tracking"></span>
                              )}
                            </div>
                            {getStatusBadge(ord.delivery_status || ord.payment_status)}
                          </div>

                          {/* Items Preview Strip */}
                          <div className="d-flex align-items-center gap-3 mb-3">
                            {ord.items && ord.items.length > 0 ? (
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                {ord.items.slice(0, 3).map((item, idx) => (
                                  <div key={item.id || idx} className="order-item-thumb-micro">
                                    <img
                                      src={getCleanProductImage(item.product?.image) || '/static/images/cat_hardware.jpg'}
                                      alt={item.product?.name || 'Item'}
                                    />
                                  </div>
                                ))}
                                {ord.items.length > 3 && (
                                  <span className="order-items-overflow-badge">
                                    +{ord.items.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="order-item-thumb-micro">
                                <i className="bi bi-box-seam text-muted"></i>
                              </div>
                            )}

                            <div className="ms-1 overflow-hidden">
                              <div className="text-truncate fw-semibold text-dark small" style={{ maxWidth: '170px' }}>
                                {firstItem?.product?.name || 'Hardware Equipment'}
                              </div>
                              <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                                {itemsCount} {itemsCount === 1 ? 'item' : 'items'} &bull; {ord.created_at || 'Recent'}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Destination & Price */}
                          <div className="d-flex justify-content-between align-items-center pt-2.5 border-top border-light-subtle">
                            <span className="text-muted small text-truncate" style={{ maxWidth: '160px', fontSize: '0.74rem' }}>
                              <i className="bi bi-geo-alt me-1 text-success"></i>
                              {parseOrderAddress(ord.address).shortCity}
                            </span>
                            <span className="fw-bold text-dark order-card-price">
                              ₹{ord.bill}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ════════ RIGHT COLUMN: Selected Order Detailed Inspector ════════ */}
            <div
              className={`col-lg-7 col-xl-8 orders-detail-column ${
                !showMobileDetail ? 'd-none d-lg-block' : 'd-block'
              }`}
            >
              {selectedOrder ? (
                <div className="order-detail-wrapper d-flex flex-column gap-4">
                  {/* Mobile Back Button (Screens < 992px) */}
                  <div className="d-lg-none mb-2">
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1.5"
                      onClick={() => setShowMobileDetail(false)}
                    >
                      <i className="bi bi-arrow-left"></i> Back to Orders List
                    </button>
                  </div>

                  {/* ── 1. Order Command Header Card ── */}
                  <div className="order-command-card p-4 rounded-4 bg-white shadow-sm border">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1.5">
                          <h3 className="m-0 fw-bold text-dark fs-5" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Order #{selectedOrder.id}
                          </h3>
                          <button
                            type="button"
                            className="btn btn-light btn-sm rounded-circle p-1.5"
                            onClick={() => handleCopyOrderId(selectedOrder.id)}
                            title="Copy Order ID"
                            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className={`bi ${copiedId ? 'bi-check-lg text-success' : 'bi-copy text-muted'}`}></i>
                          </button>
                        </div>
                        <div className="text-muted small d-flex align-items-center gap-2.5 flex-wrap" style={{ fontSize: '0.8rem' }}>
                          <span>
                            <i className="bi bi-calendar3 me-1 text-success"></i> Placed on {selectedOrder.created_at || 'Recent'}
                            {selectedOrder.created_at_time ? ` at ${selectedOrder.created_at_time}` : ''}
                          </span>
                          <span>&bull;</span>
                          <span>Tracking: <strong>#{selectedOrder.tracking_id || `BUR-${selectedOrder.id}-EXP`}</strong></span>
                        </div>
                      </div>

                      {/* Badges & Actions */}
                      <div className="d-flex flex-column align-items-sm-end gap-2.5">
                        <div className="d-flex align-items-center gap-2">
                          {getStatusBadge(selectedOrder.delivery_status || selectedOrder.payment_status)}
                          {getPaymentBadge(selectedOrder.payment_status)}
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5"
                            style={{ fontSize: '0.82rem' }}
                            onClick={() => setShowInvoiceModal(true)}
                          >
                            <i className="bi bi-receipt"></i> Tax Invoice
                          </button>

                          {isSelectedCancellable && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 fw-semibold"
                              style={{ fontSize: '0.82rem' }}
                              onClick={() => setShowCancelModal(true)}
                            >
                              Cancel Order
                            </button>
                          )}

                          <a
                            href={`https://wa.me/917742752753?text=${encodeURIComponent(
                              `Hello Burhani Hardware, I need support regarding Order #${selectedOrder.id}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5"
                            style={{ fontSize: '0.82rem' }}
                          >
                            <i className="bi bi-whatsapp"></i> Help
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* ── 2. Multi-Step Milestone Timeline ── */}
                  <div className="order-milestone-card p-4 rounded-4 bg-white shadow-sm border">
                    <div className="d-flex align-items-center justify-content-between mb-3.5">
                      <h6 className="fw-bold text-dark m-0">Fulfillment Journey</h6>
                      <span className="badge bg-light text-dark border small" style={{ fontSize: '0.74rem' }}>
                        Carrier: Burhani Express
                      </span>
                    </div>
                    <div className="milestone-stepper-container">
                      {(() => {
                        const currentStepIdx = getStepIndex(selectedOrder.delivery_status);
                        const isCancelled = (selectedOrder.delivery_status || '').toLowerCase().includes('cancel');
                        const progressPercent = isCancelled
                          ? 0
                          : Math.min(100, Math.max(0, (currentStepIdx / (TRACKING_STEPS.length - 1)) * 100));

                        return (
                          <>
                            <div className="milestone-track-line">
                              <div className="milestone-track-progress" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            {TRACKING_STEPS.map((step, idx) => {
                              const isCompleted = idx < currentStepIdx;
                              const isCurrent = idx === currentStepIdx;

                              return (
                                <div
                                  key={step.key}
                                  className={`milestone-step-item ${
                                    isCancelled ? 'step-cancelled' : isCompleted ? 'step-completed' : isCurrent ? 'step-current' : 'step-pending'
                                  }`}
                                >
                                  <div className="step-circle">
                                    {isCancelled ? (
                                      <i className="bi bi-x-lg text-danger"></i>
                                    ) : isCompleted ? (
                                      <i className="bi bi-check-lg text-white"></i>
                                    ) : (
                                      <i className={`bi ${step.icon}`}></i>
                                    )}
                                  </div>
                                  <div className="step-content">
                                    <div className="fw-bold step-title">{step.label}</div>
                                    <div className="text-muted small step-desc">{step.desc}</div>
                                    {isCurrent && !isCancelled && (
                                      <span className="badge bg-success text-white mt-1 px-2.5 py-0.5 rounded-pill" style={{ fontSize: '10px' }}>
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ── 3. Ordered Items Breakdown ── */}
                  <div className="order-items-card p-4 rounded-4 bg-white shadow-sm border">
                    <div className="d-flex justify-content-between align-items-center mb-3.5">
                      <h6 className="fw-bold text-dark m-0">Items in this Order</h6>
                      <span className="badge bg-light text-dark border small">
                        {selectedOrder.items?.length || 1} product{selectedOrder.items?.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="d-flex flex-column gap-3" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item) => (
                          <div
                            key={item.id}
                            className="order-product-row p-3.5 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-3.5"
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div className="order-product-image-box">
                                <img
                                  src={getCleanProductImage(item.product?.image) || '/static/images/cat_hardware.jpg'}
                                  alt={item.product?.name || 'Product'}
                                />
                              </div>
                              <div>
                                <h6 className="fw-bold text-dark m-0 mb-1 small">
                                  {item.product?.name || 'Hardware Tool / Machinery'}
                                </h6>
                                <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                                  Qty: <strong>{item.product_quantity}</strong> &times; ₹{item.product?.price}
                                </div>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                  <Link
                                    to={`/item/${item.product?.id}`}
                                    className="text-success small fw-semibold text-decoration-none"
                                    style={{ fontSize: '0.76rem' }}
                                  >
                                    View in Catalog &rarr;
                                  </Link>
                                </div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-3">
                              <div className="text-end">
                                <div className="text-muted small" style={{ fontSize: '10px' }}>Line Total</div>
                                <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>₹{item.product_total}</div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleBuyAgain(item)}
                                title="Re-add item to cart"
                              >
                                <i className="bi bi-cart-plus"></i> Buy Again
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-light rounded-3 text-muted small text-center">
                          Hardware items packaged for this order.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── 4. Delivery Address & Bill Summary Grid ── */}
                  <div className="row g-4">
                    {/* Delivery Address */}
                    <div className="col-md-6">
                      <div className="order-destination-card p-4 rounded-4 bg-white shadow-sm border h-100">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <i className="bi bi-geo-alt-fill text-success fs-6"></i>
                          <h6 className="fw-bold text-dark m-0 small">Shipping Destination</h6>
                        </div>
                        {(() => {
                          const { contactName, contactPhone, addressText } = parseOrderAddress(selectedOrder.address);
                          return (
                            <>
                              {contactName && (
                                <div className="d-flex align-items-center gap-1.5 small fw-semibold text-dark mb-1.5">
                                  <i className="bi bi-person-fill text-success"></i>
                                  <span>{contactName}</span>
                                  {contactPhone && <span className="text-muted fw-normal ms-1">({contactPhone})</span>}
                                </div>
                              )}
                              <p className="text-muted small mb-3.5" style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
                                {addressText}
                              </p>
                            </>
                          );
                        })()}
                        <div className="pt-3 border-top text-muted d-flex justify-content-between flex-wrap gap-1" style={{ fontSize: '0.76rem' }}>
                          <span>Carrier: <strong className="text-dark">Burhani Express Surface</strong></span>
                          <span>Speed: <strong className="text-success">2-4 Days Express</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Billing Breakdown */}
                    <div className="col-md-6">
                      <div className="order-billing-card p-4 rounded-4 bg-white shadow-sm border h-100">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <i className="bi bi-credit-card-2-front text-success fs-6"></i>
                          <h6 className="fw-bold text-dark m-0 small">Payment &amp; Billing</h6>
                        </div>

                        <div className="d-flex justify-content-between py-2 small border-bottom" style={{ fontSize: '0.8rem' }}>
                          <span className="text-muted">Items Subtotal:</span>
                          <span className="fw-semibold text-dark">₹{selectedOrder.bill}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 small border-bottom" style={{ fontSize: '0.8rem' }}>
                          <span className="text-muted">Freight &amp; Handling:</span>
                          <span className="text-success fw-bold">FREE</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 small border-bottom" style={{ fontSize: '0.8rem' }}>
                          <span className="text-muted">GST (18% Included):</span>
                          <span className="text-muted">Included</span>
                        </div>
                        <div className="d-flex justify-content-between py-2.5 fw-bold text-dark" style={{ fontSize: '1rem' }}>
                          <span>Total Amount:</span>
                          <span className="text-success">₹{selectedOrder.bill}</span>
                        </div>

                        <div className="mt-3 pt-2 text-muted small" style={{ fontSize: '11px' }}>
                          Status: <strong>{selectedOrder.payment_status}</strong> &bull; {selectedOrder.razorpay_payment_id ? `Ref: ${selectedOrder.razorpay_payment_id}` : 'Invoice Verified'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 bg-white rounded-4 border shadow-sm p-4">
                  <i className="bi bi-hand-index-thumb fs-2 text-muted mb-2 d-block"></i>
                  <h5>Select an order from the list</h5>
                  <p className="text-muted small">Choose any order on the left to view detailed tracking and items.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <OrderInvoiceModal
          order={selectedOrder}
          user={user}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <CancelOrderModal
          order={selectedOrder}
          isCancelling={isCancelling}
          onConfirm={handleConfirmCancel}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </div>
  );
}
