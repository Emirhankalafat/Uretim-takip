import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false, // Cookie kontrolü backend'de yapılacak
  loading: false,
  error: null,
  initialized: false, // App'in initialize edilip edilmediğini takip etmek için
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // App başlangıcında auth durumunu kontrol etmek için
    initializeStart: (state) => {
      state.loading = true
      state.initialized = false
    },
    initializeSuccess: (state, action) => {
      state.loading = false
      state.initialized = true
      if (action.payload) {
        state.isAuthenticated = true
        state.user = action.payload.user
      } else {
        state.isAuthenticated = false
        state.user = null
      }
    },
    initializeFailure: (state) => {
      state.loading = false
      state.initialized = true
      state.isAuthenticated = false
      state.user = null
    },
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.initialized = true
      // Backend cookie kullandığı için token localStorage'a kaydetmiyoruz
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.initialized = true
      state.error = null
      // localStorage.removeItem('token') // Cookie kullandığımız için gerek yok
    },
    clearError: (state) => {
      state.error = null
    },
    clearLoading: (state) => {
      state.loading = false
      state.error = null
    },
  },
})

export const { 
  initializeStart, 
  initializeSuccess, 
  initializeFailure,
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  clearError,
  clearLoading 
} = authSlice.actions

export default authSlice.reducer 