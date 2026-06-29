import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProductListPage({ setToasts }) {
  const { id } = useParams();
  const [data, setData] = useState({ categories: [], selected_category: null, products: [] });
  const [loading, setLoading] = useState(true);
  const { user, setCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiGet(`/api/react/products/${id}/`).then(d => { setData(d); setLoading(false); });
  }, [id]);

  const addToCart = async (productId) => {
    if (!user) { navigate('/login'); return; }
    const res = await apiPost(`/api/react/cart/add/${productId}/`);
    if (res.status === 'success') {
      setCartCount(res.cart_count);
      setToasts(t => [...t, { tag: 'success', text: 'Added to cart!' }]);
    } else {
      setToasts(t => [...t, { tag: 'error', text: res.message || 'Error.' }]);
    }
  };

  return (
    <div className="container py-4">
      {/* Category Sidebar / Filter Pills */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
          <Link to="/" className="btn btn-sm btn-outline-secondary rounded-pill">
            <i className="bi bi-house me-1"></i>All
          </Link>
          {data.categories.map(cat => (
            <Link key={cat.id} to={`/product/${cat.id}`}
              className={`btn btn-sm rounded-pill ${cat.id === data.selected_category?.id ? 'btn-warning fw-bold' : 'btn-outline-secondary'}`}>
              {cat.name}
            </Link>
          ))}
        </div>
        {data.selected_category && (
          <h1 className="heading-font fs-3 mb-1" style={{ textTransform: 'capitalize' }}>
            {data.selected_category.name}
          </h1>
        )}
        <p className="text-muted small">{data.products.length} product{data.products.length !== 1 ? 's' : ''} found</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
        </div>
      ) : (
        <div className="row g-3">
          {data.products.length > 0 ? data.products.map(product => (
            <div key={product.id} className="col-6 col-md-3">
              <Link to={`/item/${product.id}`} className="prod-card touch-feedback d-block text-decoration-none text-dark position-relative">
                <div className="prod-img d-block">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=800&auto=format&fit=crop'}
                    alt={product.name}
                  />
                </div>
                <div className="prod-info text-center">
                  <h4>{product.name}</h4>
                  <div className="prod-price">₹{product.price}</div>
                  <button className="btn-add position-relative" style={{ zIndex: 2 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product.id); }}>Add to Cart</button>
                </div>
              </Link>
            </div>
          )) : (
            <div className="col-12 text-center py-5">
              <i className="bi bi-box-seam fs-1 text-muted mb-3 d-block"></i>
              <h3>No products in this category</h3>
              <p className="text-muted mb-4">Check back soon for new arrivals.</p>
              <Link to="/" className="btn-terracotta text-decoration-none">Browse All</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
