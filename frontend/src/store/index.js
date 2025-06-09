import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../features/auth/authSlice'
import adminAuthSlice from '../features/admin/adminAuthSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    adminAuth: adminAuthSlice,
    notifications: notificationsReducer,
    profile: profileReducer,
  },
})

export default store 