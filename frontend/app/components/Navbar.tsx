'use client';

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Globe, Eye, EyeOff, Loader2, Users } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";

// Import Redux Actions and Firebase Context
import { selectuser, login, logout } from "../../Feature/userSlice"; 
import { auth, provider } from "../../app/firebase/firebase"; // Ensure this matches your path
import { signInWithPopup, signOut } from "firebase/auth";
import i18n from "../../i18n"; 

export default function Navbar() {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();

  // Custom Auth Form Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Language & OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingLang, setPendingLang] = useState("");
  const [otpError, setOtpError] = useState("");

  // --- GOOGLE SIGN IN (FIREBASE) ---
const handleGoogleSignIn = async () => {
  try {
    console.log("STEP 1: Google button clicked");

    setAuthLoading(true);

    const result = await signInWithPopup(auth, provider);

    console.log("STEP 2: Firebase login success", result.user);

    const fbUser = result.user;

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/google-login`,
      {
        email: fbUser.email,
        photo: fbUser.photoURL,
      }
    );

    console.log("STEP 3: Backend response", res.data);

    if (res.data.success) {
      localStorage.setItem("token", res.data.token);

      console.log(
        "STEP 4: TOKEN SAVED",
        localStorage.getItem("token")
      );

      dispatch(login(res.data.user));

      toast.success("Logged in successfully!");
      setShowAuthModal(false);
    }
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
  } finally {
    setAuthLoading(false);
  }
};
  // --- CUSTOM EMAIL & PASSWORD AUTH (BACKEND API) ---
  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    setAuthLoading(true);
    const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        email: authEmail,
        password: authPassword,
      });

      if (res.data.success) {
        toast.success(isRegisterMode ? "Registered successfully!" : "Logged in successfully!");
        
        // Dispatch structured custom backend user data to Redux
        dispatch(login(res.data.user)); 
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        
        setShowAuthModal(false);
        setAuthEmail("");
        setAuthPassword("");
      } else {
        toast.error(res.data.message || "Authentication failed");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // --- UNIFIED GLOBAL LOGOUT ---
  const handlelogout = async () => {
    try {
      // 1. Sign out from Firebase session space if active
      await signOut(auth);

      // 2. Alert the native express framework server boundary 
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`);
      } catch (err) {
        // Fallback catch if express connection is cycling offline
      }
      
      // 3. Clear browser local tokens and Redux engine variables
      localStorage.removeItem("token");
localStorage.removeItem("user");

dispatch(logout());
      dispatch(logout());
      
      toast.success("Logged out successfully");
    } catch (error) {
      console.error(error);
      toast.error("Logout failed");
    }
  };

  // Language switch handler
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

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/internship" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm">
              Internships
            </Link>

            <Link href="/job" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm">
              Jobs
            </Link>

            {/* ✨ CONDITIONAL PUBLIC SPACE LINK FOR LOGGED IN USERS ✨ */}
            {user && (
              <Link href="/public-space" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm flex items-center gap-1.5">
                <Users size={16} />
                Public Space
              </Link>
            )}

            <Link href="/forgot-password" className="text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm">
              Forgot Password?
            </Link>

            <Link href="/resume" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
              Build Resume ✨
            </Link>

            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                placeholder="Search opportunities..."
                className="ml-2 bg-transparent outline-none text-sm w-40 lg:w-48 text-black"
              />
            </div>
            
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
                {/* ✨ AVATAR SHOWING FIRST LETTER OF EMAIL ✨ */}
                <Link href="/profile" className="flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-blue-600 border border-blue-700 text-white font-bold text-sm flex items-center justify-center uppercase shadow-sm select-none hover:bg-blue-700 transition-colors">
                    {user.email ? user.email[0] : "U"}
                  </div>
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
                  onClick={() => { setIsRegisterMode(false); setShowAuthModal(true); }}
                  className="border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Sign In
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

      {/* --- Auth Modal with both Form & Firebase Google Options --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-2xl border max-w-md w-full text-black shadow-xl mx-4 relative">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">
              {isRegisterMode ? "Create an Account" : "Welcome Back"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {isRegisterMode ? "Sign up below or use your Google profile." : "Log in below or access instantly with Google."}
            </p>

            {/* Google Social Button */}
            <button
              type="button"
              disabled={authLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 transition-colors font-medium rounded-lg py-2.5 text-sm text-gray-700 mb-4 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.052 14.914 0 12 0 7.354 0 3.307 2.67 1.242 6.55l4.024 3.215z"
                />
                <path
                  fill="#4285F4"
                  d="M23.491 12.275c0-.796-.072-1.56-.205-2.291H12v4.336h6.441a5.505 5.505 0 01-2.391 3.614v3.004h3.873c2.264-2.086 3.568-5.155 3.568-8.663z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.266 14.235L1.242 17.45A11.934 11.934 0 0012 24c2.914 0 5.643-1.052 7.632-2.855l-3.873-3.004a7.11 7.11 0 01-3.759.988 7.077 7.077 0 01-6.734-4.894z"
                />
                <path
                  fill="#34A853"
                  d="M12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.052 14.914 0 12 0c-4.646 0-8.693 2.67-10.758 6.55l4.024 3.215A7.077 7.077 0 0112 4.909z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center my-4 text-xs text-gray-400">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="px-3 bg-white text-gray-500 uppercase tracking-wider font-semibold">Or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Custom Backend Form */}
            <form onSubmit={handleCustomAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-blue-600 text-black"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {!isRegisterMode && (
                    <Link
                      href="/forgot-password"
                      onClick={() => setShowAuthModal(false)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full border rounded-lg p-2.5 pr-10 text-sm outline-none focus:border-blue-600 text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg py-2.5 transition-colors text-sm shadow-sm flex justify-center items-center gap-2"
              >
                {authLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  isRegisterMode ? "Register Account" : "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">
                {isRegisterMode ? "Already have an account? " : "New to the platform? "}
              </span>
              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-blue-600 hover:underline font-medium"
              >
                {isRegisterMode ? "Sign In Here" : "Create one here"}
              </button>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Language Switch Modal */}
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