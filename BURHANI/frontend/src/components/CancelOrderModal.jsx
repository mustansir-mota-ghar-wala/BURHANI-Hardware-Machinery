import React, { useState } from 'react';

const CANCEL_REASONS = [
  'Ordered by mistake / wrong quantity',
  'Found lower price elsewhere',
  'Need to change shipping address',
  'Delivery timeline is too long',
  'Need to change payment method',
  'Other reason',
];

export default function CancelOrderModal({ order, onConfirm, onClose, isCancelling }) {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customNote, setCustomNote] = useState('');

  if (!order) return null;

  const isPaid = order.payment_status === 'Paid';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(order.id, selectedReason === 'Other reason' ? customNote || selectedReason : selectedReason);
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'rgba(10, 17, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1060,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCancelling) onClose();
      }}
    >
      <div
        className="bg-white rounded-4 shadow-2xl p-4 p-md-5 position-relative"
        style={{ maxWidth: '520px', width: '100%', border: '1px solid rgba(0,0,0,0.08)' }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="btn btn-light btn-sm rounded-circle position-absolute top-0 end-0 m-3"
          onClick={onClose}
          disabled={isCancelling}
          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="bi bi-x-lg"></i>
        </button>

        {/* Warning Icon & Heading */}
        <div className="text-center mb-4">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              marginBottom: '12px',
            }}
          >
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <h4 className="fw-bold text-dark m-0" style={{ fontFamily: "'Playfair Display', serif" }}>
            Cancel Order #{order.id}?
          </h4>
          <p className="text-muted small mt-1">
            Total Value: <strong className="text-dark">₹{order.bill}</strong> &bull; Status: {order.delivery_status}
          </p>
        </div>

        {/* Refund Policy Alert */}
        {isPaid ? (
          <div className="alert alert-info py-2 px-3 rounded-3 small mb-3 d-flex align-items-start gap-2">
            <i className="bi bi-info-circle-fill text-primary mt-1"></i>
            <div>
              <strong>Instant Refund:</strong> Because you paid online via Razorpay, a full refund of <strong>₹{order.bill}</strong> will be automatically credited to your original payment method.
            </div>
          </div>
        ) : (
          <div className="alert alert-warning py-2 px-3 rounded-3 small mb-3 d-flex align-items-start gap-2">
            <i className="bi bi-shield-exclamation text-warning mt-1"></i>
            <div>
              <strong>Cash on Delivery Order:</strong> This order will be cancelled immediately without any charge.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label className="form-label small fw-bold text-dark">Reason for cancellation</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isCancelling}
            >
              {CANCEL_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === 'Other reason' && (
            <div className="mb-3 text-start">
              <label className="form-label small fw-bold text-dark">Please specify details</label>
              <textarea
                className="form-control form-control-sm rounded-3"
                rows="2"
                placeholder="Tell us what went wrong..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                disabled={isCancelling}
              />
            </div>
          )}

          <div className="d-flex align-items-center justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-light rounded-pill px-4 fw-semibold"
              onClick={onClose}
              disabled={isCancelling}
            >
              Keep Order
            </button>
            <button
              type="submit"
              className="btn btn-danger rounded-pill px-4 fw-bold"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
