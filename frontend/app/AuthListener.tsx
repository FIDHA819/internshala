"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { auth } from "../app/firebase/firebase";
import { login, logout } from "../Feature/userSlice";
import axios from "axios";
export default function AuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {

  const token = localStorage.getItem("token");

  if (token) {
    axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).then((res) => {

      dispatch(login(res.data.user));

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

    }).catch(console.error);
  }

}, []);

  return null;
}