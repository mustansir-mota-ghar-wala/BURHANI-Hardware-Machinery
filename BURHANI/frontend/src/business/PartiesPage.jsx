import React, { useState, useEffect } from 'react';
import { fetchParties, saveParty, deleteParty, fetchPartyDetail } from './businessApi';

export default function PartiesPage() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'supplier'
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: '',
    party_type: 'customer',
    balance: 0,
  });
  const [saving, setSaving] = useState(false);

  // Ledger / Details Modal
  const [detailParty, setDetailParty] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchParties(activeTab, search);
      if (res.status === 'success') {
        setParties(res.parties);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingParty(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      gstin: '',
      party_type: activeTab,
      balance: 0,
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingParty(p);
    setFormData({
      name: p.name,
      phone: p.phone || '',
      address: p.address || '',
      gstin: p.gstin || '',
      party_type: p.party_type,
      balance: p.balance,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await saveParty(formData, editingParty?.id);
      if (res.status === 'success') {
        setModalOpen(false);
        loadData();
      } else {
        alert(res.message || 'Error saving party');
      }
    } catch (err) {
      alert(err.message || 'Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${activeTab === 'customer' ? 'Customer' : 'Supplier'} "${name}"?`)) return;
    try {
      const res = await deleteParty(id);
      if (res.status === 'success') {
        setParties(parties.filter((p) => p.id !== id));
      } else {
        alert(res.message || 'Failed to delete');
      }
    } catch (err) {
      alert(err.message || 'Error deleting party');
    }
  };

  const openLedgerModal = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await fetchPartyDetail(id);
      if (res.status === 'success') {
        setDetailParty(res);
      }
    } catch (err) {
      alert('Failed to load party details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const totalOutstanding = parties.reduce((acc, p) => acc + (parseFloat(p.balance) || 0), 0);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold m-0" style={{ letterSpacing: '-0.3px', color: '#111418' }}>Customers &amp; Suppliers Directory</h4>
          <p className="text-muted small m-0">Manage customer ledgers, supplier accounts, and outstanding balances.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-dark fw-bold d-flex align-items-center gap-2 shadow-sm px-3 py-2" style={{ borderRadius: '12px', background: '#111418', border: 'none' }}>
          <i className="bi bi-person-plus-fill"></i> Add {activeTab === 'customer' ? 'Customer' : 'Supplier'}
        </button>
      </div>

      {/* Starline Pill Navigation Tabs */}
      <div className="d-flex gap-2">
        <button
          onClick={() => setActiveTab('customer')}
          className={`starline-pill-tab ${activeTab === 'customer' ? 'active' : ''}`}>
          <i className="bi bi-people me-2"></i> Customers ({activeTab === 'customer' ? parties.length : '...'})
        </button>
        <button
          onClick={() => setActiveTab('supplier')}
          className={`starline-pill-tab ${activeTab === 'supplier' ? 'active' : ''}`}>
          <i className="bi bi-truck me-2"></i> Suppliers ({activeTab === 'supplier' ? parties.length : '...'})
        </button>
      </div>

      {/* Starline Summary Card */}
      <div className="starline-pastel-card peach">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="starline-card-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <span className="starline-metric-label">
                Total {activeTab === 'customer' ? 'Customer Outstanding (Receivable)' : 'Supplier Due (Payable)'}
              </span>
              <div className="starline-metric-num" style={{ color: activeTab === 'customer' ? '#DC2626' : '#D97706' }}>
                {formatCurrency(totalOutstanding)}
              </div>
            </div>
          </div>
          <span className="starline-dropdown-chip bg-white border-0">
            {parties.length} Registered {activeTab === 'customer' ? 'Customers' : 'Suppliers'}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
        <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'customer' ? 'customers' : 'suppliers'} by name, phone, GSTIN...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control border-start-0 ps-0"
            />
          </div>
          <button type="submit" className="btn btn-dark fw-semibold px-4">Search</button>
        </form>
      </div>

      {/* Parties Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>GSTIN</th>
                <th>Outstanding Balance</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                  </td>
                </tr>
              ) : parties.length > 0 ? (
                parties.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="text-muted small">{idx + 1}</td>
                    <td>
                      <button onClick={() => openLedgerModal(p.id)} className="btn btn-link text-decoration-none p-0 fw-bold text-dark text-start">
                        {p.name}
                      </button>
                    </td>
                    <td>{p.phone ? <a href={`tel:${p.phone}`} className="text-decoration-none text-dark">{p.phone}</a> : <span className="text-muted">—</span>}</td>
                    <td className="text-muted text-truncate" style={{ maxWidth: '200px' }}>{p.address || '—'}</td>
                    <td>{p.gstin ? <span className="font-monospace small bg-light p-1 rounded border">{p.gstin}</span> : <span className="text-muted">—</span>}</td>
                    <td>
                      {p.balance > 0 ? (
                        <span className={`badge ${activeTab === 'customer' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-warning bg-opacity-25 text-dark'} fw-bold px-2.5 py-1.5`}>
                          {formatCurrency(p.balance)}
                        </span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success">₹0.00</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button onClick={() => openLedgerModal(p.id)} className="btn btn-light border" title="View Ledger">
                          <i className="bi bi-clock-history"></i>
                        </button>
                        <button onClick={() => openEditModal(p)} className="btn btn-light border" title="Edit">
                          <i className="bi bi-pencil-square text-primary"></i>
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="btn btn-light border text-danger" title="Delete">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No {activeTab === 'customer' ? 'customers' : 'suppliers'} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <form onSubmit={handleSave}>
                <div className="modal-header border-bottom border-light-subtle">
                  <h5 className="modal-title fw-bold">
                    {editingParty ? 'Edit Party' : `Add New ${formData.party_type === 'customer' ? 'Customer' : 'Supplier'}`}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Party Type</label>
                    <select
                      className="form-select"
                      value={formData.party_type}
                      onChange={(e) => setFormData({ ...formData, party_type: e.target.value })}>
                      <option value="customer">Customer</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Balaji Hardware / Rajesh Sharma"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">GSTIN Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      placeholder="15 digit GST Number"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Address</label>
                    <textarea
                      rows="2"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="City, state, pin code..."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Opening Balance (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-light-subtle">
                  <button type="button" className="btn btn-light" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-warning fw-bold px-4">
                    {saving ? 'Saving...' : 'Save Party'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Party Ledger Modal ── */}
      {detailParty && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom border-light-subtle">
                <div>
                  <h5 className="modal-title fw-bold m-0">{detailParty.party.name}</h5>
                  <small className="text-muted">{detailParty.party.party_type === 'customer' ? 'Customer Account' : 'Supplier Account'}</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setDetailParty(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between p-3 rounded-3 bg-light mb-4">
                  <div>
                    <div className="small text-muted">Phone: {detailParty.party.phone || 'N/A'}</div>
                    <div className="small text-muted">GSTIN: {detailParty.party.gstin || 'N/A'}</div>
                    <div className="small text-muted">Address: {detailParty.party.address || 'N/A'}</div>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small fw-semibold">Current Balance</span>
                    <h3 className={`fw-bold m-0 ${detailParty.party.balance > 0 ? 'text-danger' : 'text-success'}`}>
                      {formatCurrency(detailParty.party.balance)}
                    </h3>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">Recent Transactions History</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Reference #</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailParty.recent_sales?.map((s) => (
                        <tr key={`s-${s.id}`}>
                          <td>{s.date}</td>
                          <td><span className="badge bg-primary bg-opacity-10 text-primary">Sale Invoice</span></td>
                          <td>#{s.id}</td>
                          <td className="text-end fw-bold">{formatCurrency(s.amount)}</td>
                        </tr>
                      ))}
                      {detailParty.recent_purchases?.map((p) => (
                        <tr key={`p-${p.id}`}>
                          <td>{p.date}</td>
                          <td><span className="badge bg-dark bg-opacity-10 text-dark">Purchase Inward</span></td>
                          <td>#{p.id}</td>
                          <td className="text-end fw-bold">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                      {detailParty.recent_payments?.map((py) => (
                        <tr key={`py-${py.id}`}>
                          <td>{py.date}</td>
                          <td>
                            <span className="badge bg-success bg-opacity-10 text-success">
                              Payment ({py.mode.toUpperCase()})
                            </span>
                          </td>
                          <td>#{py.id}</td>
                          <td className="text-end fw-bold text-success">-{formatCurrency(py.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
