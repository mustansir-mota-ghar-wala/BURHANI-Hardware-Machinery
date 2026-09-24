import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_owner && !user.is_staff && !user.is_superuser) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm p-5 border-0 mx-auto" style={{ maxWidth: '500px', borderRadius: '16px' }}>
          <i className="bi bi-shield-lock-fill text-danger" style={{ fontSize: '3.5rem' }}></i>
          <h3 className="fw-bold mt-3 mb-2">Access Restricted</h3>
          <p className="text-muted">You must be logged in as an owner or staff member to view the Business Management Panel.</p>
          <a href="/" className="btn btn-warning rounded-pill px-4 fw-bold mt-2">Back to Storefront</a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
