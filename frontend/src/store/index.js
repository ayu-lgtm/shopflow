import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

// ─── Axios instance with JWT auto-attach ────────────────────────────────────
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ FIX: 401/403 interceptor — auto logout on token expiry
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch logout if store is available
      if (window.__store__) {
        window.__store__.dispatch({ type: 'auth/logout' });
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH SLICE ──────────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/api/users/register', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify({
      name: res.data.name,
      email: res.data.email,
      role: res.data.role,
    }));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/api/users/login', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify({
      name: res.data.name,
      email: res.data.email,
      role: res.data.role,
    }));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.response?.data?.message || 'Login failed');
  }
});

// ✅ NEW: Fetch current user profile (requires auth)
export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/api/users/profile');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch profile');
  }
});

// ✅ NEW: Fetch all users (ADMIN only)
export const fetchAllUsers = createAsyncThunk('auth/allUsers', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/api/users/all');
    return res.data;
  } catch (err) {
    return rejectWithValue(
      err.response?.status === 403
        ? 'Access denied: Admin role required'
        : err.response?.data?.error || 'Failed to fetch users'
    );
  }
});

const savedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    token: localStorage.getItem('token'),
    allUsers: [],
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.allUsers = [];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const handlePending   = (state)         => { state.loading = true; state.error = null; };
    const handleRejected  = (state, action) => { state.loading = false; state.error = action.payload; };
    const handleAuthFulfilled = (state, action) => {
      state.loading = false;
      state.user  = { name: action.payload.name, email: action.payload.email, role: action.payload.role };
      state.token = action.payload.token;
    };

    builder
      .addCase(registerUser.pending,   handlePending)
      .addCase(registerUser.fulfilled, handleAuthFulfilled)
      .addCase(registerUser.rejected,  handleRejected)
      .addCase(loginUser.pending,      handlePending)
      .addCase(loginUser.fulfilled,    handleAuthFulfilled)
      .addCase(loginUser.rejected,     handleRejected)
      .addCase(fetchProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(fetchAllUsers.pending,   handlePending)
      .addCase(fetchAllUsers.fulfilled, (state, action) => { state.loading = false; state.allUsers = action.payload; })
      .addCase(fetchAllUsers.rejected,  handleRejected);
  },
});

// ─── PRODUCTS SLICE ──────────────────────────────────────────────────────────
export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/api/products');
    return res.data;
  } catch (err) {
    return rejectWithValue('Failed to load products');
  }
});

// ✅ FIX: ADMIN-only — JWT token in header (auto-attached), X-User-Email from store
export const createProduct = createAsyncThunk('products/create', async (data, { rejectWithValue, getState }) => {
  try {
    const userEmail = getState().auth.user?.email || '';
    const res = await api.post('/api/products', data, {
      headers: { 'X-User-Email': userEmail },
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) return rejectWithValue('Login required');
    if (err.response?.status === 403) return rejectWithValue('Admin role required to create products');
    return rejectWithValue(err.response?.data?.error || 'Failed to create product');
  }
});

// ✅ FIX: ADMIN-only delete
export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/products/${id}`);
    return id;
  } catch (err) {
    if (err.response?.status === 403) return rejectWithValue('Admin role required to delete products');
    return rejectWithValue('Failed to delete product');
  }
});

// ✅ NEW: ADMIN-only update
export const updateProduct = createAsyncThunk('products/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/api/products/${id}`, data);
    return res.data;
  } catch (err) {
    if (err.response?.status === 403) return rejectWithValue('Admin role required');
    return rejectWithValue(err.response?.data?.error || 'Failed to update product');
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    clearProductError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchProducts.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createProduct.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(createProduct.fulfilled, (state, action) => { state.loading = false; state.items.unshift(action.payload); })
      .addCase(createProduct.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected,  (state, action) => { state.error = action.payload; })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.items.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

// ─── STORE ───────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    auth:     authSlice.reducer,
    products: productsSlice.reducer,
  },
});

// Make store accessible for 401 interceptor
window.__store__ = store;

export const { logout, clearError }        = authSlice.actions;
export const { clearProductError }         = productsSlice.actions;
export const selectIsAdmin = (state)       => state.auth.user?.role === 'ADMIN';
export const selectIsLoggedIn = (state)    => !!state.auth.token;
