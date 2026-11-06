import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthCredentials, RegisterPayload } from '../../types';
import api from '../../services/api';
import { loadAuthSession } from '../../services/authSession';

// ─── State ──────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isHydrating: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  isHydrating: true,
  error: null,
  isAuthenticated: false,
};

// ─── Async Thunks ────────────────────────────────────────────────────────────

/** Restore a previously validated session before choosing the initial navigator. */
export const hydrateSession = createAsyncThunk(
  'auth/hydrateSession',
  async () => loadAuthSession()
);

/**
 * Đăng nhập: POST /auth/login → { token, user }
 * Credentials are always validated by the configured API (or explicit mock mode).
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: AuthCredentials, { rejectWithValue }) => {
    try {
      return await api.login(credentials);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Đăng nhập thất bại'
      );
    }
  }
);

/**
 * Đăng ký tài khoản: POST /auth/register → { token, user }
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      return await api.register(payload);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Đăng ký thất bại'
      );
    }
  }
);

/**
 * Lấy thông tin profile user đang đăng nhập: GET /users/me
 */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getCurrentUser();
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Không thể tải profile'
      );
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Đăng xuất — xoá toàn bộ auth state */
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    /** Xoá thông báo lỗi */
    clearError(state) {
      state.error = null;
    },
    /** Khôi phục auth từ AsyncStorage khi app khởi động */
    restoreSession(
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isHydrating = false;
    },
    /** Cập nhật thông tin user sau khi chỉnh sửa profile */
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(hydrateSession.fulfilled, (state, action) => {
        state.isHydrating = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(hydrateSession.rejected, (state) => {
        // A failed local read must not prevent a user from reaching Login.
        state.isHydrating = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, restoreSession, updateUser } =
  authSlice.actions;
export default authSlice.reducer;
