import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to send reset link");
        return;
      }

      setSuccess(
        data?.message || "If an account exists, a reset link has been sent.",
      );
      setTimeout(() => navigate("/Login"), 2500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f0faf9] overflow-hidden">
      {/* Decorative Background Elements (Matching the image) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-teal-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-teal-100/40 rounded-full blur-[100px]" />

        {/* Simple SVG icons to mimic the background pattern */}
        <span className="absolute top-[20%] right-[30%] text-teal-200 text-4xl opacity-40 font-bold">
          $
        </span>
        <span className="absolute bottom-[20%] left-[20%] text-teal-200 text-6xl opacity-40 font-bold">
          $
        </span>
        <div className="absolute bottom-10 left-10 flex gap-2 items-end opacity-10">
          <div className="w-8 h-20 bg-teal-500 rounded-md"></div>
          <div className="w-8 h-32 bg-teal-500 rounded-md"></div>
          <div className="w-8 h-24 bg-teal-500 rounded-md"></div>
          <div className="w-8 h-40 bg-teal-500 rounded-md"></div>
        </div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl shadow-2xl shadow-teal-900/5 p-10 mx-4">
        {/* Lock Icon Header */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 className="text-center text-[22px] font-bold text-slate-700 tracking-tight">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 leading-relaxed">
          Enter your email to receive a secure password reset link.
        </p>

        <form className="mt-8" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 text-xs text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              {success}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">
              Email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-8 w-full rounded-lg py-2.5 text-[11px] font-medium text-white transition-colors shadow-[0_10px_24px_rgba(16,185,129,0.45)] ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>

          <div className="mt-8 text-center text-[13px] text-slate-400 font-medium">
            Remembered your password?{" "}
            <Link
              to="/Login"
              className="text-[#29ccb1] hover:underline underline-offset-4 ml-1"
            >
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
