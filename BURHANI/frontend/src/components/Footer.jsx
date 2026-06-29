import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="d-flex align-items-center mb-4">
              <div className="logo-circle">
                <i className="bi bi-tools fs-5"></i>
              </div>
              <h3 className="heading-font text-white mb-0" style={{ letterSpacing: '1px' }}>BURHANI HARDWARE</h3>
            </div>
            <p className="text-white-50 mb-4 pe-lg-5">
              Burhani Hardware and Machinery, owned by Huzaifa Bhai Boraji, supplies tools, machinery, motors, pipes and agricultural equipment in Bhawani Mandi.
            </p>
            <div className="social-icons">
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-instagram"></i></a>
              <a href="https://wa.me/917742752753" target="_blank" rel="noopener"><i className="bi bi-whatsapp"></i></a>
            </div>
          </div>

          <div className="col-lg-2 col-md-4">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><a href="/#categories">Shop Tools</a></li>
              <li><Link to="/your_orders">My Orders</Link></li>
              <li><a href="/#about">About Us</a></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-4">
            <h4 className="footer-title">Categories</h4>
            <ul className="footer-links">
              <li><a href="#">Power Tools</a></li>
              <li><a href="#">Industrial Machinery</a></li>
              <li><a href="#">Hand Tools</a></li>
              <li><a href="#">Spare Parts</a></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-4">
            <h4 className="footer-title">Contact Us</h4>
            <ul className="footer-links">
              <li className="text-white-50"><i className="bi bi-person me-2 text-warning"></i>Huzaifa Bhai Boraji</li>
              <li>
                <a href="https://maps.app.goo.gl/xJR2zs7dau7Srehg7" target="_blank" rel="noopener">
                  <i className="bi bi-geo-alt me-2 text-warning"></i>Balaji Chauraha, Station Road, Bhawani Mandi, Jhalawar, Rajasthan
                </a>
              </li>
              <li><a href="tel:+917742752753"><i className="bi bi-telephone me-2 text-warning"></i>+91 77427 52753</a></li>
              <li><a href="https://wa.me/917742752753" target="_blank" rel="noopener"><i className="bi bi-whatsapp me-2 text-warning"></i>WhatsApp: +91 77427 52753</a></li>
              <li><a href="mailto:mustansirmotagh786.88@gmail.com"><i className="bi bi-envelope me-2 text-warning"></i>mustansirmotagh786.88@gmail.com</a></li>
              <li className="text-white-50"><i className="bi bi-clock me-2 text-warning"></i>8:00 AM to 8:00 PM</li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <p className="mb-0">&copy; 2026 Burhani Hardware &amp; Machinery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
