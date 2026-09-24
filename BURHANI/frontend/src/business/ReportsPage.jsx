import React, { useState, useEffect } from 'react';
import { fetchGstReport, fetchOutstandingReport } from './businessApi';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('gst'); // 'gst' or 'outstanding'
  const [gstData, setGstData] = useState(null);
  const [outstandingData, setOutstandingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gstRes, outRes] = await Promise.all([
        fetchGstReport(),
        fetchOutstandingReport(),
      ]);

      if (gstRes.status === 'success') {
        setGstData(gstRes);
      }
      if (outRes.status === 'success') {
        setOutstandingData(outRes);
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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold m-0">Financial &amp; GST Tax Reports</h4>
          <p className="text-muted small m-0">GSTR-1, GSTR-3B Input/Output tax breakdown and aged balance aging.</p>
        </div>
        <button onClick={() => window.print()} className="btn btn-outline-dark fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ borderRadius: '10px' }}>
          <i className="bi bi-printer"></i> Print Report
        </button>
      </div>

      {/* Starline Pill Navigation Tabs */}
      <div className="d-flex gap-2">
        <button
          onClick={() => setActiveTab('gst')}
          className={`starline-pill-tab ${activeTab === 'gst' ? 'active' : ''}`}>
          <i className="bi bi-receipt-cutoff me-2"></i> GST Tax Filing Summary
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`starline-pill-tab ${activeTab === 'outstanding' ? 'active' : ''}`}>
          <i className="bi bi-hourglass-split me-2"></i> Outstanding Balances
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status"></div>
        </div>
      ) : activeTab === 'gst' && gstData ? (
        <div className="d-flex flex-column gap-4">
          {/* Starline GST Summary Cards */}
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="starline-pastel-card peach h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="starline-card-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                    </svg>
                  </div>
                  <div>
                    <span className="starline-metric-label">Output GST (Sales)</span>
                    <div className="starline-metric-num">{formatCurrency(gstData.summary.output_total)}</div>
                  </div>
                </div>
                <div className="small text-muted d-flex justify-content-between pt-1 border-top border-secondary border-opacity-10">
                  <span>CGST: {formatCurrency(gstData.summary.output_cgst)}</span>
                  <span>SGST: {formatCurrency(gstData.summary.output_sgst)}</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="starline-pastel-card mint h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="starline-card-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <circle cx="12" cy="12" r="9"></circle>
                      <polyline points="12 6 12 12 14 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <span className="starline-metric-label">Input Tax Credit (Purchases)</span>
                    <div className="starline-metric-num" style={{ color: '#059669' }}>{formatCurrency(gstData.summary.input_total)}</div>
                  </div>
                </div>
                <div className="small text-muted d-flex justify-content-between pt-1 border-top border-secondary border-opacity-10">
                  <span>CGST: {formatCurrency(gstData.summary.input_cgst)}</span>
                  <span>SGST: {formatCurrency(gstData.summary.input_sgst)}</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="starline-pastel-card lavender h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="starline-card-icon-box" style={gstData.summary.net_payable > 0 ? { background: '#FEE2E2', color: '#DC2626' } : {}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="starline-metric-label">Net GST Liability / Credit</span>
                    <div className="starline-metric-num" style={gstData.summary.net_payable > 0 ? { color: '#DC2626' } : { color: '#059669' }}>
                      {formatCurrency(gstData.summary.net_payable)}
                    </div>
                  </div>
                </div>
                <span className="small text-muted">
                  {gstData.summary.net_payable > 0 ? 'Tax payable to government' : 'Surplus input tax credit carried forward'}
                </span>
              </div>
            </div>
          </div>

          {/* Sales Output Tax Table */}
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
            <h5 className="fw-bold mb-3">Sales Invoices Output Tax (GSTR-1)</h5>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Inv #</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th className="text-end">Taxable Value</th>
                    <th className="text-end">Output CGST</th>
                    <th className="text-end">Output SGST</th>
                    <th className="text-end">Total Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData.sales_tax_entries?.length > 0 ? (
                    gstData.sales_tax_entries.map((entry) => (
                      <tr key={`sale-${entry.id}`}>
                        <td className="text-muted">{entry.date}</td>
                        <td className="fw-bold">#{entry.sale_id}</td>
                        <td className="fw-semibold">{entry.customer}</td>
                        <td>{entry.product}</td>
                        <td className="text-end">{formatCurrency(entry.taxable_value)}</td>
                        <td className="text-end">{formatCurrency(entry.cgst)}</td>
                        <td className="text-end">{formatCurrency(entry.sgst)}</td>
                        <td className="text-end fw-bold">{formatCurrency(entry.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-3">No sales tax entries logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purchases Input Tax Table */}
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
            <h5 className="fw-bold mb-3">Purchase Inward Input Tax Credit (GSTR-3B)</h5>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Bill #</th>
                    <th>Supplier</th>
                    <th>Product</th>
                    <th className="text-end">Taxable Value</th>
                    <th className="text-end">Input CGST</th>
                    <th className="text-end">Input SGST</th>
                    <th className="text-end">Total Inward</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData.purchase_tax_entries?.length > 0 ? (
                    gstData.purchase_tax_entries.map((entry) => (
                      <tr key={`purchase-${entry.id}`}>
                        <td className="text-muted">{entry.date}</td>
                        <td className="fw-bold">#{entry.purchase_id}</td>
                        <td className="fw-semibold">{entry.supplier}</td>
                        <td>{entry.product}</td>
                        <td className="text-end">{formatCurrency(entry.taxable_value)}</td>
                        <td className="text-end text-success">{formatCurrency(entry.cgst)}</td>
                        <td className="text-end text-success">{formatCurrency(entry.sgst)}</td>
                        <td className="text-end fw-bold">{formatCurrency(entry.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-3">No purchase tax credits logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'outstanding' && outstandingData ? (
        <div className="row g-4">
          {/* Customers with Receivables */}
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '16px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="fw-bold m-0 text-danger">Customer Receivables</h5>
                  <small className="text-muted">Customers who owe payments</small>
                </div>
                <h4 className="fw-bold text-danger m-0">{formatCurrency(outstandingData.total_receivable)}</h4>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th className="text-end">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingData.customers?.length > 0 ? (
                      outstandingData.customers.map((c) => (
                        <tr key={c.id}>
                          <td className="fw-bold">{c.name}</td>
                          <td>{c.phone ? <a href={`tel:${c.phone}`} className="text-decoration-none text-dark">{c.phone}</a> : '—'}</td>
                          <td className="text-end fw-bold text-danger">{formatCurrency(c.balance)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-4">No outstanding customer balances!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Suppliers with Payables */}
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '16px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="fw-bold m-0 text-dark">Supplier Payables</h5>
                  <small className="text-muted">Suppliers we owe money to</small>
                </div>
                <h4 className="fw-bold text-dark m-0">{formatCurrency(outstandingData.total_payable)}</h4>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Supplier</th>
                      <th>Phone</th>
                      <th className="text-end">Amount Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingData.suppliers?.length > 0 ? (
                      outstandingData.suppliers.map((s) => (
                        <tr key={s.id}>
                          <td className="fw-bold">{s.name}</td>
                          <td>{s.phone ? <a href={`tel:${s.phone}`} className="text-decoration-none text-dark">{s.phone}</a> : '—'}</td>
                          <td className="text-end fw-bold text-dark">{formatCurrency(s.balance)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-4">No supplier payables due!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
