import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Notification } from '../../types';
import api from '../../services/api';

// ─── State ────────────────────────────────────────────────────────────────────

interface NotificationsState {
  list: Notification[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  list: [],
  loading: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/** Lấy thông báo của user: GET /notifications?userId=... */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await api.getNotificationsByUser(userId);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Không thể tải thông báo'
      );
    }
  }
);

/** Đánh dấu đã đọc: PATCH /notifications/:id */
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      return await api.markNotificationAsRead(notificationId);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Không thể cập nhật thông báo'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const idx = state.list.findIndex((n) => n._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export const { clearError } = notificationsSlice.actions;

/** Selector: số thông báo chưa đọc */
export const selectUnreadCount = (state: { notifications: NotificationsState }) =>
  state.notifications.list.filter((n) => !n.isRead).length;

export default notificationsSlice.reducer;
