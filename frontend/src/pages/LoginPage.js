import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError } from '../store';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth);

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
    return () => dispatch(clearError());
  }, [token, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Login</h2>

        {/* ✅ Quick-fill hint for demo */}
        <div className="demo-hint">
          <p><strong>Demo Credentials:</strong></p>
          <button className="btn-demo" onClick={() => setForm({ email: 'admin@shopflow.com', password: 'admin123' })}>
            Fill Admin Credentials
          </button>
          <span className="demo-or">or register a new user account</span>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="aapka@email.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••"
            />
          </div>
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          Account nahi hai? <Link to="/register">Register karo</Link>
        </p>
      </div>
    </div>
  );
}
