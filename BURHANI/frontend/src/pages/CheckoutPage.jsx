import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCleanProductImage } from '../utils/imageUrl';

export default function CheckoutPage({ setToasts }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Address Management State
  const [addressList, setAddressList] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Active form inputs (for new or editing address)
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressTag, setAddressTag] = useState('Workshop');

  // Delivery Notes & Payment State
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online'); // Default to online payment as requested
  const [placing, setPlacing] = useState(false);

  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  // Load Razorpay SDK dynamically
  useEffect(() => {
    if (!document.getElementById('razorpay-sdk-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Helper to parse address strings formatted as [CONTACT: Name | Phone] Address
  const parseAddressString = (rawString, idPrefix = 'addr') => {
    if (!rawString || typeof rawString !== 'string') return null;
    const match = rawString.match(/^\[CONTACT:\s*([^|]+)\s*\|\s*([0-9]{10})\]\s*(.+)$/i);
    if (match) {
      return {
        id: `${idPrefix}_${Math.random().toString(36).substr(2, 9)}`,
        name: match[1].trim(),
        phone: match[2].trim(),
        address: match[3].trim(),
        tag: 'Workshop',
      };
    }
    return {
      id: `${idPrefix}_${Math.random().toString(36).substr(2, 9)}`,
      name: user?.first_name || user?.username || '',
      phone: '',
      address: rawString.trim(),
      tag: 'Site Office',
    };
  };

  useEffect(() => {
    if (!user && user !== null) {
      navigate('/login');
      return;
    }
    if (!user) return;

    apiGet('/api/react/checkout/').then((d) => {
      if (d.status === 'error') {
        navigate('/cart');
        return;
      }
      setData(d);

      // Load saved addresses from localStorage + backend
      const storageKey = `burhani_addresses_${user.username || 'user'}`;
      let localSaved = [];
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) localSaved = JSON.parse(stored);
      } catch (e) {
        console.error('Error reading localStorage addresses', e);
      }

      // Combine backend saved_addresses + last_address + localSaved
      const combined = [];
      const seenAddresses = new Set();

      const addAddressIfUnique = (addrObj) => {
        if (!addrObj || !addrObj.address) return;
        const key = `${addrObj.name}_${addrObj.phone}_${addrObj.address}`.toLowerCase();
        if (!seenAddresses.has(key)) {
          seenAddresses.add(key);
          combined.push(addrObj);
        }
      };

      // 1. From d.last_address
      if (d.last_address) {
        const parsed = parseAddressString(d.last_address, 'last');
        if (parsed) addAddressIfUnique(parsed);
      }

      // 2. From d.saved_addresses (past order history)
      if (Array.isArray(d.saved_addresses)) {
        d.saved_addresses.forEach((raw, idx) => {
          const parsed = parseAddressString(raw, `past_${idx}`);
          if (parsed) addAddressIfUnique(parsed);
        });
      }

      // 3. From localStorage
      if (Array.isArray(localSaved)) {
        localSaved.forEach((local) => addAddressIfUnique(local));
      }

      setAddressList(combined);

      if (combined.length > 0) {
        const defaultAddr = combined[0];
        setSelectedAddressId(defaultAddr.id);
        setRecipientName(defaultAddr.name);
        setRecipientPhone(defaultAddr.phone);
        setAddress(defaultAddr.address);
        setIsAddingNewAddress(false);
      } else {
        // Pre-fill user name if known
        setRecipientName(user.first_name || user.username || '');
        setIsAddingNewAddress(true);
      }

      setLoading(false);
    });
  }, [user]);

  // Sync to localStorage
  const saveToLocalStorage = (list) => {
    if (!user) return;
    try {
      localStorage.setItem(`burhani_addresses_${user.username || 'user'}`, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  // Select an existing address
  const handleSelectAddress = (item) => {
    setSelectedAddressId(item.id);
    setRecipientName(item.name);
    setRecipientPhone(item.phone);
    setAddress(item.address);
    setIsAddingNewAddress(false);
  };

  // Save new address to multiple address list
  const handleSaveNewAddress = (e) => {
    if (e) e.preventDefault();
    if (!recipientName.trim()) {
      setToasts((t) => [...t, { tag: 'error', text: 'Please enter recipient name.' }]);
      return;
    }
    const cleanPhone = recipientPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setToasts((t) => [...t, { tag: 'error', text: 'Please enter a valid 10-digit mobile number.' }]);
      return;
    }
    if (!address.trim() || address.trim().length < 8) {
      setToasts((t) => [...t, { tag: 'error', text: 'Please enter complete delivery address with PIN code.' }]);
      return;
    }

    const newId = `addr_${Date.now()}`;
    const newAddrObj = {
      id: newId,
      name: recipientName.trim(),
      phone: cleanPhone,
      address: address.trim(),
      tag: addressTag || 'Workshop',
    };

    const updated = [newAddrObj, ...addressList];
    setAddressList(updated);
    setSelectedAddressId(newId);
    saveToLocalStorage(updated);
    setIsAddingNewAddress(false);
    setToasts((t) => [...t, { tag: 'success', text: `New address (${addressTag}) added and selected.` }]);
  };

  // Remove an address from list
  const handleDeleteAddress = (id, e) => {
    e.stopPropagation();
    const updated = addressList.filter((a) => a.id !== id);
    setAddressList(updated);
    saveToLocalStorage(updated);
    if (selectedAddressId === id) {
      if (updated.length > 0) {
        handleSelectAddress(updated[0]);
      } else {
        setIsAddingNewAddress(true);
        setSelectedAddressId(null);
        setRecipientName(user.first_name || user.username || '');
        setRecipientPhone('');
        setAddress('');
      }
    }
    setToasts((t) => [...t, { tag: 'info', text: 'Address removed.' }]);
  };

  const buildFullAddress = () => {
    let base = `[CONTACT: ${recipientName.trim()} | ${recipientPhone.trim()}] ${address.trim()}`;
    if (deliveryNote.trim()) {
      base += ` (Note: ${deliveryNote.trim()})`;
    }
    return base;
  };

  const validateInputs = () => {
    if (!recipientName.trim()) {
      setIsAddingNewAddress(true);
      setToasts((t) => [...t, { tag: 'error', text: 'Please provide recipient full name.' }]);
      return false;
    }
    const cleanPhone = recipientPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setIsAddingNewAddress(true);
      setToasts((t) => [...t, { tag: 'error', text: 'Please enter a valid 10-digit mobile number.' }]);
      return false;
    }
    if (!address.trim() || address.trim().length < 8) {
      setIsAddingNewAddress(true);
      setToasts((t) => [...t, { tag: 'error', text: 'Please enter a complete delivery address with PIN code.' }]);
      return false;
    }
    return true;
  };

  const handleCOD = async () => {
    if (!validateInputs()) return;
    const fullAddress = buildFullAddress();
    setPlacing(true);

    try {
      await apiPost('/api/react/save-address/', { address: fullAddress, order_id: data.order_id });

      const formData = new FormData();
      formData.append('address', fullAddress);
      formData.append('order_id', data.order_id);

      const res = await fetch('/api/react/place-order/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData,
      });

      const resData = await res.json();
      if (resData.status === 'success') {
        setCartCount(0);
        setToasts((t) => [...t, { tag: 'success', text: 'Order placed successfully! (Cash on Delivery)' }]);
        navigate('/your_orders');
      } else {
        setToasts((t) => [...t, { tag: 'error', text: resData.message || 'Failed to place order.' }]);
      }
    } catch (e) {
      console.error(e);
      setToasts((t) => [...t, { tag: 'error', text: 'An unexpected error occurred during checkout.' }]);
    } finally {
      setPlacing(false);
    }
  };

  const handleRazorpay = async () => {
    if (!validateInputs()) return;
    const fullAddress = buildFullAddress();
    setPlacing(true);

    try {
      await apiPost('/api/react/save-address/', { address: fullAddress, order_id: data.order_id });

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: 'INR',
        name: 'Burhani Hardware & Machinery',
        description: `Order #${data.order_id} Payment`,
        order_id: data.razorpay_order_id,
        handler: async function (response) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = '/api/react/payment-callback/';
          const fields = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            address: fullAddress,
            csrfmiddlewaretoken: getCookie('csrftoken'),
          };
          for (const [key, val] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = val;
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
        },
        modal: {
          ondismiss: function () {
            setPlacing(false);
          },
        },
        prefill: {
          name: recipientName.trim(),
          contact: recipientPhone.trim(),
        },
        theme: {
          color: '#059669', // Project Emerald Theme
        },
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please refresh and try again.');
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      setToasts((t) => [...t, { tag: 'error', text: e.message || 'Error initializing Razorpay.' }]);
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="scenic-app-wrapper">
        <div className="glass-canvas-container checkout-compact-container text-center py-4">
          <div className="spinner-border text-success" role="status" style={{ width: '2.4rem', height: '2.4rem' }}></div>
          <p className="mt-2 text-muted fw-medium small">Securing checkout session...</p>
        </div>
      </div>
    );
  }

  const detectedPin = address.match(/\b\d{6}\b/)?.[0];

  return (
    <div className="scenic-app-wrapper">
      <div className="glass-canvas-container checkout-compact-container">
        {/* Streamlined Compact Top Bar */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2 pb-1.5 border-bottom border-white-50">
          <div className="d-flex align-items-center gap-2">
            <h3 className="section-title m-0" style={{ fontSize: '1.35rem' }}>
              <i className="bi bi-shield-check text-success me-1.5"></i>Secure Checkout
            </h3>
            <span className="badge rounded-pill bg-light text-muted border px-2 py-0.5 d-none d-sm-inline-block" style={{ fontSize: '0.72rem' }}>
              Order #{data?.order_id}
            </span>
          </div>

          {/* Inline Step Breadcrumb */}
          <div className="d-flex align-items-center gap-2">
            <div className="d-none d-md-flex align-items-center gap-2 small text-muted" style={{ fontSize: '0.76rem' }}>
              <Link to="/cart" className="text-decoration-none text-success fw-medium">
                <i className="bi bi-check-circle-fill me-1"></i>Cart
              </Link>
              <span>&rsaquo;</span>
              <span className="fw-bold text-dark">Address &amp; Payment</span>
              <span>&rsaquo;</span>
              <span className="text-secondary">Confirmation</span>
            </div>

            <Link to="/cart" className="detail-back-btn text-decoration-none py-1 px-2.5" style={{ fontSize: '0.76rem' }}>
              <i className="bi bi-arrow-left"></i>
              <span>Back to Cart</span>
            </Link>
          </div>
        </div>

        <div className="row g-3 align-items-stretch">
          {/* Left Column: Combined Unified Single Panel for Multiple Addresses & Payment */}
          <div className="col-lg-7">
            <div className="checkout-single-panel h-100 d-flex flex-column justify-content-between">
              <div>
                {/* ── PART 1: DELIVERY ADDRESS MANAGEMENT ── */}
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <div className="d-flex align-items-center gap-1.5 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#ecfdf5',
                        color: '#059669',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                      }}
                    >
                      1
                    </span>
                    <span>Shipping Address</span>
                  </div>

                  {/* Toggle between Address List and Add New Form */}
                  {addressList.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-success p-0 text-decoration-none fw-semibold"
                      style={{ fontSize: '0.76rem' }}
                      onClick={() => {
                        if (!isAddingNewAddress) {
                          setRecipientName('');
                          setRecipientPhone('');
                          setAddress('');
                          setIsAddingNewAddress(true);
                        } else {
                          setIsAddingNewAddress(false);
                          if (selectedAddressId) {
                            const cur = addressList.find((a) => a.id === selectedAddressId);
                            if (cur) handleSelectAddress(cur);
                          }
                        }
                      }}
                    >
                      {isAddingNewAddress ? (
                        <>
                          <i className="bi bi-x-circle me-1"></i>Cancel &amp; Select Saved
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle me-1"></i>+ Add New Address
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Multiple Address Cards Selector (When not actively adding a new address) */}
                {!isAddingNewAddress && addressList.length > 0 && (
                  <div className="checkout-address-cards-grid">
                    {addressList.map((item, idx) => {
                      const isSelected = item.id === selectedAddressId;
                      return (
                        <div
                          key={item.id}
                          className={`checkout-address-card-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectAddress(item)}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span
                              className={`badge rounded-pill ${
                                isSelected ? 'bg-success text-white' : 'bg-light text-dark border'
                              }`}
                              style={{ fontSize: '0.65rem' }}
                            >
                              <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-geo-alt'} me-1`}></i>
                              {item.tag || (idx === 0 ? 'Primary' : 'Address')}
                            </span>

                            {addressList.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-muted p-0 border-0"
                                style={{ fontSize: '0.72rem' }}
                                onClick={(e) => handleDeleteAddress(item.id, e)}
                                title="Delete this address"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>

                          <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.82rem' }}>
                            {item.name} &bull; <span className="text-muted fw-normal">+91 {item.phone}</span>
                          </div>
                          <div className="text-muted text-truncate" style={{ fontSize: '0.74rem', lineHeight: '1.2' }}>
                            {item.address}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add New Address Form (or initial form if no saved addresses) */}
                {isAddingNewAddress && (
                  <div
                    className="p-2 mb-2 rounded-3"
                    style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1' }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <span className="fw-semibold text-dark small" style={{ fontSize: '0.8rem' }}>
                        Enter New Shipping Destination
                      </span>
                      {/* Address Tag Selector */}
                      <div className="d-flex gap-1">
                        {['Workshop', 'Site Office', 'Home', 'Warehouse'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={`address-tag-pill-btn ${addressTag === tag ? 'active' : ''}`}
                            onClick={() => setAddressTag(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="row g-2 mb-1.5">
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control checkout-input-modern py-1 px-2"
                          placeholder="Recipient Full Name"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          required
                          style={{ fontSize: '0.82rem' }}
                        />
                      </div>
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text py-0 px-1.5 text-muted small" style={{ fontSize: '0.74rem' }}>
                            +91
                          </span>
                          <input
                            type="tel"
                            className="form-control checkout-input-modern py-1 px-2 border-start-0"
                            placeholder="10-digit Mobile No."
                            maxLength={10}
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                            required
                            style={{ fontSize: '0.82rem' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-1.5">
                      <div className="d-flex justify-content-between align-items-center mb-0.5">
                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          Delivery Address &amp; 6-Digit PIN
                        </span>
                        {detectedPin && (
                          <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-1.5 py-0" style={{ fontSize: '0.66rem' }}>
                            <i className="bi bi-check2 me-0.5"></i>PIN: {detectedPin}
                          </span>
                        )}
                      </div>
                      <textarea
                        className="form-control checkout-input-modern py-1 px-2"
                        rows={2}
                        placeholder="Plot/Flat No., Building, Industrial Area, City, State, PIN Code"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        style={{ fontSize: '0.82rem' }}
                      ></textarea>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      {addressList.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-0.5 px-2.5 rounded-pill"
                          style={{ fontSize: '0.74rem' }}
                          onClick={() => setIsAddingNewAddress(false)}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-success py-0.5 px-3 rounded-pill fw-semibold"
                        style={{ fontSize: '0.74rem', background: '#059669', border: 'none' }}
                        onClick={handleSaveNewAddress}
                      >
                        Save &amp; Use Address
                      </button>
                    </div>
                  </div>
                )}

                {/* Subtle Divider */}
                <hr className="my-1.5 opacity-25" />

                {/* ── PART 2: PAYMENT METHOD (Default to Online) ── */}
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <div className="d-flex align-items-center gap-1.5 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#ecfdf5',
                        color: '#059669',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                      }}
                    >
                      2
                    </span>
                    <span>Payment Selection</span>
                  </div>
                  <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-1.5 py-0" style={{ fontSize: '0.68rem' }}>
                    Instant Verification
                  </span>
                </div>

                {/* 2-Column Side-by-Side Payment Grid */}
                <div className="checkout-payment-grid">
                  {/* Option 1: Pay Online via Razorpay (DEFAULT) */}
                  <div
                    className={`payment-selection-card compact ${paymentMethod === 'online' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                  >
                    <div className="payment-radio-circle">
                      <div className="payment-radio-inner"></div>
                    </div>

                    <div className="payment-icon-badge">
                      <i className="bi bi-lightning-charge-fill"></i>
                    </div>

                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.86rem' }}>
                          Pay Online
                        </span>
                        <span className="badge rounded-pill bg-success text-white px-1.5 py-0" style={{ fontSize: '0.62rem' }}>
                          Default
                        </span>
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
                        UPI, Cards &amp; NetBanking
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery */}
                  <div
                    className={`payment-selection-card compact ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="payment-radio-circle">
                      <div className="payment-radio-inner"></div>
                    </div>

                    <div className="payment-icon-badge">
                      <i className="bi bi-cash-coin"></i>
                    </div>

                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.86rem' }}>
                          Cash on Delivery
                        </span>
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
                        Pay cash or UPI upon arrival
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── PART 3: SPACE UTILIZATION BELOW PAYMENT ── */}
                {/* 1. Accepted Instant UPI & Card Strip */}
                <div className="payment-upi-strip">
                  <span className="text-muted fw-semibold" style={{ fontSize: '0.68rem' }}>
                    Accepted Channels:
                  </span>
                  <span className="payment-upi-badge">
                    <i className="bi bi-phone text-success"></i> GPay
                  </span>
                  <span className="payment-upi-badge">
                    <i className="bi bi-wallet2 text-primary"></i> PhonePe
                  </span>
                  <span className="payment-upi-badge">
                    <i className="bi bi-qr-code text-info"></i> Paytm / UPI
                  </span>
                  <span className="payment-upi-badge">
                    <i className="bi bi-credit-card-2-front text-dark"></i> Visa &bull; Mastercard &bull; RuPay
                  </span>
                  <span className="payment-upi-badge">
                    <i className="bi bi-bank text-secondary"></i> Net Banking
                  </span>
                </div>

                {/* 2. Optional Delivery Notes / Landmark Input */}
                <div className="checkout-delivery-note-wrapper">
                  <div className="d-flex align-items-center gap-1.5 mb-1 text-muted" style={{ fontSize: '0.74rem' }}>
                    <i className="bi bi-chat-left-dots text-success"></i>
                    <span className="fw-semibold text-dark">Delivery Instructions / Landmark</span>
                    <span>(Optional)</span>
                  </div>
                  <input
                    type="text"
                    className="form-control checkout-input-modern py-1 px-2"
                    placeholder="e.g. Call before arrival, Gate 2 industrial entrance, Workshop floor 1"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    style={{ fontSize: '0.8rem', background: '#ffffff' }}
                  />
                </div>
              </div>

              {/* 3. Express Dispatch & Carrier Tracking Banner */}
              <div className="checkout-dispatch-banner">
                <div className="d-flex align-items-center gap-1.5 text-success-emphasis">
                  <i className="bi bi-truck-front-fill fs-6 text-success"></i>
                  <span className="fw-semibold">Priority 24h Express Dispatch</span>
                  <span className="text-muted">&bull; Insured Doorstep Courier</span>
                </div>
                <div className="d-none d-sm-flex align-items-center gap-1 text-success fw-semibold">
                  <i className="bi bi-shield-check"></i>
                  <span>Zero Transit Damage Liability</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review Sidebar (Compact & Synchronized) */}
          <div className="col-lg-5">
            <div className="order-summary-glass-card h-100 d-flex flex-column justify-content-between" style={{ padding: '16px 18px' }}>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-1.5 pb-1 border-bottom">
                  <h4 className="fw-bold m-0" style={{ color: '#0f172a', fontSize: '0.96rem' }}>
                    <i className="bi bi-receipt me-1 text-success"></i>Order Review ({data.cart?.length})
                  </h4>
                  <Link to="/cart" className="text-success fw-semibold text-decoration-none" style={{ fontSize: '0.74rem' }}>
                    Edit Cart
                  </Link>
                </div>

                {/* Items List Preview (Compact 120px Scroll) */}
                <div
                  className="mb-2 d-flex flex-column gap-1"
                  style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '2px' }}
                >
                  {data.cart?.map((item) => (
                    <div key={item.id} className="checkout-item-preview-row">
                      <div className="checkout-item-preview-thumb">
                        <img
                          src={getCleanProductImage(item.product.image) || '/static/images/cat_hardware.jpg'}
                          alt={item.product.name}
                        />
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-bold text-truncate text-dark" style={{ fontSize: '0.82rem' }}>
                          {item.product.name}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Qty: {item.product_quantity} &times; ₹{item.product.price}
                        </div>
                      </div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>
                        ₹{item.product_total}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Calculation Rows (Compact) */}
                <div className="d-flex justify-content-between mb-1 small text-muted" style={{ fontSize: '0.78rem' }}>
                  <span>Items Subtotal</span>
                  <span className="fw-bold text-dark">₹{data.grand_total}</span>
                </div>

                <div className="d-flex justify-content-between mb-1 small text-muted" style={{ fontSize: '0.78rem' }}>
                  <span>Express Doorstep Delivery</span>
                  <span className="text-success fw-bold">FREE</span>
                </div>

                <div className="d-flex justify-content-between mb-1.5 small text-muted" style={{ fontSize: '0.78rem' }}>
                  <span>GST (18% inclusive)</span>
                  <span className="text-secondary fw-semibold">₹0 Extra</span>
                </div>

                <hr className="my-1.5 opacity-25" />

                {/* Grand Total */}
                <div className="d-flex justify-content-between align-items-baseline mb-2">
                  <div>
                    <span className="fw-bold text-dark d-block" style={{ fontSize: '0.88rem' }}>Total Payable</span>
                    <span className="text-muted" style={{ fontSize: '0.68rem' }}>All taxes included</span>
                  </div>
                  <div className="text-end">
                    <span className="fw-bolder text-success fs-5" style={{ letterSpacing: '-0.3px' }}>
                      ₹{data.grand_total}
                    </span>
                  </div>
                </div>

                {/* Destination Confirmation Pill */}
                <div
                  className="mb-2 py-1 px-2 rounded-2 d-flex align-items-center justify-content-between"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.72rem' }}
                >
                  <div className="text-truncate me-1">
                    <span className="text-muted">Ship to: </span>
                    <strong className="text-dark">{recipientName || 'Select address'}</strong>
                  </div>
                  <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-1.5 py-0">
                    {addressTag || 'Verified'}
                  </span>
                </div>
              </div>

              <div>
                {/* Place Order CTA Button */}
                <button
                  type="button"
                  className="btn-emerald-gradient py-2 px-3 w-100"
                  style={{ fontSize: '0.88rem' }}
                  onClick={paymentMethod === 'cod' ? handleCOD : handleRazorpay}
                  disabled={placing}
                >
                  {placing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>
                      <span>Processing Order...</span>
                    </>
                  ) : paymentMethod === 'online' ? (
                    <>
                      <span>Pay ₹{data.grand_total} via Razorpay</span>
                      <i className="bi bi-shield-lock ms-1.5"></i>
                    </>
                  ) : (
                    <>
                      <span>Place Order (Cash on Delivery)</span>
                      <i className="bi bi-check2-circle ms-1.5"></i>
                    </>
                  )}
                </button>

                {/* Compact 1-Row Trust Badges */}
                <div
                  className="mt-2 pt-1.5 border-top d-flex align-items-center justify-content-between text-muted"
                  style={{ fontSize: '0.7rem' }}
                >
                  <div className="d-flex align-items-center gap-1">
                    <i className="bi bi-patch-check-fill text-success"></i>
                    <span>100% Genuine</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <i className="bi bi-truck text-success"></i>
                    <span>Tracked Dispatch</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <i className="bi bi-receipt text-success"></i>
                    <span>GST Invoice</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCookie(name) {
  let v = null;
  if (document.cookie) {
    for (const c of document.cookie.split(';')) {
      const [k, val] = c.trim().split('=');
      if (k === name) {
        v = decodeURIComponent(val);
        break;
      }
    }
  }
  return v;
}
