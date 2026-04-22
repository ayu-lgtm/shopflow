import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, selectIsAdmin } from '../store';

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const isAdmin  = useSelector(selectIsAdmin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">🛍 ShopFlow</Link>
      <div className="nav-links">
        <Link to="/products">Products</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {/* ✅ Admin link only for ADMIN role */}
            {isAdmin && (
              <Link to="/admin" className="nav-admin-badge">⚙ Admin Panel</Link>
            )}
            <span className="nav-user">
              Hi, {user.name}
              {/* ✅ Role badge */}
              <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
                {user.role}
              </span>
            </span>
            <button onClick={handleLogout} className="btn-link">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary-sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
