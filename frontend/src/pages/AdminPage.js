import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, selectIsAdmin } from '../store';
import { Navigate } from 'react-router-dom';

export default function AdminPage() {
  const dispatch = useDispatch();
  const isAdmin  = useSelector(selectIsAdmin);
  const { allUsers, loading, error } = useSelector(s => s.auth);

  // Extra safety — AdminRoute in App.js already guards this
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>⚙ Admin Panel</h2>
          <p>Manage users and system settings</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-num">{allUsers.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{allUsers.filter(u => u.role === 'ADMIN').length}</span>
          <span className="stat-label">Admins</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{allUsers.filter(u => u.role === 'USER').length}</span>
          <span className="stat-label">Regular Users</span>
        </div>
      </div>

      <h3>All Registered Users</h3>
      {loading && <div className="loading">Loading users...</div>}
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>
          </thead>
          <tbody>
            {allUsers.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-badge--${u.role.toLowerCase()}`}>{u.role}</span>
                </td>
              </tr>
            ))}
            {!loading && allUsers.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-info-box">
        <h4>🔐 JWT Auth Flow</h4>
        <ol>
          <li><strong>Login/Register</strong> → User Service generates JWT with <code>email</code> + <code>role</code> claim</li>
          <li><strong>API Gateway</strong> → validates JWT, extracts role → grants/denies access</li>
          <li><strong>ADMIN endpoints</strong> → <code>/api/users/all</code>, <code>POST /api/products</code>, <code>DELETE /api/products/**</code></li>
          <li><strong>Gateway injects</strong> <code>X-User-Email</code> + <code>X-User-Role</code> headers downstream</li>
          <li><strong>Product Service</strong> → uses headers for audit trail (no JWT re-validation needed)</li>
        </ol>
      </div>
    </div>
  );
}
