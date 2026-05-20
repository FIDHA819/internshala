"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { auth } from "../app/firebase/firebase";
import { login, logout } from "../Feature/userSlice";

export default function AuthListener() {
  const dispatch = useDispatch();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authuser) => {
      if (authuser) {
        dispatch(
          login({
            uid: authuser.uid,
            photo: authuser.photoURL,
            name: authuser.displayName,
            email: authuser.email,
            phoneNumber: authuser.phoneNumber,
          })
        );
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}