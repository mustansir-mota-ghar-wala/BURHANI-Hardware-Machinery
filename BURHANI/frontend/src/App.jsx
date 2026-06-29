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

function AppInner() {
  const [toasts, setToasts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Pages that have their own full layout (auth pages)
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer messages={toasts} setMessages={setToasts} />

      {!isAuthPage && (
        <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      )}

      <main style={{ flex: 1, paddingTop: '62px' }}>
        <Routes>
          <Route path="/" element={<HomePage setToasts={setToasts} />} />
          <Route path="/product/:id" element={<ProductListPage setToasts={setToasts} />} />
          <Route path="/item/:id" element={<ProductDetailPage setToasts={setToasts} />} />
          <Route path="/cart" element={<CartPage setToasts={setToasts} />} />
          <Route path="/checkout" element={<CheckoutPage setToasts={setToasts} />} />
          <Route path="/login" element={<LoginPage setToasts={setToasts} />} />
          <Route path="/register" element={<RegisterPage setToasts={setToasts} />} />
          <Route path="/your_orders" element={<YourOrdersPage setToasts={setToasts} />} />
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

      {!isAuthPage && <Footer />}
      {!isAuthPage && <BottomNav onMenuOpen={() => setMobileMenuOpen(true)} />}
      <ChatbotWidget />
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
