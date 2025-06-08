// notificationsSlice.js (frontend)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationApiService } from './services/notificationService';
import { createSelector } from 'reselect';

// Async Thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page, limit } = { page: 1, limit: 10 }, { rejectWithValue }) => {
    try {
      const data = await notificationApiService.getNotifications(page, limit);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationApiService.getUnreadCount();
      return data.unreadCount; // Assuming API returns { unreadCount: number }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { dispatch, rejectWithValue }) => {
    try {
      await notificationApiService.markAsRead(notificationId);
      dispatch(fetchUnreadCount()); // Refresh unread count
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await notificationApiService.markAllAsRead();
      dispatch(fetchUnreadCount()); // Refresh unread count
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  unreadCountStatus: 'idle',
  unreadCountError: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotifications: (state) => {
      state.items = [];
      state.currentPage = 1;
      state.totalPages = 1;
      state.totalCount = 0;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Assuming API returns { notifications: [], currentPage, totalPages, totalCount }
        state.items = action.payload.notifications;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // fetchUnreadCount
      .addCase(fetchUnreadCount.pending, (state) => {
        state.unreadCountStatus = 'loading';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCountStatus = 'succeeded';
        state.unreadCount = action.payload;
        state.unreadCountError = null;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.unreadCountStatus = 'failed';
        state.unreadCountError = action.payload;
      })
      // markNotificationAsRead
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const itemIndex = state.items.findIndex(item => item.id === notificationId);
        if (itemIndex !== -1) {
          state.items[itemIndex].isRead = true;
        }
        // unreadCount is updated by fetchUnreadCount thunk
      })
      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items.forEach(item => item.isRead = true);
        // unreadCount is updated by fetchUnreadCount thunk
      });
  },
});

export const { resetNotifications } = notificationsSlice.actions;

// Selectors
export const selectAllNotifications = (state) => state.notifications.items;
export const selectUnreadNotificationCount = (state) => state.notifications.unreadCount;
export const selectNotificationsStatus = (state) => state.notifications.status;
export const selectNotificationsError = (state) => state.notifications.error;

// Memoize selector
export const selectNotificationsPagination = createSelector(
  (state) => state.notifications.currentPage,
  (state) => state.notifications.totalPages,
  (state) => state.notifications.totalCount,
  (currentPage, totalPages, totalCount) => ({
    currentPage,
    totalPages,
    totalCount,
  })
);

export default notificationsSlice.reducer;
