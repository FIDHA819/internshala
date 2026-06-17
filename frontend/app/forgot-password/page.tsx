"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { KeyRound, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Auto-redirect countdown block when reset succeeds
  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/"); // Redirects to home page (or change to '/internship')
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/password-reset`,
        { email }
      );

      if (res.data.success !== false) {
        toast.success(res.data.message || "Temporary password sent to email!");
        setIsSuccess(true);
        setEmail("");
      } else {
        toast.error(res.data.message || "Failed to initiate recovery request.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50/50">
      <div className="max-w-md w-full border border-slate-150 p-8 rounded-2xl bg-white shadow-xl transition-all duration-300">
        
        {!isSuccess ? (
          <div className="space-y-6">
            {/* Header Icon & Text */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <KeyRound size={24} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Forgot Password
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                No worries! Enter your account email and we'll send a temporary generated password straight to your inbox.
              </p>
            </div>

            {/* Form Submission */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="border border-slate-300 rounded-xl p-3 w-full outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl px-4 py-3 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Password...
                  </>
                ) : (
                  "Generate New Password"
                )}
              </button>
            </form>

            {/* Action Link Footer */}
            <div className="text-center pt-2 border-t border-slate-100">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
              >
                <ArrowLeft size={14} />
                Back to Opportunities
              </Link>
            </div>
          </div>
        ) : (
          /* Neat Success Layout View state */
          <div className="text-center py-4 space-y-6 animate-fadeIn">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Check Your Inbox!</h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                A newly generated access credential profile key has successfully dropped. Use it to log in immediately.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-w-xs mx-auto flex items-center justify-center gap-3">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <p className="text-xs font-medium text-slate-600">
                Returning to portal homepage in <span className="font-bold text-blue-600 text-sm">{countdown}s</span>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}