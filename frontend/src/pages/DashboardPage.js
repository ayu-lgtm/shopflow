import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts, createProduct, deleteProduct, selectIsAdmin, clearProductError } from '../store';

const emptyForm = { name: '', description: '', price: '', stock: '', category: '' };

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user }           = useSelector(s => s.auth);
  const { items, loading, error } = useSelector(s => s.products);
  const isAdmin            = useSelector(selectIsAdmin);
  const [form, setForm]    = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg]      = useState('');

  useEffect(() => {
    dispatch(fetchProducts());
    return () => dispatch(clearProductError());
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await dispatch(createProduct({
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
    }));
    if (!result.error) {
      setForm(emptyForm);
      setShowForm(false);
      setMsg('✅ Product created successfully!');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this product?')) dispatch(deleteProduct(id));
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>
            Welcome, <strong>{user?.name}</strong>
            <span className={`role-badge role-badge--${user?.role?.toLowerCase()}`}>
              {user?.role}
            </span>
          </p>
        </div>
        <div className="header-actions">
          {/* ✅ Add Product button only for ADMIN */}
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Product'}
            </button>
          )}
          {/* ✅ Admin Panel quick link */}
          {isAdmin && (
            <Link to="/admin" className="btn-secondary">⚙ Admin Panel</Link>
          )}
        </div>
      </div>

      {/* ✅ Error display */}
      {error && <div className="alert-error">{error}</div>}
      {msg   && <div className="alert-success">{msg}</div>}

      {/* ✅ Non-admin info banner */}
      {!isAdmin && (
        <div className="alert-info">
          ℹ You are logged in as a regular user. Products are read-only. Only Admins can create/delete products.
        </div>
      )}

      {/* ✅ Product create form (ADMIN only) */}
      {isAdmin && showForm && (
        <div className="form-card">
          <h3>New Product</h3>
          <p className="info-text">
            ℹ Product create karne par Feign Client se User Service ko sync validate call hogi!
          </p>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Laptop" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input required type="number" min="0" step="0.01" value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })} placeholder="999" />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" min="0" value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="10" />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-num">{items.length}</span>
          <span className="stat-label">Total Products</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{items.filter(p => p.stock > 0).length}</span>
          <span className="stat-label">In Stock</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">
            ₹{items.reduce((sum, p) => sum + Number(p.price), 0).toLocaleString('en-IN')}
          </span>
          <span className="stat-label">Total Value</span>
        </div>
      </div>

      <h3>All Products</h3>
      {loading && <div className="loading">Loading...</div>}
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th><th>Category</th><th>Price</th><th>Stock</th>
              {/* ✅ Delete column only for ADMIN */}
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong><br /><small>{p.description}</small></td>
                <td>{p.category || '—'}</td>
                <td>₹{Number(p.price).toLocaleString('en-IN')}</td>
                <td>
                  <span className={`stock-badge ${p.stock > 0 ? 'in-stock' : 'out-stock'}`}>{p.stock}</span>
                </td>
                {isAdmin && (
                  <td>
                    <button className="btn-danger-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
