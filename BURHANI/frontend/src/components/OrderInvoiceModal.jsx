import React from 'react';

export default function OrderInvoiceModal({ order, user, onClose }) {
  if (!order) return null;

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(order.id).padStart(5, '0')}`;
  const totalAmount = parseFloat(order.bill || 0);
  const taxableAmount = (totalAmount / 1.18).toFixed(2);
  const gstAmount = (totalAmount - taxableAmount).toFixed(2);
  const cgst = (gstAmount / 2).toFixed(2);
  const sgst = (gstAmount / 2).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="invoice-modal-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'rgba(10, 17, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1060,
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="invoice-modal-card bg-white text-dark shadow-2xl rounded-4 overflow-hidden position-relative"
        style={{
          maxWidth: '850px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-light border-bottom no-print">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success fw-bold px-3 py-1 rounded-pill">
              GST Tax Invoice
            </span>
            <span className="text-muted small">#{invoiceNumber}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-semibold"
              onClick={handlePrint}
            >
              <i className="bi bi-printer-fill me-1"></i> Print / Save PDF
            </button>
            <button
              type="button"
              className="btn btn-light btn-sm rounded-circle p-2"
              onClick={onClose}
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="invoice-printable-body p-4 p-md-5 overflow-auto flex-grow-1" id="printable-invoice">
          {/* Company Branding & Tax Header */}
          <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4 flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  style={{
                    background: '#ffc107',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0a110f',
                    fontSize: '18px',
                  }}
                >
                  <i className="bi bi-tools"></i>
                </div>
                <h3 className="m-0 fw-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#0d3829' }}>
                  BURHANI HARDWARE
                </h3>
              </div>
              <div className="text-muted small">
                <strong>Burhani Hardware &amp; Machinery</strong><br />
                Station Road, Near Bohra Masjid, Dahod - 389151, Gujarat, India<br />
                Phone: +91 7742752753 | Email: support@burhanihardware.com<br />
                <strong>GSTIN:</strong> 24AAACB4891F1Z8 | <strong>UDYAM:</strong> GJ-07-0012948
              </div>
            </div>

            <div className="text-end">
              <h4 className="fw-bold text-uppercase text-secondary m-0 letter-spacing-1">TAX INVOICE</h4>
              <div className="small text-muted mt-2">
                <div><strong>Invoice No:</strong> {invoiceNumber}</div>
                <div><strong>Order ID:</strong> #{order.id}</div>
                <div><strong>Date:</strong> {order.created_at || 'Recent'}</div>
                <div><strong>Payment:</strong> {order.payment_status} ({order.payment_status === 'Paid' ? 'Razorpay' : 'COD'})</div>
              </div>
            </div>
          </div>

          {/* Billed To / Shipped To Grid */}
          <div className="row g-3 mb-4 pb-3 border-bottom">
            <div className="col-sm-6">
              <div className="text-uppercase fw-bold text-muted small mb-1">Customer / Billed To:</div>
              <div className="fw-bold text-dark">{user?.first_name || user?.username || 'Customer'}</div>
              <div className="text-muted small">{user?.username ? `Contact: +91 ${user.username}` : ''}</div>
              <div className="text-muted small mt-1">{order.address || 'Standard Delivery Address'}</div>
            </div>
            <div className="col-sm-6 text-sm-end">
              <div className="text-uppercase fw-bold text-muted small mb-1">Shipment Method:</div>
              <div className="fw-bold text-dark">Burhani Express Surface Cargo</div>
              <div className="text-muted small">Tracking AWB: #{order.tracking_id || `BUR-${order.id}-EXP`}</div>
              <div className="badge bg-success-subtle text-success mt-1">Verified Delivery Dispatch</div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="table-responsive mb-4">
            <table className="table table-bordered align-middle">
              <thead className="table-light small text-uppercase">
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '45%' }}>Item Description &amp; Machinery</th>
                  <th className="text-center" style={{ width: '10%' }}>Qty</th>
                  <th className="text-end" style={{ width: '15%' }}>Unit Price</th>
                  <th className="text-end" style={{ width: '10%' }}>GST</th>
                  <th className="text-end" style={{ width: '15%' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="small">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong className="text-dark">{item.product?.name || 'Hardware Equipment'}</strong>
                        <div className="text-muted" style={{ fontSize: '11px' }}>HSN: 84672900 &bull; Industrial Grade</div>
                      </td>
                      <td className="text-center fw-semibold">{item.product_quantity}</td>
                      <td className="text-end">₹{item.product?.price}</td>
                      <td className="text-end text-muted">18%</td>
                      <td className="text-end fw-bold text-dark">₹{item.product_total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>1</td>
                    <td>
                      <strong className="text-dark">Burhani Machinery Equipment Pack</strong>
                      <div className="text-muted" style={{ fontSize: '11px' }}>HSN: 84672900 &bull; Hardware Order</div>
                    </td>
                    <td className="text-center fw-semibold">1</td>
                    <td className="text-end">₹{order.bill}</td>
                    <td className="text-end text-muted">18%</td>
                    <td className="text-end fw-bold text-dark">₹{order.bill}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown & Totals */}
          <div className="row g-3 justify-content-end mb-4">
            <div className="col-md-5">
              <div className="d-flex justify-content-between py-1 border-bottom small">
                <span className="text-muted">Taxable Subtotal:</span>
                <span className="fw-semibold">₹{taxableAmount}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom small">
                <span className="text-muted">Central GST (CGST 9%):</span>
                <span>₹{cgst}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom small">
                <span className="text-muted">State GST (SGST 9%):</span>
                <span>₹{sgst}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom small">
                <span className="text-muted">Shipping &amp; Freight:</span>
                <span className="text-success fw-bold">FREE</span>
              </div>
              <div className="d-flex justify-content-between py-2 fs-5 fw-bold text-dark">
                <span>Grand Total (INR):</span>
                <span style={{ color: '#0d3829' }}>₹{order.bill}</span>
              </div>
            </div>
          </div>

          {/* Authorized Signature & Terms */}
          <div className="d-flex justify-content-between align-items-end pt-4 border-top flex-wrap gap-3">
            <div className="small text-muted" style={{ maxWidth: '420px', fontSize: '11px' }}>
              <strong>Terms &amp; Warranty:</strong>
              <div>• All machinery items carry manufacturer warranty as applicable.</div>
              <div>• Goods once sold can be returned within 7 days in original packaging.</div>
              <div>• Computer generated invoice. Signature is digitally authenticated.</div>
            </div>

            <div className="text-center">
              <div
                style={{
                  borderBottom: '1px dashed #cbd5e1',
                  width: '180px',
                  paddingBottom: '8px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#16a34a' }}>
                  Burhani Machinery
                </div>
              </div>
              <div className="small fw-bold text-dark">Authorized Signatory</div>
              <div className="text-muted" style={{ fontSize: '10px' }}>Burhani Hardware Dahod</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
