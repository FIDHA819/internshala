"use client";

import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "../../Feature/userSlice";
import { toast } from "react-toastify";

export default function ResumePage() {
  const user = useSelector(selectuser);

  // Core Form State
 const [form, setForm] = useState({
  name: "",
  email: "",
  phone: "",
  address: "",
  qualification: "",
  experience: "",
  skills: "",
});

const [photoFile, setPhotoFile] =
  useState<File | null>(null);
  // Interface Workflow Control
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
const handlePhotoUpload = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  setPhotoFile(file);

  toast.success(
    "Photo selected successfully!"
  );
};

  // Dynamically load external payment scripts
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Step 1: Initiate premium request & dispatch OTP confirmation token
  const handleInitiateFlow = async () => {
    if (!user) {
      toast.error("Please login to create a premium profile resume.");
      return;
    }
    if (!form.name || !form.email || !form.qualification) {
      toast.error("Please enter mandatory values (Name, Email, Qualifications).");
      return;
    }

    setLoading(true);
    try {
      // Directs token dispatch to the user's registered system address
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/otp/send-otp`, { 
        email: user.email 
      });
      toast.success("Security verification OTP dispatched to your registered email.");
      setStep("otp");
    } catch (err) {
      toast.error("Could not complete verification dispatch step.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Formally handle token evaluation
  const handleVerifyOtpAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast.error("Please provide a complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/otp/verify-otp`, {
        email: user.email,
        otp: otpCode,
      });

      if (res.data.success) {
        toast.success("Security verification cleared! Directing to payment...");
        launchRazorpayGateway();
      }
    } catch (error) {
      toast.error("Invalid verification code. Please confirm data entry.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle Gateway Window Options
  const launchRazorpayGateway = async () => {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Failed to call payment modules. Are you connected to the network?");
      return;
    }

    try {
      // Calls your endpoint to initialize order configurations 
    const token = localStorage.getItem("token");

const orderRes = await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/resume/create-order`,
  {},
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
      const { id: order_id, currency, amount } = orderRes.data.order;

      const options = {
         key: process.env.NEXT_PUBLIC_RAZORPAY_KEY, 
        amount: amount,
        currency: currency,
        name: "Intern Area Pro",
        description: "Premium Plan - Resume Profile Automation",
        order_id: order_id,
        handler: async function (response: any) {
          try {
            // Securely transfer validated details to be attached directly onto profile model
           const formData = new FormData();

formData.append("uid", user._id);

formData.append("name", form.name);

formData.append("email", form.email);

formData.append("phone", form.phone);

formData.append("address", form.address);

formData.append(
  "qualification",
  form.qualification
);

formData.append(
  "experience",
  form.experience
);

formData.append(
  "skills",
  form.skills
);

if (photoFile) {
  formData.append(
    "photo",
    photoFile
  );
}

formData.append(
  "razorpay_payment_id",
  response.razorpay_payment_id
);

formData.append(
  "razorpay_order_id",
  response.razorpay_order_id
);

formData.append(
  "razorpay_signature",
  response.razorpay_signature
);

const token = localStorage.getItem("token");

const saveRes = await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/resume/verify-and-save`,
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
);
            if (saveRes.data.success) {
              toast.success("Resume built and successfully attached to profile for all future applications!");
              setStep("form");
              // Resetting parameters clean
          setForm({
  name: "",
  email: "",
  phone: "",
  address: "",
  qualification: "",
  experience: "",
  skills: "",
});

setPhotoFile(null);
            }
          } catch (error) {
            toast.error("Failed structural authenticity verification check.");
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: "#2563eb",
        },
      };

      const paymentWindowInstance = new (window as any).Razorpay(options);
      paymentWindowInstance.open();

    } catch (error) {
      toast.error("Failed initialization of authorization parameters.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-12 p-8 bg-white border rounded-2xl shadow-sm text-gray-800">
      <div className="border-b pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Premium Resume Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Generate a professional document instantly attached to your profile</p>
        </div>
        <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">
          Premium Plan (₹50)
        </span>
      </div>

      {step === "form" ? (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contact Email *</label>
              <input
                type="email"
                placeholder="johndoe@example.com"
                className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Permanent Address</label>
              <input
                type="text"
                placeholder="City, State, Country"
                className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Profile Photo Upload</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              onChange={handlePhotoUpload}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Educational Qualifications *</label>
            <textarea
              placeholder="List degrees, certifications, or academic histories..."
              className="w-full border rounded-lg p-2.5 h-24 outline-none focus:border-blue-500 transition-colors"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Work / Project Experience</label>
            <textarea
              placeholder="Outline roles, descriptions, internships, or built platform records..."
              className="w-full border rounded-lg p-2.5 h-24 outline-none focus:border-blue-500 transition-colors"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Skills Area</label>
            <textarea
              placeholder="React, ExpressJS, MongoDB, Product Design, Clean Architecture..."
              className="w-full border rounded-lg p-2.5 h-20 outline-none focus:border-blue-500 transition-colors"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
          </div>

          <button
            onClick={handleInitiateFlow}
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-sm transition-colors"
          >
            {loading ? "Processing..." : "Verify Identity & Pay ₹50"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerifyOtpAndProceed} className="py-8 text-center space-y-4 max-w-md mx-auto">
          <p className="text-sm text-gray-600 leading-relaxed">
            To fulfill transactions under your premium account tier safely, enter the 6-digit code routed to: <br />
            <span className="font-semibold text-blue-600 break-all">{user?.email}</span>
          </p>
          <input
            type="text"
            placeholder="000000"
            maxLength={6}
            className="border p-3 w-44 text-center text-2xl tracking-widest outline-none font-mono rounded-xl focus:border-blue-500"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
          />
          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-sm transition-colors"
            >
              {loading ? "Validating..." : "Confirm Code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}