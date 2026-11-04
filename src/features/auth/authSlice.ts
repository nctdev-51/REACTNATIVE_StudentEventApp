import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthCredentials, RegisterPayload } from '../../types';
import api from '../../services/api';
import { getDbUsers } from '../../data/dbService';

// ─── State ──────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

// ─── Async Thunks ────────────────────────────────────────────────────────────

/**
 * Đăng nhập: POST /auth/login → { token, user }
 * Nếu backend chưa có /auth hoặc offline, fallback kiểm tra từ db.json
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: AuthCredentials, { rejectWithValue }) => {
    try {
      return await api.login(credentials);
    } catch (err: any) {
      // Fallback xác thực trực tiếp qua dữ liệu db.json nếu server offline
      try {
        const dbUsers = getDbUsers();
        const matched = dbUsers.find(
          (u) =>
            u.email?.toLowerCase() === credentials.email?.toLowerCase().trim() &&
            u.password === credentials.password
        );
        if (matched) {
          return {
            token: 'jwt_token_db_' + (matched.id || matched._id),
            user: {
              _id: matched.id || matched._id,
              studentId: matched.studentId || 'SV01',
              fullName: matched.name || matched.fullName || 'Nguyễn Văn A',
              email: matched.email,
              point: matched.point ?? 120,
              role: matched.role || 'student',
              faculty: matched.faculty || 'Khoa Công nghệ thông tin',
              phone: matched.phone || '0901234567',
              avatarUrl: matched.avatarUrl || matched.avatar,
              isActive: true,
            },
          };
        }
      } catch (dbErr) {
        // Bỏ qua lỗi fallback
      }

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
