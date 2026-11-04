import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Event } from '../../types';
import api from '../../services/api';

// ─── State ───────────────────────────────────────────────────────────────────

interface EventsState {
  list: Event[];
  selectedEvent: Event | null;
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;
  /** Bộ lọc đang áp dụng */
  filter: {
    category: string | null;
    status: string | null;
    searchQuery: string;
  };
}

const initialState: EventsState = {
  list: [],
  selectedEvent: null,
  loading: false,
  loadingDetail: false,
  error: null,
  filter: {
    category: null,
    status: null,
    searchQuery: '',
  },
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/** Lấy danh sách sự kiện: GET /events */
export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async (
    params: { category?: string; status?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await api.getEvents(params);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Không thể tải sự kiện'
      );
    }
  }
);

/** Lấy chi tiết 1 sự kiện: GET /events/:id */
export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await api.getEventById(id);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? 'Không tìm thấy sự kiện'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setFilterCategory(state, action: PayloadAction<string | null>) {
      state.filter.category = action.payload;
    },
    setFilterStatus(state, action: PayloadAction<string | null>) {
      state.filter.status = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.filter.searchQuery = action.payload;
    },
    resetFilter(state) {
      state.filter = { category: null, status: null, searchQuery: '' };
    },
    clearSelectedEvent(state) {
      state.selectedEvent = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch list
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch detail
    builder
      .addCase(fetchEventById.pending, (state) => {
        state.loadingDetail = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setFilterCategory,
  setFilterStatus,
  setSearchQuery,
  resetFilter,
  clearSelectedEvent,
  clearError,
} = eventsSlice.actions;

/** Selector: danh sách sự kiện sau khi áp dụng filter local */
export const selectFilteredEvents = (state: {
  events: EventsState;
}) => {
  const { list, filter } = state.events;
  return list.filter((evt) => {
    const matchCategory =
      !filter.category || evt.category === filter.category;
    const matchStatus = !filter.status || evt.status === filter.status;
    const matchSearch =
      !filter.searchQuery ||
      evt.title.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
      evt.location?.toLowerCase().includes(filter.searchQuery.toLowerCase());
    return matchCategory && matchStatus && matchSearch;
  });
};

export default eventsSlice.reducer;
