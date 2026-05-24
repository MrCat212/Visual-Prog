import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { getCurrentUser, logoutUser } from '@/services/authService';
import type { AuthUser } from '@/services/authService';

type AuthState = {
  user: AuthUser | null;
  isAuthorized: boolean;
};

const savedUser = getCurrentUser();

const initialState: AuthState = {
  user: savedUser,
  isAuthorized: savedUser !== null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthorized = true;
    },

    updateUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthorized = true;
    },

    logout(state) {
      logoutUser();
      state.user = null;
      state.isAuthorized = false;
    },
  },
});

export const { setUser, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;