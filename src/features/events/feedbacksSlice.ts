import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Feedback, CreateFeedbackPayload } from '../../types';
import api from '../../services/api';

// ─── State ────────────────────────────────────────────────────────────────────

interface FeedbacksState {
  /** Feedbacks của sự kiện đang xem */
  eventFeedbacks: Feedback[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: FeedbacksState = {
  eventFeedbacks: [],
  loading: false,
  submitting: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/** Lấy feedbacks của sự kiện: GET /feedbacks?eventId=... */
export const fetchFeedbacksByEvent = createAsyncThunk(
  'feedbacks/fetchByEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      return await api.getFeedbacksByEvent(eventId);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Không thể tải đánh giá'
      );
    }
  }
);

/** Gửi feedback: POST /feedbacks */
export const submitFeedback = createAsyncThunk(
  'feedbacks/submit',
  async (payload: CreateFeedbackPayload, { rejectWithValue }) => {
    try {
      return await api.createFeedback(payload);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Gửi đánh giá thất bại'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const feedbacksSlice = createSlice({
  name: 'feedbacks',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearEventFeedbacks(state) {
      state.eventFeedbacks = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchFeedbacksByEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedbacksByEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.eventFeedbacks = action.payload;
      })
      .addCase(fetchFeedbacksByEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Submit
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.submitting = false;
        state.eventFeedbacks.unshift(action.payload);
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearEventFeedbacks } = feedbacksSlice.actions;
export default feedbacksSlice.reducer;
