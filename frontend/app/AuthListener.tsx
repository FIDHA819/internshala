"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { login } from "../Feature/userSlice";
import axios from "axios";

export default function AuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          dispatch(login(res.data.user));
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      })
      .catch((err) => {
        console.error("Session restore failed:", err.response?.data?.message);
        // Token invalid/expired — clear it
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  }, []);

  return null;
}