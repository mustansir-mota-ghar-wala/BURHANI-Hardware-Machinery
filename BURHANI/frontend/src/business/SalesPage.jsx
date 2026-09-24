import React, { useState, useEffect } from 'react';
import { fetchSales, createSale, fetchSaleDetail, deleteSale, fetchParties, fetchProducts, saveParty } from './businessApi';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Create Sale Modal
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 16));
  const [items, setItems] = useState([
    { product_id: '', quantity: 1, price_incl_gst: '', gst_percent: 18 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Party Modal
  const [quickPartyOpen, setQuickPartyOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');

  // View Invoice Modal
  const [viewInvoice, setViewInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesRes, partiesRes, prodRes] = await Promise.all([
        fetchSales(),
        fetchParties('customer'),
        fetchProducts(),
      ]);

      if (salesRes.status === 'success') {
        setSales(salesRes.sales);
        setTotalRevenue(salesRes.total_revenue);
        setTotalOutstanding(salesRes.total_outstanding);
      }
      if (partiesRes.status === 'success') {
        setCustomers(partiesRes.parties);
      }
      if (prodRes.status === 'success') {
        setProducts(prodRes.products);
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

  const openNewSale = () => {
    setCustomerId('');
    setPaidAmount('0');
    setPaymentMode('cash');
    setSaleDate(new Date().toISOString().slice(0, 16));
    setItems([
      { product_id: products[0]?.id || '', quantity: 1, price_incl_gst: products[0]?.price || '', gst_percent: products[0]?.gst_percent || 18 }
    ]);
    setSaleModalOpen(true);
  };

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p.id === parseInt(prodId));
    const updated = [...items];
    updated[index].product_id = prodId;
    if (prod) {
      updated[index].price_incl_gst = prod.price;
      updated[index].gst_percent = prod.gst_percent;
    }
    setItems(updated);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { product_id: products[0]?.id || '', quantity: 1, price_incl_gst: products[0]?.price || '', gst_percent: products[0]?.gst_percent || 18 }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return items.reduce((acc, it) => {
      const p = parseFloat(it.price_incl_gst) || 0;
      const q = parseInt(it.quantity) || 0;
      return acc + (p * q);
    }, 0);
  };

  const handleCreateSaleSubmit = async (e) => {
    e.preventDefault();
    if (items.some((it) => !it.product_id || it.quantity <= 0)) {
      alert('Please fill out all product items with valid quantities.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createSale({
        customer_id: customerId || null,
        paid_amount: paidAmount,
        payment_mode: paymentMode,
        sale_date: saleDate,
        items: items.map((it) => ({
          product_id: parseInt(it.product_id),
          quantity: parseInt(it.quantity),
          price_incl_gst: it.price_incl_gst,
        })),
      });

      if (res.status === 'success') {
        setSaleModalOpen(false);
        loadData();
      } else {
        alert(res.message || 'Error recording sale');
      }
    } catch (err) {
      alert(err.message || 'Error connecting to server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddParty = async (e) => {
    e.preventDefault();
    if (!newPartyName) return;
    try {
      const res = await saveParty({ name: newPartyName, phone: newPartyPhone, party_type: 'customer' });
      if (res.status === 'success') {
        const added = res.party;
        setCustomers([...customers, added]);
        setCustomerId(added.id);
        setQuickPartyOpen(false);
        setNewPartyName('');
        setNewPartyPhone('');
      } else {
        alert(res.message || 'Failed to add customer');
      }
    } catch (err) {
      alert(err.message || 'Error creating customer');
    }
  };

  const handleViewInvoice = async (id) => {
    try {
      setLoadingInvoice(true);
      const res = await fetchSaleDetail(id);
      if (res.status === 'success') {
        setViewInvoice(res.sale);
      }
    } catch (err) {
      alert('Failed to load invoice');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm(`Delete Sale #${id}? Stock counts will be automatically returned to inventory.`)) return;
    try {
      const res = await deleteSale(id);
      if (res.status === 'success') {
        setSales(sales.filter((s) => s.id !== id));
      } else {
        alert(res.message || 'Failed to delete');
      }
    } catch (err) {
      alert(err.message || 'Error deleting sale');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold m-0">Sales &amp; Tax Invoices</h4>
          <p className="text-muted small m-0">Create GST-compliant customer bills and track payments.</p>
        </div>
        <button onClick={openNewSale} className="btn btn-warning fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ borderRadius: '10px' }}>
          <i className="bi bi-receipt-cutoff"></i> Create New Sale (POS)
        </button>
      </div>

      {/* Metrics */}
      <div className="row g-3">
        <div className="col-sm-6">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <span className="text-muted small fw-semibold">Total Sales Revenue</span>
            <h3 className="fw-bold text-success m-0">{formatCurrency(totalRevenue)}</h3>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <span className="text-muted small fw-semibold">Outstanding Customer Receivables</span>
            <h3 className="fw-bold text-danger m-0">{formatCurrency(totalOutstanding)}</h3>
          </div>
        </div>
      </div>

      {/* Sales List Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-center">Items</th>
                <th>Payment Mode</th>
                <th>Total Bill</th>
                <th>Paid</th>
                <th>Balance</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-bold">
                      <button onClick={() => handleViewInvoice(s.id)} className="btn btn-link text-decoration-none fw-bold p-0 text-dark">
                        #{s.id}
                      </button>
                    </td>
                    <td className="text-muted small">{s.sale_date}</td>
                    <td>
                      <div className="fw-semibold text-dark">{s.customer_name}</div>
                      {s.customer_phone && <small className="text-muted">{s.customer_phone}</small>}
                    </td>
                    <td className="text-center"><span className="badge bg-light text-dark border">{s.items_count} items</span></td>
                    <td><span className="badge bg-secondary bg-opacity-10 text-secondary text-uppercase">{s.payment_mode}</span></td>
                    <td className="fw-bold text-dark">{formatCurrency(s.total_amount)}</td>
                    <td className="text-success fw-semibold">{formatCurrency(s.paid_amount)}</td>
                    <td>
                      {s.balance_amount > 0 ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger fw-bold">{formatCurrency(s.balance_amount)}</span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success fw-bold">Fully Paid</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button onClick={() => handleViewInvoice(s.id)} className="btn btn-light border" title="View & Print Invoice">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button onClick={() => handleDeleteSale(s.id)} className="btn btn-light border text-danger" title="Delete Sale">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    No sales invoices recorded yet. Click "Create New Sale" to bill your first customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create New Sale Modal (POS) ── */}
      {saleModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <form onSubmit={handleCreateSaleSubmit}>
                <div className="modal-header border-bottom border-light-subtle">
                  <h5 className="modal-title fw-bold">Create Sale Invoice</h5>
                  <button type="button" className="btn-close" onClick={() => setSaleModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-5">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label fw-semibold small m-0">Customer</label>
                        <button type="button" onClick={() => setQuickPartyOpen(true)} className="btn btn-link text-warning p-0 small fw-bold text-decoration-none">
                          + Add New Customer
                        </button>
                      </div>
                      <select
                        className="form-select"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}>
                        <option value="">Walk-in Customer (Cash / Counter)</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label fw-semibold small">Invoice Date &amp; Time</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label fw-semibold small">Payment Mode</label>
                      <select
                        className="form-select"
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI / QR Code</option>
                        <option value="bank">Bank Transfer / NEFT</option>
                      </select>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <h6 className="fw-bold mb-2">Invoice Line Items</h6>
                  <div className="table-responsive mb-3 border rounded-3 p-2 bg-light">
                    <table className="table table-borderless align-middle mb-0">
                      <thead>
                        <tr className="text-muted small">
                          <th style={{ width: '45%' }}>Product</th>
                          <th style={{ width: '15%' }}>Qty</th>
                          <th style={{ width: '20%' }}>Price (Incl. GST)</th>
                          <th style={{ width: '15%' }}>Line Total</th>
                          <th style={{ width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => {
                          const lineTot = (parseFloat(it.price_incl_gst) || 0) * (parseInt(it.quantity) || 0);
                          return (
                            <tr key={idx}>
                              <td>
                                <select
                                  className="form-select"
                                  required
                                  value={it.product_id}
                                  onChange={(e) => handleProductSelect(idx, e.target.value)}>
                                  <option value="">Select Product...</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_qty}) - ₹{p.price}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  className="form-control"
                                  value={it.quantity}
                                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  className="form-control"
                                  value={it.price_incl_gst}
                                  onChange={(e) => updateItem(idx, 'price_incl_gst', e.target.value)}
                                />
                              </td>
                              <td className="fw-bold">{formatCurrency(lineTot)}</td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => removeItemRow(idx)}
                                  className="btn btn-outline-danger btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                  style={{ width: '28px', height: '28px' }}
                                  disabled={items.length === 1}>
                                  <i className="bi bi-x"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button type="button" onClick={addItemRow} className="btn btn-outline-dark btn-sm fw-semibold mb-4">
                    <i className="bi bi-plus-lg me-1"></i> Add Another Item
                  </button>

                  {/* Summary & Payment Settlement */}
                  <div className="card bg-light border-0 p-3" style={{ borderRadius: '12px' }}>
                    <div className="row align-items-center">
                      <div className="col-12 col-md-4">
                        <span className="text-muted small fw-semibold">Grand Bill Total</span>
                        <h3 className="fw-bold text-dark m-0">{formatCurrency(calculateGrandTotal())}</h3>
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label fw-semibold small">Paid Amount (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <span className="text-muted small fw-semibold">Balance Due (Credit)</span>
                        <h4 className="fw-bold text-danger m-0">
                          {formatCurrency(Math.max(calculateGrandTotal() - (parseFloat(paidAmount) || 0), 0))}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top border-light-subtle">
                  <button type="button" className="btn btn-light" onClick={() => setSaleModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-warning fw-bold px-4">
                    {submitting ? 'Creating Invoice...' : 'Generate Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Add Customer Modal ── */}
      {quickPartyOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1065 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <form onSubmit={handleQuickAddParty}>
                <div className="modal-header border-bottom border-light-subtle">
                  <h6 className="modal-title fw-bold">Quick Add Customer</h6>
                  <button type="button" className="btn-close" onClick={() => setQuickPartyOpen(false)}></button>
                </div>
                <div className="modal-body p-3">
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPartyPhone}
                      onChange={(e) => setNewPartyPhone(e.target.value)}
                      placeholder="10 digit number"
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-light-subtle">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setQuickPartyOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning btn-sm fw-bold px-3">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable Invoice View Modal ── */}
      {viewInvoice && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom border-light-subtle d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold">Tax Invoice #{viewInvoice.id}</h5>
                <div className="d-flex gap-2">
                  <button onClick={() => window.print()} className="btn btn-sm btn-dark d-flex align-items-center gap-1">
                    <i className="bi bi-printer"></i> Print
                  </button>
                  <button type="button" className="btn-close" onClick={() => setViewInvoice(null)}></button>
                </div>
              </div>
              <div className="modal-body p-4" id="printableInvoice">
                {/* Invoice Header */}
                <div className="d-flex justify-content-between border-bottom pb-3 mb-3">
                  <div>
                    <h4 className="fw-bolder text-dark mb-0">BURHANI HARDWARE &amp; MACHINERY</h4>
                    <p className="text-muted small mb-1">Station Road, Bhawani Mandi, Jhalawar, Rajasthan</p>
                    <p className="text-muted small mb-0">Phone: +91 77427 52753 | GSTIN: Verified Business</p>
                  </div>
                  <div className="text-end">
                    <div className="badge bg-warning text-dark px-3 py-2 fs-6 fw-bold">TAX INVOICE</div>
                    <div className="text-muted small mt-2">Invoice #: <strong>#{viewInvoice.id}</strong></div>
                    <div className="text-muted small">Date: {viewInvoice.sale_date}</div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="row mb-3">
                  <div className="col-6">
                    <span className="text-muted small fw-bold text-uppercase">Billed To:</span>
                    <h6 className="fw-bold mt-1 mb-0">{viewInvoice.customer?.name || 'Walk-in Customer'}</h6>
                    {viewInvoice.customer?.phone && <div className="small text-muted">{viewInvoice.customer.phone}</div>}
                    {viewInvoice.customer?.address && <div className="small text-muted">{viewInvoice.customer.address}</div>}
                    {viewInvoice.customer?.gstin && <div className="small text-muted font-monospace">GSTIN: {viewInvoice.customer.gstin}</div>}
                  </div>
                  <div className="col-6 text-end">
                    <span className="text-muted small fw-bold text-uppercase">Payment Info:</span>
                    <div className="mt-1 small">Mode: <strong className="text-uppercase">{viewInvoice.payment_mode}</strong></div>
                    <div className="small">Billed By: {viewInvoice.created_by}</div>
                  </div>
                </div>

                {/* Line Items */}
                <table className="table table-bordered table-sm align-middle mb-3" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Item Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Rate (Incl. GST)</th>
                      <th className="text-end">Taxable Val</th>
                      <th className="text-end">CGST</th>
                      <th className="text-end">SGST</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewInvoice.items.map((it, idx) => (
                      <tr key={it.id}>
                        <td>{idx + 1}</td>
                        <td className="fw-semibold">{it.product_name}</td>
                        <td className="text-center">{it.quantity}</td>
                        <td className="text-end">{formatCurrency(it.price_incl_gst)}</td>
                        <td className="text-end">{formatCurrency(it.taxable_value)}</td>
                        <td className="text-end">{formatCurrency(it.cgst_amount)}</td>
                        <td className="text-end">{formatCurrency(it.sgst_amount)}</td>
                        <td className="text-end fw-bold">{formatCurrency(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-light fw-bold">
                      <td colSpan="7" className="text-end">Total Amount:</td>
                      <td className="text-end">{formatCurrency(viewInvoice.total_amount)}</td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="text-end text-success">Paid Amount:</td>
                      <td className="text-end text-success">{formatCurrency(viewInvoice.paid_amount)}</td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="text-end text-danger fw-bold">Balance Due:</td>
                      <td className="text-end text-danger fw-bold">{formatCurrency(viewInvoice.balance_amount)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="text-center text-muted small mt-4 pt-2 border-top">
                  Thank you for your business! Goods once sold cannot be returned without original receipt.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
