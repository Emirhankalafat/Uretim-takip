import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../features/auth/authSlice'
import adminAuthSlice from '../features/admin/adminAuthSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    adminAuth: adminAuthSlice,
    notifications: notificationsReducer,
  },
})

export default store 