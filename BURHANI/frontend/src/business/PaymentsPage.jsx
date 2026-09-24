import React, { useState, useEffect } from 'react';
import { fetchPayments, createPayment, fetchParties } from './businessApi';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [paymentType, setPaymentType] = useState('received'); // 'received' or 'paid'
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, partyRes] = await Promise.all([
        fetchPayments(),
        fetchParties(),
      ]);

      if (payRes.status === 'success') {
        setPayments(payRes.payments);
      }
      if (partyRes.status === 'success') {
        setParties(partyRes.parties);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setPartyId(parties[0]?.id || '');
    setPaymentType('received');
    setAmount('');
    setPaymentMode('cash');
    setPaymentDate(new Date().toISOString().slice(0, 16));
    setNote('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!partyId || !amount || parseFloat(amount) <= 0) {
      alert('Please select a party and enter a valid amount.');
      return;
    }

    try {
      setSaving(true);
      const res = await createPayment({
        party_id: parseInt(partyId),
        payment_type: paymentType,
        amount: parseFloat(amount),
        payment_mode: paymentMode,
        payment_date: paymentDate,
        note: note,
      });

      if (res.status === 'success') {
        setModalOpen(false);
        loadData();
      } else {
        alert(res.message || 'Error recording payment');
      }
    } catch (err) {
      alert(err.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const totalReceived = payments
    .filter((p) => p.payment_type === 'received')
    .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  const totalPaid = payments
    .filter((p) => p.payment_type === 'paid')
    .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold m-0" style={{ letterSpacing: '-0.3px', color: '#111418' }}>Payments &amp; Cashbook Ledger</h4>
          <p className="text-muted small m-0">Record collections from customers and disbursements to suppliers.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-dark fw-bold d-flex align-items-center gap-2 shadow-sm px-3 py-2" style={{ borderRadius: '12px', background: '#111418', border: 'none' }}>
          <i className="bi bi-plus-lg"></i> Record Payment Entry
        </button>
      </div>

      {/* Starline Metrics Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="starline-pastel-card mint h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="starline-card-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="d-flex flex-column">
                <span className="starline-metric-num" style={{ color: '#059669' }}>{formatCurrency(totalReceived)}</span>
                <span className="starline-metric-label">Total Collections Received (Inflow)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="starline-pastel-card lavender h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="starline-card-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <rect x="2" y="7" width="20" height="14" rx="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div className="d-flex flex-column">
                <span className="starline-metric-num">{formatCurrency(totalPaid)}</span>
                <span className="starline-metric-label">Total Payments Outward (Outflow)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th>Receipt #</th>
                <th>Date &amp; Time</th>
                <th>Party Name</th>
                <th>Type</th>
                <th>Payment Mode</th>
                <th>Note / Memo</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-bold">REC-{p.id}</td>
                    <td className="text-muted small">{p.payment_date}</td>
                    <td>
                      <div className="fw-semibold text-dark">{p.party_name}</div>
                      <span className="badge bg-light text-muted border text-capitalize" style={{ fontSize: '0.7rem' }}>{p.party_type}</span>
                    </td>
                    <td>
                      {p.payment_type === 'received' ? (
                        <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1">
                          <i className="bi bi-arrow-down-left me-1"></i> Payment Received
                        </span>
                      ) : (
                        <span className="badge bg-danger bg-opacity-10 text-danger fw-bold px-2 py-1">
                          <i className="bi bi-arrow-up-right me-1"></i> Payment Made
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary text-uppercase fw-semibold">
                        {p.payment_mode}
                      </span>
                    </td>
                    <td className="text-muted small">{p.note || '—'}</td>
                    <td className={`text-end fw-bold fs-6 ${p.payment_type === 'received' ? 'text-success' : 'text-danger'}`}>
                      {p.payment_type === 'received' ? '+' : '-'}{formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No payment records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Record Payment Modal ── */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <form onSubmit={handleSave}>
                <div className="modal-header border-bottom border-light-subtle">
                  <h5 className="modal-title fw-bold">Record Payment Entry</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Transaction Type</label>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentType('received')}
                        className={`btn flex-grow-1 fw-bold ${paymentType === 'received' ? 'btn-success text-white' : 'btn-light border'}`}>
                        <i className="bi bi-arrow-down-left me-1"></i> Received (Inflow)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('paid')}
                        className={`btn flex-grow-1 fw-bold ${paymentType === 'paid' ? 'btn-danger text-white' : 'btn-light border'}`}>
                        <i className="bi bi-arrow-up-right me-1"></i> Paid (Outflow)
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Party (Customer or Supplier) *</label>
                    <select
                      className="form-select"
                      required
                      value={partyId}
                      onChange={(e) => setPartyId(e.target.value)}>
                      <option value="">Select Party...</option>
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.party_type}) — Balance: ₹{p.balance}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Amount (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="form-control"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Payment Mode</label>
                      <select
                        className="form-select"
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI / QR Code</option>
                        <option value="bank">Bank Transfer / Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Reference / Remarks</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Cleared bill #104 via Google Pay"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-light-subtle">
                  <button type="button" className="btn btn-light" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-warning fw-bold px-4">
                    {saving ? 'Saving...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
