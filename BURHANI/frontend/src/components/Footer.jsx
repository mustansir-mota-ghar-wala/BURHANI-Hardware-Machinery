import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="glass-footer-wrapper">
      <div className="glass-footer-card">
        <div className="row g-4 align-items-start">
          {/* Brand & Overview */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="footer-brand-badge">
                <i className="bi bi-tools fs-6"></i>
              </div>
              <h4 className="m-0 fw-bold footer-brand-title">BURHANI HARDWARE</h4>
            </div>
            <p className="footer-subtext mb-3">
              Premium hardware, industrial power tools, machinery, motors, and authentic spare parts. Owned by Huzaifa Bhai Boraji in Bhawani Mandi.
            </p>
            <div className="d-flex gap-2 align-items-center">
              <a
                href="https://wa.me/917742752753"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn whatsapp"
                title="Chat on WhatsApp"
              >
                <i className="bi bi-whatsapp"></i>
                <span className="ms-1 small fw-semibold">WhatsApp Us</span>
              </a>
              <a
                href="tel:+917742752753"
                className="footer-social-btn"
                title="Call Support"
              >
                <i className="bi bi-telephone-fill"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="footer-col-heading">Navigation</h6>
            <ul className="footer-links-list">
              <li><Link to="/">Store Home</Link></li>
              <li><Link to="/your_orders">My Orders</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li>
                <Link to="/business" className="footer-erp-link">
                  <i className="bi bi-speedometer2 me-1"></i>Business ERP
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="footer-col-heading">Categories</h6>
            <ul className="footer-links-list">
              <li><Link to="/?q=power">Power Tools</Link></li>
              <li><Link to="/?q=machinery">Machinery</Link></li>
              <li><Link to="/?q=welding">Welding Gear</Link></li>
              <li><Link to="/?q=chainsaw">Chainsaws</Link></li>
              <li><Link to="/?q=spare">Spare Parts</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="col-lg-4 col-md-6">
            <h6 className="footer-col-heading">Store &amp; Location</h6>
            <ul className="footer-contact-list">
              <li>
                <i className="bi bi-geo-alt-fill text-success"></i>
                <a
                  href="https://maps.app.goo.gl/xJR2zs7dau7Srehg7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  Balaji Chauraha, Station Road, Bhawani Mandi, Rajasthan
                </a>
              </li>
              <li>
                <i className="bi bi-telephone-fill text-success"></i>
                <span>+91 77427 52753</span>
              </li>
              <li>
                <i className="bi bi-clock-fill text-success"></i>
                <span>Mon – Sat: 8:00 AM – 8:00 PM</span>
              </li>
              <li>
                <i className="bi bi-patch-check-fill text-success"></i>
                <span>GST Invoicing Available</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="glass-footer-bottom">
          <p className="m-0 small text-muted">
            &copy; {new Date().getFullYear()} Burhani Hardware &amp; Machinery. Engineered for quality and durability.
          </p>
          <div className="d-flex gap-3 small text-muted">
            <span>Genuine Tools</span>
            <span>&bull;</span>
            <span>Transparent Pricing</span>
            <span>&bull;</span>
            <span>Fast Shipping</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
