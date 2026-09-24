import React, { useState, useEffect } from 'react';
import { fetchPurchases, createPurchase, fetchPurchaseDetail, deletePurchase, fetchParties, fetchProducts, fetchCategories } from './businessApi';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalPayables, setTotalPayables] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modal State
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 16));
  const [paymentMode, setPaymentMode] = useState('bank');
  const [paidAmount, setPaidAmount] = useState('0');
  const [items, setItems] = useState([
    { product_id: '', new_product_name: '', category_id: '', new_gst_percent: 18, quantity: 1, price_incl_gst: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [viewPurchase, setViewPurchase] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [purRes, partRes, prodRes, catRes] = await Promise.all([
        fetchPurchases(),
        fetchParties('supplier'),
        fetchProducts(),
        fetchCategories(),
      ]);

      if (purRes.status === 'success') {
        setPurchases(purRes.purchases);
        setTotalPurchases(purRes.total_purchases);
        setTotalPayables(purRes.total_payables);
      }
      if (partRes.status === 'success') {
        setSuppliers(partRes.parties);
      }
      if (prodRes.status === 'success') {
        setProducts(prodRes.products);
      }
      if (catRes.status === 'success') {
        setCategories(catRes.categories);
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

  const openNewPurchase = () => {
    setSupplierId('');
    setNewSupplierName('');
    setInvoiceNo('');
    setPurchaseDate(new Date().toISOString().slice(0, 16));
    setPaymentMode('bank');
    setPaidAmount('0');
    setItems([
      { product_id: products[0]?.id || '', new_product_name: '', category_id: categories[0]?.id || '', new_gst_percent: 18, quantity: 1, price_incl_gst: products[0]?.purchase_price || '' }
    ]);
    setPurchaseModalOpen(true);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'product_id' && value) {
      const p = products.find((pr) => pr.id === parseInt(value));
      if (p) {
        updated[index].price_incl_gst = p.purchase_price;
        updated[index].new_gst_percent = p.gst_percent;
      }
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { product_id: products[0]?.id || '', new_product_name: '', category_id: categories[0]?.id || '', new_gst_percent: 18, quantity: 1, price_incl_gst: '' }
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

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!supplierId && !newSupplierName) {
      alert('Please select an existing supplier or enter a new supplier name.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createPurchase({
        supplier_id: supplierId || null,
        new_supplier_name: newSupplierName || null,
        invoice_no: invoiceNo,
        purchase_date: purchaseDate,
        payment_mode: paymentMode,
        paid_amount: paidAmount,
        items: items.map((it) => ({
          product_id: it.product_id ? parseInt(it.product_id) : null,
          new_product_name: it.new_product_name || null,
          category_id: it.category_id ? parseInt(it.category_id) : null,
          new_gst_percent: it.new_gst_percent,
          quantity: parseInt(it.quantity),
          price_incl_gst: it.price_incl_gst,
        })),
      });

      if (res.status === 'success') {
        setPurchaseModalOpen(false);
        loadData();
      } else {
        alert(res.message || 'Error recording purchase');
      }
    } catch (err) {
      alert(err.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPurchase = async (id) => {
    try {
      const res = await fetchPurchaseDetail(id);
      if (res.status === 'success') {
        setViewPurchase(res.purchase);
      }
    } catch (err) {
      alert('Failed to load purchase details');
    }
  };

  const handleDeletePurchase = async (id) => {
    if (!window.confirm(`Delete Purchase #${id}? Stock counts will be deducted and supplier balances adjusted.`)) return;
    try {
      const res = await deletePurchase(id);
      if (res.status === 'success') {
        setPurchases(purchases.filter((p) => p.id !== id));
      } else {
        alert(res.message || 'Failed to delete');
      }
    } catch (err) {
      alert(err.message || 'Error deleting purchase');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Action Row */}
      <div className="d-flex align-items-center justify-content-end mb-1">
        <button onClick={openNewPurchase} className="btn btn-dark fw-bold d-flex align-items-center gap-2 shadow-sm px-3 py-2" style={{ borderRadius: '12px', background: '#111418', border: 'none' }}>
          <i className="bi bi-truck"></i> Record Inward Purchase
        </button>
      </div>

      {/* Starline Metrics Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="starline-pastel-card lavender h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="starline-card-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <div className="d-flex flex-column">
                <span className="starline-metric-num">{formatCurrency(totalPurchases)}</span>
                <span className="starline-metric-label">Total Purchases Inward</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="starline-pastel-card peach h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="starline-card-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div className="d-flex flex-column">
                <span className="starline-metric-num" style={{ color: '#D97706' }}>{formatCurrency(totalPayables)}</span>
                <span className="starline-metric-label">Pending Supplier Payables</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase List Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th>PO #</th>
                <th>Supplier Invoice</th>
                <th>Date</th>
                <th>Supplier</th>
                <th className="text-center">Items</th>
                <th>Mode</th>
                <th>Total Value</th>
                <th>Paid</th>
                <th>Payable Due</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                  </td>
                </tr>
              ) : purchases.length > 0 ? (
                purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-bold">
                      <button onClick={() => handleViewPurchase(p.id)} className="btn btn-link text-decoration-none fw-bold p-0 text-dark">
                        #{p.id}
                      </button>
                    </td>
                    <td>{p.invoice_no ? <span className="font-monospace fw-semibold">{p.invoice_no}</span> : <span className="text-muted">—</span>}</td>
                    <td className="text-muted small">{p.purchase_date}</td>
                    <td>
                      <div className="fw-semibold text-dark">{p.supplier_name}</div>
                      {p.supplier_phone && <small className="text-muted">{p.supplier_phone}</small>}
                    </td>
                    <td className="text-center"><span className="badge bg-light text-dark border">{p.items_count} items</span></td>
                    <td><span className="badge bg-secondary bg-opacity-10 text-secondary text-uppercase">{p.payment_mode}</span></td>
                    <td className="fw-bold text-dark">{formatCurrency(p.total_amount)}</td>
                    <td className="text-success fw-semibold">{formatCurrency(p.paid_amount)}</td>
                    <td>
                      {p.balance_amount > 0 ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger fw-bold">{formatCurrency(p.balance_amount)}</span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success fw-bold">Settled</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button onClick={() => handleViewPurchase(p.id)} className="btn btn-light border" title="View Details">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button onClick={() => handleDeletePurchase(p.id)} className="btn btn-light border text-danger" title="Delete & Adjust Stock">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    No inward purchases recorded yet. Click "Record Inward Purchase" to add supplier stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Record Inward Purchase Modal ── */}
      {purchaseModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <form onSubmit={handleCreatePurchase}>
                <div className="modal-header border-bottom border-light-subtle">
                  <h5 className="modal-title fw-bold">Record Inward Stock / Purchase</h5>
                  <button type="button" className="btn-close" onClick={() => setPurchaseModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Existing Supplier</label>
                      <select
                        className="form-select"
                        value={supplierId}
                        onChange={(e) => {
                          setSupplierId(e.target.value);
                          if (e.target.value) setNewSupplierName('');
                        }}>
                        <option value="">Select Existing Supplier...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">OR New Supplier Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Bosch India Ltd"
                        value={newSupplierName}
                        onChange={(e) => {
                          setNewSupplierName(e.target.value);
                          if (e.target.value) setSupplierId('');
                        }}
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label fw-semibold small">Supplier Bill / Invoice #</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. INV-2026-908"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label fw-semibold small">Purchase Date</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label fw-semibold small">Payment Mode</label>
                      <select
                        className="form-select"
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}>
                        <option value="bank">Bank Transfer / NEFT</option>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label fw-semibold small">Amount Paid Immediately (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <h6 className="fw-bold mb-2">Purchased Inventory Items</h6>
                  <div className="table-responsive mb-3 border rounded-3 p-2 bg-light">
                    <table className="table table-borderless align-middle mb-0">
                      <thead>
                        <tr className="text-muted small">
                          <th style={{ width: '40%' }}>Product Selection</th>
                          <th style={{ width: '15%' }}>Qty</th>
                          <th style={{ width: '20%' }}>Unit Cost (Incl. GST)</th>
                          <th style={{ width: '20%' }}>Line Total</th>
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
                                  className="form-select mb-1"
                                  value={it.product_id}
                                  onChange={(e) => updateItem(idx, 'product_id', e.target.value)}>
                                  <option value="">Choose Catalog Product...</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} (Cur. Cost: ₹{p.avg_cost})</option>
                                  ))}
                                </select>
                                {!it.product_id && (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Or type brand new product name..."
                                    value={it.new_product_name}
                                    onChange={(e) => updateItem(idx, 'new_product_name', e.target.value)}
                                  />
                                )}
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
                                  placeholder="0.00"
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

                  <div className="card bg-light border-0 p-3" style={{ borderRadius: '12px' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-semibold">Grand Bill Total</span>
                        <h3 className="fw-bold text-dark m-0">{formatCurrency(calculateGrandTotal())}</h3>
                      </div>
                      <div className="text-end">
                        <span className="text-muted small fw-semibold">Supplier Balance Due</span>
                        <h4 className="fw-bold text-danger m-0">
                          {formatCurrency(Math.max(calculateGrandTotal() - (parseFloat(paidAmount) || 0), 0))}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top border-light-subtle">
                  <button type="button" className="btn btn-light" onClick={() => setPurchaseModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-dark fw-bold px-4">
                    {submitting ? 'Recording Inward...' : 'Confirm Stock Inward'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── View Purchase Details Modal ── */}
      {viewPurchase && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom border-light-subtle">
                <h5 className="modal-title fw-bold">Inward Purchase Record #{viewPurchase.id}</h5>
                <button type="button" className="btn-close" onClick={() => setViewPurchase(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between border-bottom pb-3 mb-3">
                  <div>
                    <h6 className="fw-bold m-0">{viewPurchase.supplier?.name || 'General Supplier'}</h6>
                    {viewPurchase.supplier?.phone && <div className="small text-muted">{viewPurchase.supplier.phone}</div>}
                    {viewPurchase.supplier?.gstin && <div className="small text-muted font-monospace">GSTIN: {viewPurchase.supplier.gstin}</div>}
                  </div>
                  <div className="text-end">
                    <div className="small text-muted">Invoice #: <strong>{viewPurchase.invoice_no || 'N/A'}</strong></div>
                    <div className="small text-muted">Date: {viewPurchase.purchase_date}</div>
                    <div className="small text-muted">Recorded By: {viewPurchase.created_by}</div>
                  </div>
                </div>

                <table className="table table-bordered table-sm align-middle mb-3" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th className="text-center">Qty Inward</th>
                      <th className="text-end">Unit Cost</th>
                      <th className="text-end">Taxable Val</th>
                      <th className="text-end">Input CGST</th>
                      <th className="text-end">Input SGST</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewPurchase.items.map((it, idx) => (
                      <tr key={it.id}>
                        <td>{idx + 1}</td>
                        <td className="fw-semibold">{it.product_name}</td>
                        <td className="text-center fw-bold">{it.quantity}</td>
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
                      <td colSpan="7" className="text-end">Total Inward:</td>
                      <td className="text-end">{formatCurrency(viewPurchase.total_amount)}</td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="text-end text-success">Paid:</td>
                      <td className="text-end text-success">{formatCurrency(viewPurchase.paid_amount)}</td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="text-end text-danger fw-bold">Payable Due:</td>
                      <td className="text-end text-danger fw-bold">{formatCurrency(viewPurchase.balance_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
