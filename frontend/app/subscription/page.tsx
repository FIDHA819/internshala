"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: 0,
    applications: 1,
    color: "border-gray-300",
  },
  {
    id: "bronze",
    name: "Bronze Plan",
    price: 100,
    applications: 3,
    color: "border-amber-500",
  },
  {
    id: "silver",
    name: "Silver Plan",
    price: 300,
    applications: 5,
    color: "border-slate-500",
  },
  {
    id: "gold",
    name: "Gold Plan",
    price: 1000,
    applications: "Unlimited",
    color: "border-yellow-500",
  },
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchPlan = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/subscription/my-plan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCurrentPlan(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPlan();

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (plan: string) => {
    try {
      setLoading(true);

      const orderRes = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/subscription/create-order`,
        { plan },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!orderRes.data.success) {
        toast.error(orderRes.data.message);
        return;
      }

      const { order, amount } = orderRes.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,

        amount: order.amount,

        currency: order.currency,

        name: "Intern Area",

        description: `${plan.toUpperCase()} Subscription`,

        order_id: order.id,

        handler: async function (response: any) {
          try {
            const verifyRes = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/subscription/verify-payment`,
              {
                plan,
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (verifyRes.data.success) {
              toast.success(
                "Subscription activated successfully!"
              );

              fetchPlan();
            }
          } catch (error: any) {
            toast.error(
              error.response?.data?.message ||
                "Payment verification failed"
            );
          }
        },

        prefill: {
          name: "",
          email: "",
        },

        theme: {
          color: "#2563eb",
        },
      };

      const razor = new window.Razorpay(options);

      razor.open();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Unable to create order"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-3 text-black">
          Subscription Plans
        </h1>

        <p className="text-center text-gray-600 mb-10">
          Payments are accepted only between
          <span className="font-semibold text-blue-600">
            {" "}10:00 AM – 11:00 AM IST
          </span>
        </p>

        {currentPlan && (
          <div className="bg-white rounded-xl shadow p-5 mb-10">
            <h3 className="font-bold text-lg text-black">
              Current Subscription
            </h3>

            <p className="mt-2 text-gray-700">
              Plan:
              <span className="font-semibold ml-2">
                {currentPlan.plan || "Free"}
              </span>
            </p>

            <p className="text-gray-700">
              Applications Used:
              <span className="font-semibold ml-2">
                {currentPlan.monthlyApplicationCount}
              </span>
            </p>

            <p className="text-gray-700">
              Limit:
              <span className="font-semibold ml-2">
                {currentPlan.applicationLimit}
              </span>
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-6">

          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg border-2 ${plan.color} p-6`}
            >
              <h2 className="text-2xl font-bold text-black">
                {plan.name}
              </h2>

              <div className="my-5">
                <span className="text-4xl font-bold text-black">
                  ₹{plan.price}
                </span>

                {plan.price > 0 && (
                  <span className="text-gray-500">
                    /month
                  </span>
                )}
              </div>

              <div className="space-y-2 text-gray-700">
                <p>
                  Applications:
                  <strong>
                    {" "}
                    {plan.applications}
                  </strong>
                </p>

                <p>
                  Invoice Email Included
                </p>

                <p>
                  30 Days Validity
                </p>
              </div>
{currentPlan?.plan === plan.id ? (
  <button
    disabled
    className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold"
  >
    Current Plan
  </button>
) : plan.id === "free" ? (
  <button
    disabled
    className="w-full mt-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
  >
    Free Plan
  </button>
) : (
  <button
    disabled={loading}
    onClick={() => handleSubscribe(plan.id)}
    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
  >
    {loading ? "Processing..." : "Subscribe Now"}
  </button>
)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}