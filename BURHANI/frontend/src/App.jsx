import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ChatbotWidget from './components/ChatbotWidget';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Pages that manage their own standalone layout
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const isBusinessPage = location.pathname.startsWith('/business');
  const isCustomLayout = isAuthPage || isBusinessPage;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer messages={toasts} setMessages={setToasts} />

      {!isCustomLayout && (
        <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      )}

      <main style={{ flex: 1, paddingTop: isCustomLayout ? 0 : '62px' }}>
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
      {!isCustomLayout && <BottomNav onMenuOpen={() => setMobileMenuOpen(true)} />}
      {!isCustomLayout && <ChatbotWidget />}
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
