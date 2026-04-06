import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

export default function NewPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/new-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to reset password.");
        return;
      }

      setSuccess("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/Login"), 1500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f0faf9] overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[12%] left-[8%] w-72 h-72 bg-emerald-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[8%] right-[8%] w-80 h-80 bg-cyan-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[460px] rounded-3xl bg-white p-10 shadow-2xl shadow-teal-900/5">
        <h2 className="text-center text-[22px] font-bold text-slate-700 tracking-tight">
          Enter OTP and new password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 leading-relaxed">
          Use the OTP from your email to finish resetting your password.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              {success}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-50 transition-all"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">
              OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm tracking-[0.35em] text-slate-700 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-50 transition-all"
              placeholder="123456"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg py-3 text-sm font-medium text-white transition-colors shadow-[0_10px_24px_rgba(16,185,129,0.45)] ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Saving..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
