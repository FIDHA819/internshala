'use client';

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Globe, Eye, EyeOff, Loader2, Users } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { selectuser, login, logout } from "../../Feature/userSlice";
import { auth, provider } from "../firebase/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import i18n from "../../i18n";

export default function Navbar() {
  const user     = useSelector(selectuser);
  const dispatch = useDispatch();

  // Auth modal
  const [showAuthModal,   setShowAuthModal]   = useState(false);
  const [isRegisterMode,  setIsRegisterMode]  = useState(false);
  const [authEmail,       setAuthEmail]       = useState("");
  const [authPassword,    setAuthPassword]    = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [authLoading,     setAuthLoading]     = useState(false);

  // Login OTP modal (Chrome / mobile-window gate)
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [loginOtp,          setLoginOtp]          = useState("");
  const [pendingEmail,      setPendingEmail]      = useState("");
  const [otpLoading,        setOtpLoading]        = useState(false);

  // Language OTP modal (French gate)
  const [showLangOtpModal, setShowLangOtpModal] = useState(false);
  const [langOtpCode,      setLangOtpCode]      = useState("");
  const [pendingLang,      setPendingLang]      = useState("");
  const [langOtpError,     setLangOtpError]     = useState("");

  // ── Shared: save user after successful auth ──────────────────────────────────
  const finaliseLogin = (userData: any, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    dispatch(login(userData));
    setShowAuthModal(false);
    setShowLoginOtpModal(false);
    setAuthEmail("");
    setAuthPassword("");
    setLoginOtp("");
    setPendingEmail("");
  };

  // ── OTP verification (shared for Chrome login & Google login) ────────────────
  const verifyLoginOtp = async () => {
    if (loginOtp.length < 6) return toast.error("Enter the 6-digit code.");
    setOtpLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-login-otp`, {
        email: pendingEmail,
        otp:   loginOtp,
      });
      if (res.data.success) {
        finaliseLogin(res.data.user, res.data.token);
        toast.success("Logged in successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Google sign-in ───────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-login`, {
        email: fbUser.email,
        photo: fbUser.photoURL,
      });

      if (res.data.requiresOtp) {
        setPendingEmail(fbUser.email!);
        setShowLoginOtpModal(true);
        toast.success("Verification code sent to your email.");
        return;
      }
      if (res.data.success) {
        finaliseLogin(res.data.user, res.data.token);
        toast.success("Logged in with Google!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Google sign-in failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Email / password auth ────────────────────────────────────────────────────
  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return toast.error("Please fill in all fields.");

    setAuthLoading(true);
    const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        email:    authEmail,
        password: authPassword,
      });

      if (res.data.requiresOtp) {
        setPendingEmail(authEmail);
        setShowLoginOtpModal(true);
        toast.success("Verification code sent to your email.");
        return;
      }
      if (res.data.success) {
        finaliseLogin(res.data.user, res.data.token);
        toast.success(isRegisterMode ? "Account created!" : "Logged in successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await signOut(auth).catch(() => {});
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`).catch(() => {});
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch(logout());
      toast.success("Logged out successfully.");
    } catch {
      toast.error("Logout failed.");
    }
  };

  // ── Language change (French requires OTP) ────────────────────────────────────
  const changeLanguage = async (lang: string) => {
    if (lang === "fr") {
      if (!user?.email) {
        toast.error("Please log in to switch to French.");
        return;
      }
      setPendingLang("fr");
      setLangOtpError("");
      setLangOtpCode("");
      setShowLangOtpModal(true);
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/otp/send-otp`, { email: user.email });
        toast.success("OTP sent to your email.");
      } catch {
        toast.error("Failed to send OTP.");
      }
    } else {
      i18n.changeLanguage(lang);
    }
  };

  const handleLangOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/otp/verify-otp`, {
        email: user?.email,
        otp:   langOtpCode,
      });
      if (res.data.success) {
        i18n.changeLanguage(pendingLang);
        setShowLangOtpModal(false);
        setLangOtpError("");
        toast.success("Language switched to French!");
      }
    } catch {
      setLangOtpError("Invalid OTP. Please try again.");
    }
  };

  return (
    <nav className="bg-white shadow-md relative z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/">
            <Image src="/logo.png" alt="logo" width={160} height={60} className="object-contain" />
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/internship" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">Internships</Link>
            <Link href="/job"        className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">Jobs</Link>

            {user && (
              <>
                <Link href="/public-space" className="text-gray-700 hover:text-blue-600 font-medium text-sm flex items-center gap-1.5 transition-colors">
                  <Users size={16} /> Public Space
                </Link>
                <Link href="/subscription" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">Plans</Link>
              </>
            )}

            <Link href="/forgot-password" className="text-gray-500 hover:text-blue-600 font-medium text-sm transition-colors">Forgot Password?</Link>
            <Link href="/resume" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
              Build Resume ✨
            </Link>

            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search size={16} className="text-gray-400" />
              <input placeholder="Search opportunities..." className="ml-2 bg-transparent outline-none text-sm w-40 lg:w-48 text-black" />
            </div>

            <div className="flex items-center gap-1 border rounded px-2 py-1 bg-gray-50">
              <Globe size={16} className="text-gray-500" />
              <select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer text-gray-700">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="hi">हिन्दी</option>
                <option value="pt">Português</option>
                <option value="zh">中文</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>

          {/* Auth controls */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile">
                  <div className="h-10 w-10 rounded-full bg-blue-600 border border-blue-700 text-white font-bold text-sm flex items-center justify-center uppercase shadow-sm hover:bg-blue-700 transition-colors select-none">
                    {user.photo
                      ? <img src={user.photo} alt="" className="w-full h-full rounded-full object-cover" />
                      : (user.email?.[0] ?? "U")}
                  </div>
                </Link>
                <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setIsRegisterMode(false); setShowAuthModal(true); }}
                  className="border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Sign In
                </button>
                <Link href="/adminlogin" className="text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors">Admin</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Auth Modal ─────────────────────────────────────────────────────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-2xl border max-w-md w-full text-black shadow-xl mx-4 relative">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">
              {isRegisterMode ? "Create an Account" : "Welcome Back"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {isRegisterMode ? "Sign up below or use Google." : "Log in below or use Google."}
            </p>

            {/* Google button */}
            <button type="button" disabled={authLoading} onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 transition-colors font-medium rounded-lg py-2.5 text-sm text-gray-700 mb-4 shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.052 14.914 0 12 0 7.354 0 3.307 2.67 1.242 6.55l4.024 3.215z"/>
                <path fill="#4285F4" d="M23.491 12.275c0-.796-.072-1.56-.205-2.291H12v4.336h6.441a5.505 5.505 0 01-2.391 3.614v3.004h3.873c2.264-2.086 3.568-5.155 3.568-8.663z"/>
                <path fill="#FBBC05" d="M5.266 14.235L1.242 17.45A11.934 11.934 0 0012 24c2.914 0 5.643-1.052 7.632-2.855l-3.873-3.004a7.11 7.11 0 01-3.759.988 7.077 7.077 0 01-6.734-4.894z"/>
                <path fill="#34A853" d="M12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.052 14.914 0 12 0c-4.646 0-8.693 2.67-10.758 6.55l4.024 3.215A7.077 7.077 0 0112 4.909z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center my-4 text-xs text-gray-400">
              <div className="flex-grow border-t border-gray-200" />
              <span className="px-3 bg-white text-gray-500 uppercase tracking-wider font-semibold">Or</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <form onSubmit={handleCustomAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" required placeholder="name@example.com" value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-blue-600 text-black" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {!isRegisterMode && (
                    <Link href="/forgot-password" onClick={() => setShowAuthModal(false)} className="text-xs text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full border rounded-lg p-2.5 pr-10 text-sm outline-none focus:border-blue-600 text-black" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={authLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg py-2.5 transition-colors text-sm shadow-sm flex justify-center items-center gap-2">
                {authLoading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : (isRegisterMode ? "Register Account" : "Sign In")}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">{isRegisterMode ? "Already have an account? " : "New here? "}</span>
              <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-blue-600 hover:underline font-medium">
                {isRegisterMode ? "Sign In" : "Create one"}
              </button>
            </div>

            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
          </div>
        </div>
      )}

      {/* ── Login OTP Modal (Chrome / mobile gate) ─────────────────────────────── */}
      {showLoginOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full mx-4 shadow-xl text-black">
            <h3 className="text-xl font-bold mb-2">Verify Your Identity</h3>
            <p className="text-sm text-gray-500 mb-6">
              A 6-digit code was sent to <span className="font-semibold text-blue-600">{pendingEmail}</span>.
            </p>
            <input
              type="text" maxLength={6} placeholder="000000" value={loginOtp}
              onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full border rounded-xl p-3 text-center text-2xl tracking-widest font-mono outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowLoginOtpModal(false); setLoginOtp(""); }}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={verifyLoginOtp} disabled={otpLoading || loginOtp.length < 6}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {otpLoading ? <><Loader2 size={14} className="animate-spin" /> Verifying...</> : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Language OTP Modal (French gate) ────────────────────────────────────── */}
      {showLangOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full mx-4 text-black shadow-xl">
            <h3 className="text-xl font-bold mb-2">Verify Language Change</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the code sent to <span className="font-semibold text-blue-600">{user?.email}</span>.
            </p>
            <form onSubmit={handleLangOtpVerify} className="space-y-4">
              <input type="text" placeholder="Enter 6-digit OTP" maxLength={6} value={langOtpCode}
                onChange={(e) => setLangOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full border rounded p-2 text-center text-lg tracking-widest outline-none focus:border-blue-600" />
              {langOtpError && <p className="text-red-500 text-xs">{langOtpError}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowLangOtpModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 text-sm font-medium hover:bg-gray-300 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}