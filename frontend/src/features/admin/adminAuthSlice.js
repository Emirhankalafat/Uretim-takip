import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  admin: null,
  token: localStorage.getItem('admin_token') || null,
  loading: false,
  error: null,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    adminLoginStart(state) {
      state.loading = true;
      state.error = null;
    },
    adminLoginSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.admin = action.payload.admin;
      state.token = action.payload.token;
      state.error = null;
    },
    adminLoginFailure(state, action) {
      state.loading = false;
      state.isAuthenticated = false;
      state.admin = null;
      state.token = null;
      state.error = action.payload;
    },
    adminLogout(state) {
      state.isAuthenticated = false;
      state.admin = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('csrf_token');
    },
    setAdminFromStorage(state, action) {
      state.token = action.payload.token;
      state.admin = action.payload.admin;
      state.isAuthenticated = !!action.payload.token;
    }
  }
});

export const {
  adminLoginStart,
  adminLoginSuccess,
  adminLoginFailure,
  adminLogout,
  setAdminFromStorage
} = adminAuthSlice.actions;

export default adminAuthSlice.reducer; 