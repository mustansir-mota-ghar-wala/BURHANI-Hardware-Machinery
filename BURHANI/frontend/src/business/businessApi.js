import { apiGet, apiPost } from '../utils/api';

const BASE = '/api/business';

export async function fetchDashboard() {
  return await apiGet(`${BASE}/dashboard/`);
}

export async function fetchProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return await apiGet(`${BASE}/products/${qs ? `?${qs}` : ''}`);
}

export async function fetchProductDetail(id) {
  return await apiGet(`${BASE}/products/${id}/`);
}

export async function saveProduct(data, id = null) {
  // If FormData (for image upload)
  if (data instanceof FormData) {
    const url = id ? `${BASE}/products/${id}/` : `${BASE}/products/`;
    const res = await fetch(url, {
      method: 'POST',
      body: data,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
    });
    return await res.json();
  }
  const url = id ? `${BASE}/products/${id}/` : `${BASE}/products/`;
  return await apiPost(url, data);
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE}/products/${id}/`, {
    method: 'DELETE',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  });
  return await res.json();
}

export async function fetchCategories() {
  return await apiGet(`${BASE}/categories/`);
}

export async function fetchParties(type = null, q = '') {
  const params = {};
  if (type) params.type = type;
  if (q) params.q = q;
  const qs = new URLSearchParams(params).toString();
  return await apiGet(`${BASE}/parties/${qs ? `?${qs}` : ''}`);
}

export async function fetchPartyDetail(id) {
  return await apiGet(`${BASE}/parties/${id}/`);
}

export async function saveParty(data, id = null) {
  const url = id ? `${BASE}/parties/${id}/` : `${BASE}/parties/`;
  return await apiPost(url, data);
}

export async function deleteParty(id) {
  const res = await fetch(`${BASE}/parties/${id}/`, {
    method: 'DELETE',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  });
  return await res.json();
}

export async function fetchSales() {
  return await apiGet(`${BASE}/sales/`);
}

export async function createSale(data) {
  return await apiPost(`${BASE}/sales/`, data);
}

export async function fetchSaleDetail(id) {
  return await apiGet(`${BASE}/sales/${id}/`);
}

export async function deleteSale(id) {
  const res = await fetch(`${BASE}/sales/${id}/`, {
    method: 'DELETE',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  });
  return await res.json();
}

export async function fetchPurchases() {
  return await apiGet(`${BASE}/purchases/`);
}

export async function createPurchase(data) {
  return await apiPost(`${BASE}/purchases/`, data);
}

export async function fetchPurchaseDetail(id) {
  return await apiGet(`${BASE}/purchases/${id}/`);
}

export async function deletePurchase(id) {
  const res = await fetch(`${BASE}/purchases/${id}/`, {
    method: 'DELETE',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  });
  return await res.json();
}

export async function fetchPayments() {
  return await apiGet(`${BASE}/payments/`);
}

export async function createPayment(data) {
  return await apiPost(`${BASE}/payments/`, data);
}

export async function fetchGstReport() {
  return await apiGet(`${BASE}/reports/gst/`);
}

export async function fetchOutstandingReport() {
  return await apiGet(`${BASE}/reports/outstanding/`);
}
