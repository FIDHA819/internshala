'use client';

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth, provider } from "../firebase/firebase";
import { Search, Globe } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import axios from "axios";
import { selectuser } from "../../Feature/userSlice";
import i18n from "../../i18n"; // Path to your i18n configuration

export default function Navbar() {
  const user = useSelector(selectuser);

  // Language & OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingLang, setPendingLang] = useState("");
  const [otpError, setOtpError] = useState("");

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

  // Intercept French selection and target logged-in email
  const changeLanguage = async (lang: string) => {
    if (lang === "fr") {
      if (!user?.email) {
        toast.error("Please login to verify email access for French.");
        return;
      }
      setPendingLang("fr");
      setOtpError("");
      setOtpCode("");
      setShowOtpModal(true);

      // Trigger dispatch request to user's registered account address
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/otp/send-otp`, { email: user.email });
        toast.success("OTP sent to your email");
      } catch (err) {
        console.error("Failed to route token dispatch:", err);
        toast.error("Failed to send OTP code.");
      }
    } else {
      i18n.changeLanguage(lang);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // FIX: Changed endpoint to verify-otp instead of re-sending an OTP
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/otp/verify-otp`, { 
        email: user?.email, 
        otp: otpCode 
      });

      if (res.data.success) {
        i18n.changeLanguage(pendingLang);
        setShowOtpModal(false);
        setOtpError("");
        toast.success("Language switched to French!");
      }
    } catch (error: any) {
      setOtpError("Invalid OTP. Please try again.");
      toast.error("Invalid OTP. Please try again.");
    }
  };

  return (
    <nav className="bg-white shadow-md relative z-50">
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
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/internship"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
            >
              Internships
            </Link>

            <Link
              href="/job"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
            >
              Jobs
            </Link>

            {/* ADDED: Forgot Password Link */}
            <Link
              href="/forgot-password"
              className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm"
            >
              Forgot Password?
            </Link>

            {/* Premium Resume Builder Entry Point */}
            <Link
              href="/resume"
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
            >
              Build Resume ✨
            </Link>

            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                placeholder="Search opportunities..."
                className="ml-2 bg-transparent outline-none text-sm w-40 lg:w-48 text-black"
              />
            </div>
            
            {/* Language Selector Element */}
            <div className="flex items-center gap-1 border rounded px-2 py-1 bg-gray-50">
              <Globe size={16} className="text-gray-500" />
              <select 
                onChange={(e) => changeLanguage(e.target.value)} 
                value={i18n.language}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer text-gray-700"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="hi">हिन्दी</option>
                <option value="pt">Português</option>
                <option value="zh">中文</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>

          {/* Auth Controls */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile">
                  <Image
                    src={user?.photo || "/avatar.png"}
                    alt="profile"
                    width={40}
                    height={40}
                    className="rounded-full border border-gray-200"
                  />
                </Link>

                <button
                  onClick={handlelogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlelogin}
                  className="border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continue with Google
                </button>

                <Link
                  href="/adminlogin"
                  className="text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Security Verification Modal Overlay */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl border max-w-sm w-full text-black shadow-xl mx-4">
            <h3 className="text-xl font-bold mb-2">Verify Security Language Shift</h3>
            <p className="text-sm text-gray-600 mb-4">
              An authentication code was targeted to: <span className="font-semibold text-blue-600 break-all">{user?.email}</span>.
            </p>
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full border rounded p-2 text-center text-lg tracking-widest outline-none focus:border-blue-600"
              />
              {otpError && <p className="text-red-500 text-xs font-medium">{otpError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Confirm Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}