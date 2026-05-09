import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { mockUser } from '@/services/mockUser';
import type { MockUser } from '@/services/mockUser';

type AuthState = {
  user: MockUser | null;
  isAuthorized: boolean;
};

const initialState: AuthState = {
  user: mockUser,
  isAuthorized: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<MockUser>) {
      state.user = action.payload;
      state.isAuthorized = true;
    },

    logout(state) {
      state.user = null;
      state.isAuthorized = false;
    },
  },
});

export const { setUser, logout } = authSlice.actions;

export default authSlice.reducer;