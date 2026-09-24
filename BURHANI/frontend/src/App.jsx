import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import FloatingDock from './components/FloatingDock';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';

import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import YourOrdersPage from './pages/YourOrdersPage';

// Business ERP Suite
import ProtectedRoute from './business/ProtectedRoute';
import BusinessLayout from './business/BusinessLayout';
import DashboardPage from './business/DashboardPage';
import ProductsPage from './business/ProductsPage';
import SalesPage from './business/SalesPage';
import PurchasesPage from './business/PurchasesPage';
import PartiesPage from './business/PartiesPage';
import PaymentsPage from './business/PaymentsPage';
import ReportsPage from './business/ReportsPage';

function AppInner() {
  const [toasts, setToasts] = useState([]);
  const location = useLocation();

  // Pages that manage their own standalone layout
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const isBusinessPage = location.pathname.startsWith('/business');
  const isCustomLayout = isAuthPage || isBusinessPage;

  return (
    <div className={!isCustomLayout ? 'scenic-page-root' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer messages={toasts} setMessages={setToasts} />

      {!isCustomLayout && <FloatingDock />}

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Consumer Storefront */}
          <Route path="/" element={<HomePage setToasts={setToasts} />} />
          <Route path="/product/:id" element={<ProductListPage setToasts={setToasts} />} />
          <Route path="/item/:id" element={<ProductDetailPage setToasts={setToasts} />} />
          <Route path="/cart" element={<CartPage setToasts={setToasts} />} />
          <Route path="/checkout" element={<CheckoutPage setToasts={setToasts} />} />
          <Route path="/login" element={<LoginPage setToasts={setToasts} />} />
          <Route path="/register" element={<RegisterPage setToasts={setToasts} />} />
          <Route path="/your_orders" element={<YourOrdersPage setToasts={setToasts} />} />

          {/* Business ERP & Management Panel */}
          <Route element={<ProtectedRoute />}>
            <Route path="/business" element={<BusinessLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="parties" element={<PartiesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={
            <div className="container text-center py-5">
              <h1 className="heading-font display-3">404</h1>
              <p className="text-muted">Page not found.</p>
              <a href="/" className="btn-terracotta text-decoration-none">Go Home</a>
            </div>
          } />
        </Routes>
      </main>

      {!isCustomLayout && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
