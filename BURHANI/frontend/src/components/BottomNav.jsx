import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav({ onMenuOpen }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-app-bar">
      <button className="bottom-app-bar-item" onClick={onMenuOpen}>
        <i className="bi bi-person"></i>
        <span>Menu</span>
      </button>
      <Link to="/" className={`bottom-app-bar-item ${isActive('/') ? 'active' : ''}`}>
        <i className={`bi ${isActive('/') ? 'bi-house-door-fill' : 'bi-house-door'}`}></i>
        <span>Home</span>
      </Link>
      <Link to="/your_orders" className={`bottom-app-bar-item ${isActive('/your_orders') ? 'active' : ''}`}>
        <i className={`bi ${isActive('/your_orders') ? 'bi-box-seam-fill' : 'bi-box-seam'}`}></i>
        <span>Orders</span>
      </Link>
      <Link to="/cart" className={`bottom-app-bar-item ${isActive('/cart') ? 'active' : ''}`}>
        <i className={`bi ${isActive('/cart') ? 'bi-cart-fill' : 'bi-cart'}`}></i>
        <span>Cart</span>
      </Link>
    </nav>
  );
}
