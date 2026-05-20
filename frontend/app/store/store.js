import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../../Feature/userSlice";
export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});