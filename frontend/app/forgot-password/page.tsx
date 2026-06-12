"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { KeyRound, ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

      toast.success(res.data.message || "Reset link sent successfully!");
      setEmail(""); // Clear input on success
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50/50">
      <div className="max-w-md w-full border border-gray-200 p-8 rounded-2xl bg-white shadow-xl space-y-6">
        
        {/* Header Icon & Text */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500">
            No worries! Enter your email and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* Form Submission */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="name@example.com"
              className="border border-gray-300 rounded-lg p-2.5 w-full outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg px-4 py-2.5 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending Instructions...
              </>
            ) : (
              "Generate Password Reset"
            )}
          </button>
        </form>

        {/* Action Link Footer */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}