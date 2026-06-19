import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  user: any | null;
}

const initialState: UserState = { user: null };

export const userslice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login:  (state, action: PayloadAction<any>) => { state.user = action.payload; },
    logout: (state) => { state.user = null; },
  },
});

export const { login, logout } = userslice.actions;
export const selectuser = (state: any) => state.user.user;
export default userslice.reducer;