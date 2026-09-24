import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function CheckoutPage({ setToasts }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && user !== null) { navigate('/login'); return; }
    if (!user) return;
    apiGet('/api/react/checkout/').then(d => {
      if (d.status === 'error') { navigate('/cart'); return; }
      setData(d);
      // Pre-fill from last address if available
      if (d.last_address) {
        const match = d.last_address.match(/^\[CONTACT:\s*([^|]+)\s*\|\s*([0-9]{10})\]\s*(.+)$/i);
        if (match) {
          setRecipientName(match[1].trim());
          setRecipientPhone(match[2].trim());
          setAddress(match[3].trim());
        }
      }
      setLoading(false);
    });
  }, [user]);

  const buildFullAddress = () => `[CONTACT: ${recipientName} | ${recipientPhone}] ${address}`;

  const handleCOD = async () => {
    const fullAddress = buildFullAddress();
    if (!recipientName || !recipientPhone || !address) {
      setToasts(t => [...t, { tag: 'error', text: 'Please fill in all address fields.' }]); return;
    }
    setPlacing(true);
    try {
      // Save address first
      await apiPost('/api/react/save-address/', { address: fullAddress, order_id: data.order_id });
      // Place COD order
      const formData = new FormData();
      formData.append('address', fullAddress);
      formData.append('order_id', data.order_id);
      const res = await fetch('/api/react/place-order/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
      });
      const resData = await res.json();
      if (resData.status === 'success') {
        setCartCount(0);
        setToasts(t => [...t, { tag: 'success', text: 'Order placed successfully! (Cash on Delivery)' }]);
        navigate('/your_orders');
      } else {
        setToasts(t => [...t, { tag: 'error', text: resData.message || 'Failed to place order.' }]);
      }
    } catch (e) {
      console.error(e);
      setToasts(t => [...t, { tag: 'error', text: 'An unexpected error occurred during checkout.' }]);
    } finally {
      setPlacing(false);
    }
  };

  const handleRazorpay = async () => {
    const fullAddress = buildFullAddress();
    if (!recipientName || !recipientPhone || !address) {
      setToasts(t => [...t, { tag: 'error', text: 'Please fill in all address fields.' }]); return;
    }
    setPlacing(true);
    try {
      // Save address
      await apiPost('/api/react/save-address/', { address: fullAddress, order_id: data.order_id });

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: 'INR',
        name: 'Burhani Hardware & Machinery',
        description: 'Order Payment',
        order_id: data.razorpay_order_id,
        handler: async function (response) {
          // Submit payment callback
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
            input.type = 'hidden'; input.name = key; input.value = val;
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
        },
        modal: {
          ondismiss: function () {
            setPlacing(false);
          }
        },
        prefill: { name: recipientName, contact: recipientPhone },
        theme: { color: '#e67e22' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      setToasts(t => [...t, { tag: 'error', text: 'An unexpected error occurred during Razorpay checkout.' }]);
      setPlacing(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-warning" role="status"></div></div>;

  return (
    <>
      {/* Load Razorpay SDK */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>

      <div className="container py-4">
        <h1 className="heading-font fs-3 mb-4">Secure Checkout</h1>
        <div className="row g-4">
          {/* Address Form */}
          <div className="col-lg-7">
            <div className="checkout-address-card">
              <h5 className="fw-bold mb-3"><i className="bi bi-geo-alt-fill text-warning me-2"></i>Delivery Address</h5>

              <div className="mb-3">
                <label className="form-label">Recipient Name</label>
                <input type="text" className="form-control" placeholder="Full name of recipient"
                  value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              </div>

              <div className="mb-3">
                <label className="form-label">Mobile Number (10 digits)</label>
                <div className="input-group">
                  <span className="input-group-text">+91</span>
                  <input type="tel" className="form-control" placeholder="10-digit mobile number"
                    maxLength={10} value={recipientPhone} onChange={e => setRecipientPhone(e.target.value.replace(/\D/, ''))} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Full Address (include PIN code)</label>
                <textarea className="form-control" rows={4}
                  placeholder="House/Flat No., Street, City, State, PIN Code"
                  value={address} onChange={e => setAddress(e.target.value)}></textarea>
                <small className="text-muted">Must include a 6-digit PIN code.</small>
              </div>

              <div className="mt-4">
                <h6 className="fw-bold mb-3">Payment Method</h6>
                <div className="d-flex flex-column gap-3">
                  <label className={`p-3 rounded-3 border d-flex align-items-center gap-3 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-success bg-success bg-opacity-10' : 'border-light-subtle'}`} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} style={{ width: '20px', height: '20px' }} />
                    <div>
                      <div className="fw-bold fs-6"><i className="bi bi-cash-stack text-success me-2"></i>Cash on Delivery</div>
                      <div className="small text-muted">Pay at the time of delivery</div>
                    </div>
                  </label>
                  
                  <label className={`p-3 rounded-3 border d-flex align-items-center gap-3 cursor-pointer transition ${paymentMethod === 'online' ? 'border-warning bg-warning bg-opacity-10' : 'border-light-subtle'}`} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} style={{ width: '20px', height: '20px' }} />
                    <div>
                      <div className="fw-bold fs-6"><i className="bi bi-credit-card-fill text-warning me-2"></i>Pay Online</div>
                      <div className="small text-muted">UPI, Cards, Wallets via Razorpay</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-5">
            <div className="checkout-address-card">
              <h5 className="fw-bold mb-3"><i className="bi bi-bag-check-fill text-warning me-2"></i>Order Summary</h5>
              {data.cart?.map(item => (
                <div key={item.id} className="d-flex align-items-center gap-3 py-2 border-bottom">
                  <img src={item.product.image || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=100'}
                    alt={item.product.name}
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div className="flex-grow-1">
                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{item.product.name}</div>
                    <div className="text-muted small">Qty: {item.product_quantity}</div>
                  </div>
                  <div className="fw-bold" style={{ color: 'var(--gg-accent)' }}>₹{item.product_total}</div>
                </div>
              ))}
              <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                <span className="fw-bold">Shipping</span>
                <span className="text-success fw-bold">FREE</span>
              </div>
              <div className="d-flex justify-content-between mt-2 align-items-center mb-4">
                <span className="fs-5 fw-bold">Total</span>
                <span className="fs-4 fw-bold" style={{ color: 'var(--gg-accent)' }}>₹{data.grand_total}</span>
              </div>
              
              <button 
                className="btn btn-warning w-100 py-3 fw-bold fs-5 shadow-sm text-dark d-flex justify-content-center align-items-center gap-2"
                onClick={paymentMethod === 'cod' ? handleCOD : handleRazorpay}
                disabled={placing}
                style={{ borderRadius: '12px' }}
              >
                {placing ? (
                  <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...</>
                ) : (
                  <>Confirm and Place Order <i className="bi bi-arrow-right"></i></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getCookie(name) {
  let v = null;
  if (document.cookie) {
    for (const c of document.cookie.split(';')) {
      const [k, val] = c.trim().split('=');
      if (k === name) { v = decodeURIComponent(val); break; }
    }
  }
  return v;
}
