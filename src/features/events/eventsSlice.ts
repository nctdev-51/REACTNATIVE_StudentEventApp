import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";

import { Event } from "../../types";
import api from "../../services/api";
import {
  getCurrentSemesterId,
  getEventSemesterId,
} from "../../utils/semester";

interface EventsState {
  list: Event[];
  selectedEvent: Event | null;
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;

  filter: {
    category: string | null;
    faculty: string | null;
    date: string | null;
    status: string | null;
    searchQuery: string;
    /** Học kỳ đang xem — null nghĩa là tất cả học kỳ */
    semesterId: string | null;
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
    faculty: null,
    date: null,
    status: null,
    searchQuery: "",
    semesterId: getCurrentSemesterId(),
  },
};

// Lấy danh sách sự kiện
export const fetchEvents = createAsyncThunk(
  "events/fetchAll",
  async (
    params:
      | { category?: string; status?: string }
      | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await api.getEvents(params);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ??
          err?.message ??
          "Không thể tải sự kiện"
      );
    }
  }
);

// Lấy chi tiết sự kiện
export const fetchEventById = createAsyncThunk(
  "events/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      return await api.getEventById(id);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ??
          err?.message ??
          "Không tìm thấy sự kiện"
      );
    }
  }
);

const eventsSlice = createSlice({
  name: "events",
  initialState,

  reducers: {
    setFilterCategory(
      state,
      action: PayloadAction<string | null>
    ) {
      state.filter.category = action.payload;
    },

    setFilterFaculty(
      state,
      action: PayloadAction<string | null>
    ) {
      state.filter.faculty = action.payload;
    },

    setFilterDate(
      state,
      action: PayloadAction<string | null>
    ) {
      state.filter.date = action.payload;
    },

    setFilterStatus(
      state,
      action: PayloadAction<string | null>
    ) {
      state.filter.status = action.payload;
    },

    setFilterSemester(
      state,
      action: PayloadAction<string | null>
    ) {
      state.filter.semesterId = action.payload;
    },

    setSearchQuery(
      state,
      action: PayloadAction<string>
    ) {
      state.filter.searchQuery = action.payload;
    },

    resetFilter(state) {
      state.filter = {
        category: null,
        faculty: null,
        date: null,
        status: null,
        searchQuery: "",
        semesterId: getCurrentSemesterId(),
      };
    },

    clearSelectedEvent(state) {
      state.selectedEvent = null;
    },

    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Danh sách
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
      })

      // Chi tiết
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
  setFilterFaculty,
  setFilterDate,
  setFilterStatus,
  setFilterSemester,
  setSearchQuery,
  resetFilter,
  clearSelectedEvent,
  clearError,
} = eventsSlice.actions;

// Danh sách sau khi lọc (memoized bằng createSelector để tránh re-render không cần thiết)
export const selectFilteredEvents = createSelector(
  [
    (state: { events: EventsState }) => state.events.list,
    (state: { events: EventsState }) => state.events.filter,
  ],
  (list, filter) => {
    return list.filter((event) => {
      // Ẩn sự kiện nếu đã bị Admin ẩn khỏi sinh viên
      if (event.isHidden) return false;

      // Lọc học kỳ: chỉ hiện sự kiện thuộc học kỳ đang chọn
      if (filter.semesterId && getEventSemesterId(event) !== filter.semesterId) {
        return false;
      }

      const matchCategory =
        !filter.category || event.category === filter.category;

      const matchFaculty =
        !filter.faculty || event.faculty === filter.faculty;

      const matchStatus =
        !filter.status || event.status === filter.status;

      // Tìm kiếm
      const search = filter.searchQuery.trim().toLowerCase();

      const matchSearch =
        !search ||
        event.title.toLowerCase().includes(search) ||
        event.location.toLowerCase().includes(search);

      // Lọc ngày
      let matchDate = true;

      if (filter.date) {
        const eventDate = new Date(event.time.start);
        const today = new Date();

        if (filter.date === "today") {
          matchDate =
            eventDate.getDate() === today.getDate() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getFullYear() === today.getFullYear();
        } else if (filter.date === "week") {
          const startWeek = new Date(today);
          const day = (today.getDay() + 6) % 7;
          startWeek.setDate(today.getDate() - day);
          startWeek.setHours(0, 0, 0, 0);

          const endWeek = new Date(startWeek);
          endWeek.setDate(startWeek.getDate() + 7);

          matchDate = eventDate >= startWeek && eventDate < endWeek;
        } else if (filter.date === "month") {
          matchDate =
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getFullYear() === today.getFullYear();
        } else {
          matchDate = event.time.start.slice(0, 10) === filter.date;
        }
      }

      return (
        matchCategory &&
        matchFaculty &&
        matchDate &&
        matchStatus &&
        matchSearch
      );
    });
  }
);

export default eventsSlice.reducer;