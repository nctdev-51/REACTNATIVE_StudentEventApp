import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Registration, CreateRegistrationPayload } from '../../types';
import api from '../../services/api';

// ─── State ────────────────────────────────────────────────────────────────────

interface RegistrationsState {
  /** Danh sách đăng ký của user hiện tại */
  myRegistrations: Registration[];
  loading: boolean;
  /** Loading riêng cho thao tác đăng ký / check-in */
  actionLoading: boolean;
  error: string | null;
}

const initialState: RegistrationsState = {
  myRegistrations: [],
  loading: false,
  actionLoading: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/** Lấy danh sách đăng ký của user: GET /registrations?userId=... */
export const fetchMyRegistrations = createAsyncThunk(
  'registrations/fetchMine',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await api.getRegistrationsByUser(userId);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Không thể tải danh sách đăng ký'
      );
    }
  }
);

/** Đăng ký tham gia sự kiện: POST /registrations */
export const registerForEvent = createAsyncThunk(
  'registrations/register',
  async (payload: CreateRegistrationPayload, { rejectWithValue }) => {
    try {
      return await api.registerEvent(payload);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Đăng ký thất bại'
      );
    }
  }
);

/** Huỷ đăng ký: PATCH /registrations/:id  { status: "cancelled" } */
export const cancelMyRegistration = createAsyncThunk(
  'registrations/cancel',
  async (registrationId: string, { rejectWithValue }) => {
    try {
      return await api.cancelRegistration(registrationId);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Huỷ đăng ký thất bại'
      );
    }
  }
);

/** Check-in bằng QR: PATCH /registrations/:id  { status: "checked_in", checkInTime } */
export const checkInRegistration = createAsyncThunk(
  'registrations/checkIn',
  async (registrationId: string, { rejectWithValue }) => {
    try {
      return await api.checkIn(registrationId);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Check-in thất bại'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch my registrations
    builder
      .addCase(fetchMyRegistrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyRegistrations.fulfilled, (state, action) => {
        state.loading = false;
        state.myRegistrations = action.payload;
      })
      .addCase(fetchMyRegistrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Register for event
    builder
      .addCase(registerForEvent.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.myRegistrations.push(action.payload);
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Cancel
    builder
      .addCase(cancelMyRegistration.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(cancelMyRegistration.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.myRegistrations.findIndex(
          (r) => r._id === action.payload._id
        );
        if (idx !== -1) state.myRegistrations[idx] = action.payload;
      })
      .addCase(cancelMyRegistration.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Check-in
    builder
      .addCase(checkInRegistration.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(checkInRegistration.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.myRegistrations.findIndex(
          (r) => r._id === action.payload._id
        );
        if (idx !== -1) state.myRegistrations[idx] = action.payload;
      })
      .addCase(checkInRegistration.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = registrationsSlice.actions;
export default registrationsSlice.reducer;
