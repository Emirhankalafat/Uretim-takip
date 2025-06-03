import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../features/auth/authSlice'
import adminAuthSlice from '../features/admin/adminAuthSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    adminAuth: adminAuthSlice,
  },
})

export default store 