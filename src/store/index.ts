import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    // Placeholder reducer until actual feature slices are added.
    // Replace or add your feature slice reducers here (e.g., auth, checkIn, events).
    _placeholder: (state = {}) => state,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

