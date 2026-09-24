import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchCategories, saveProduct, deleteProduct } from './businessApi';

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(searchParams.get('low_stock') === 'true');
  const [stockValue, setStockValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    purchase_price: '',
    avg_cost: '',
    stock_qty: 0,
    gst_percent: 18,
    barcode: '',
    low_stock_limit: 5,
    show_on_website: true,
    is_power_tools: false,
    is_machinery: false,
    is_spare_part: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetchProducts({ q: search, category: categoryFilter, low_stock: lowStockFilter }),
        fetchCategories(),
      ]);

      if (prodRes.status === 'success') {
        setProducts(prodRes.products);
        setStockValue(prodRes.stock_value);
        setLowStockCount(prodRes.low_stock_count);
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
  }, [categoryFilter, lowStockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: categories[0]?.id || '',
      description: '',
      price: '',
      purchase_price: '',
      avg_cost: '',
      stock_qty: 0,
      gst_percent: 18,
      barcode: '',
      low_stock_limit: 5,
      show_on_website: true,
      is_power_tools: false,
      is_machinery: false,
      is_spare_part: false,
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category_id || '',
      description: p.description || '',
      price: p.price,
      purchase_price: p.purchase_price,
      avg_cost: p.avg_cost,
      stock_qty: p.stock_qty,
      gst_percent: p.gst_percent,
      barcode: p.barcode || '',
      low_stock_limit: p.low_stock_limit,
      show_on_website: p.show_on_website,
      is_power_tools: p.is_power_tools,
      is_machinery: p.is_machinery,
      is_spare_part: p.is_spare_part,
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        data.append(k, v);
      });
      if (imageFile) {
        data.append('image', imageFile);
      }

      const res = await saveProduct(data, editingProduct?.id);
      if (res.status === 'success') {
        setToastMessage(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        setModalOpen(false);
        loadData();
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(res.message || 'Error saving product');
      }
    } catch (err) {
      alert(err.message || 'Server error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await deleteProduct(id);
      if (res.status === 'success') {
        setProducts(products.filter((p) => p.id !== id));
        setToastMessage('Product deleted successfully');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(res.message || 'Failed to delete');
      }
    } catch (err) {
      alert(err.message || 'Error deleting product');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3 shadow" style={{ zIndex: 1060 }}>
          <i className="bi bi-check-circle-fill me-2"></i>
          {toastMessage}
          <button type="button" className="btn-close" onClick={() => setToastMessage(null)}></button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold m-0">Inventory &amp; Stock Management</h4>
          <p className="text-muted small m-0">Manage items, stock counts, cost pricing, and GST tax slabs.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-warning fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ borderRadius: '10px' }}>
          <i className="bi bi-plus-circle"></i> Add Product
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3">
        <div className="col-sm-6 col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <span className="text-muted small fw-semibold">Total Catalog Items</span>
            <h4 className="fw-bold text-dark m-0">{products.length} Items</h4>
          </div>
        </div>
        <div className="col-sm-6 col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <span className="text-muted small fw-semibold">Inventory Valuation (Cost)</span>
            <h4 className="fw-bold text-success m-0">{formatCurrency(stockValue)}</h4>
          </div>
        </div>
        <div className="col-sm-6 col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
            <span className="text-muted small fw-semibold">Low Stock Warnings</span>
            <h4 className={`fw-bold m-0 ${lowStockCount > 0 ? 'text-danger' : 'text-muted'}`}>{lowStockCount} Items</h4>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                placeholder="Search products by name, description, barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control border-start-0 ps-0"
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <button
              type="button"
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`btn w-100 fw-semibold ${lowStockFilter ? 'btn-danger' : 'btn-outline-danger'}`}>
              <i className="bi bi-exclamation-triangle me-1"></i> Low Stock
            </button>
          </div>
          <div className="col-12 col-md-2">
            <button type="submit" className="btn btn-dark w-100 fw-semibold">Search</button>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Product Name</th>
                <th>Category</th>
                <th className="text-center">Stock</th>
                <th>Selling Price</th>
                <th>Avg Cost</th>
                <th>GST %</th>
                <th className="text-center">Website</th>
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
              ) : products.length > 0 ? (
                products.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="text-muted small">{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="rounded-2 object-fit-contain border" style={{ width: '38px', height: '38px' }} />
                        ) : (
                          <div className="rounded-2 bg-light border d-flex align-items-center justify-content-center text-muted" style={{ width: '38px', height: '38px' }}>
                            <i className="bi bi-box small"></i>
                          </div>
                        )}
                        <div>
                          <div className="fw-bold text-dark">{p.name}</div>
                          {p.barcode && <small className="text-muted font-monospace"><i className="bi bi-upc-scan me-1"></i>{p.barcode}</small>}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge bg-light text-dark border">{p.category_name}</span></td>
                    <td className="text-center">
                      <span className={`badge ${p.is_low_stock ? 'bg-danger' : 'bg-success bg-opacity-10 text-success'} fw-bold px-2.5 py-1.5`} style={{ fontSize: '0.82rem' }}>
                        {p.stock_qty}
                      </span>
                    </td>
                    <td className="fw-bold text-dark">{formatCurrency(p.price)}</td>
                    <td className="text-muted">{formatCurrency(p.avg_cost)}</td>
                    <td><span className="badge bg-secondary bg-opacity-10 text-secondary">{p.gst_percent}%</span></td>
                    <td className="text-center">
                      {p.show_on_website ? (
                        <i className="bi bi-check-circle-fill text-success fs-5" title="Visible on Storefront"></i>
                      ) : (
                        <i className="bi bi-dash-circle text-muted fs-5" title="Hidden from Storefront"></i>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
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
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 d-block mb-2 opacity-50"></i>
                    No products found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Product Modal ── */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <form onSubmit={handleSave}>
                <div className="modal-header border-bottom border-light-subtle">
                  <h5 className="modal-title fw-bold">
                    {editingProduct ? 'Edit Product' : 'Add New Inventory Item'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold small">Product Name *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Stihl MS 250 Chainsaw"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Category *</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Selling Price (Incl. GST) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="form-control"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Purchase Cost (Incl. GST)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">GST Tax Rate (%) *</label>
                      <select
                        className="form-select"
                        value={formData.gst_percent}
                        onChange={(e) => setFormData({ ...formData, gst_percent: e.target.value })}>
                        <option value="0">0% (Nil)</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label fw-semibold small">Current Stock Qty</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.stock_qty}
                        onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label fw-semibold small">Low Stock Alert Limit</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.low_stock_limit}
                        onChange={(e) => setFormData({ ...formData, low_stock_limit: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small">Barcode / SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="Scan or enter code"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Description</label>
                      <textarea
                        rows="2"
                        className="form-control"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Technical specs, warranty, features..."
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Product Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => setImageFile(e.target.files[0])}
                      />
                    </div>

                    <div className="col-12 d-flex flex-wrap gap-4 pt-2">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="showWebsiteSwitch"
                          checked={formData.show_on_website}
                          onChange={(e) => setFormData({ ...formData, show_on_website: e.target.checked })}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="showWebsiteSwitch">Show on Customer Website</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="sparePartCheck"
                          checked={formData.is_spare_part}
                          onChange={(e) => setFormData({ ...formData, is_spare_part: e.target.checked })}
                        />
                        <label className="form-check-label small" htmlFor="sparePartCheck">Spare Part</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="powerToolsCheck"
                          checked={formData.is_power_tools}
                          onChange={(e) => setFormData({ ...formData, is_power_tools: e.target.checked })}
                        />
                        <label className="form-check-label small" htmlFor="powerToolsCheck">Power Tool</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top border-light-subtle">
                  <button type="button" className="btn btn-light" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-warning fw-bold px-4">
                    {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
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
