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

      {/* Tabs */}
      <div className="d-flex gap-2 border-bottom pb-2">
        <button
          onClick={() => setActiveTab('gst')}
          className={`btn fw-bold px-4 py-2 ${activeTab === 'gst' ? 'btn-dark' : 'btn-light text-muted'}`}
          style={{ borderRadius: '10px' }}>
          <i className="bi bi-receipt-cutoff me-2"></i> GST Tax Filing Summary
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`btn fw-bold px-4 py-2 ${activeTab === 'outstanding' ? 'btn-dark' : 'btn-light text-muted'}`}
          style={{ borderRadius: '10px' }}>
          <i className="bi bi-hourglass-split me-2"></i> Outstanding Balances
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
        </div>
      ) : activeTab === 'gst' && gstData ? (
        <div className="d-flex flex-column gap-4">
          {/* GST Summary Cards */}
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '14px', background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)' }}>
                <span className="text-muted small fw-bold text-uppercase">Output GST (Sales)</span>
                <h3 className="fw-bold text-dark mt-1 mb-2">{formatCurrency(gstData.summary.output_total)}</h3>
                <div className="small text-muted d-flex justify-content-between">
                  <span>CGST: {formatCurrency(gstData.summary.output_cgst)}</span>
                  <span>SGST: {formatCurrency(gstData.summary.output_sgst)}</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '14px', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
                <span className="text-muted small fw-bold text-uppercase">Input Tax Credit (Purchases)</span>
                <h3 className="fw-bold text-success mt-1 mb-2">{formatCurrency(gstData.summary.input_total)}</h3>
                <div className="small text-muted d-flex justify-content-between">
                  <span>CGST: {formatCurrency(gstData.summary.input_cgst)}</span>
                  <span>SGST: {formatCurrency(gstData.summary.input_sgst)}</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: '14px', background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)' }}>
                <span className="text-muted small fw-bold text-uppercase">Net GST Liability / Credit</span>
                <h3 className={`fw-bold mt-1 mb-2 ${gstData.summary.net_payable > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(gstData.summary.net_payable)}
                </h3>
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
