'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { auth, provider } from "../firebase/firebase";
import { Search } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "../../Feature/userSlice";

export default function Navbar() {
  const user = useSelector(selectuser);

  const handlelogin = async () => {
    try {
      await signInWithPopup(auth, provider);

      toast.success("Logged in successfully");
    } catch (error) {
      console.error(error);
      toast.error("Login failed");
    }
  };

  const handlelogout = async () => {
    try {
      await signOut(auth);

      toast.success("Logged out");
    } catch (error) {
      console.error(error);
      toast.error("Logout failed");
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/">
            <Image
              src="/logo.png"
              alt="logo"
              width={160}
              height={60}
              className="object-contain"
            />
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">

            <Link
              href="/internship"
              className="text-gray-700 hover:text-blue-600"
            >
              Internships
            </Link>

            <Link
              href="/job"
              className="text-gray-700 hover:text-blue-600"
            >
              Jobs
            </Link>

            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search size={16} className="text-gray-400" />

              <input
                placeholder="Search opportunities..."
                className="ml-2 bg-transparent outline-none text-sm w-48"
              />
            </div>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-4">

            {user ? (
              <>
                <Link href="/profile">
                  <Image
                    src={user?.photo || "/avatar.png"}
                    alt="profile"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </Link>

                <button
                  onClick={handlelogout}
                  className="px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlelogin}
                  className="border rounded-lg px-4 py-2 hover:bg-gray-50"
                >
                  Continue with Google
                </button>

                <Link
                  href="/adminlogin"
                  className="text-gray-700"
                >
                  Admin
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}