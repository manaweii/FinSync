import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const API_URL = "http://localhost:5000/api";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // simple email regex check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Login failed");
        return;
      }

      // Use zustand store to persist and broadcast auth state
      if (data.token || data.user) {
        console.log("Login successful, setting auth state:", { user: data.user });
        setAuth(data.token || null, data.user || null);
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 flex items-center justify-center">
      <div className="max-w-6xl w-full flex items-center justify-center">
        <div className="w-[1050px] flex gap-16">
          {/* LEFT PANEL */}
          <div className="flex-1 pt-4">
            <h1 className="text-[32px] leading-tight font-semibold text-slate-900 mb-2">
              Your financial insights,
              <br />
              <span className="text-emerald-600">all in one place</span>
            </h1>
            <p className="text-[12px] text-slate-500 mb-6 max-w-md">
              Track, analyze, and optimize your finances with powerful analytics.
            </p>

            <div className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(15,118,110,0.18)] p-4 w-[420px]">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Revenue</p>
                  <p className="text-[16px] font-semibold text-slate-900">
                    NPR 1.24L
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Expenses</p>
                  <p className="text-[16px] font-semibold text-slate-900">
                    NPR 78.2K
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Cash Flow</p>
                  <p className="text-[16px] font-semibold text-slate-900">
                    NPR 46.3K
                  </p>
                </div>
              </div>

              <p className="text-[10px] font-medium text-slate-600 mb-2">
                Revenue vs Expenses
              </p>
              <div className="h-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                Chart placeholder
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN CARD */}
          <div className="flex-1 flex justify-end">
            <div className="w-[380px] bg-white rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.12)] px-7 py-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-[12px]">
                  ↑
                </div>
                <span className="text-[14px] font-semibold text-slate-900">
                  Fin<span className="text-emerald-600">Sync</span>
                </span>
              </div>

              <h2 className="text-[20px] font-semibold text-slate-900 mb-1">
                Welcome back
              </h2>
              <p className="text-[11px] text-slate-500 mb-5">
                Sign in to manage your finances and insights.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-medium text-slate-700 mb-1"
                  >
                    Email address
                  </label>
                  <div className="relative">

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email address"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-medium text-slate-700 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <label className="flex items-center gap-1 text-[10px] text-slate-600">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={form.remember}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Remember me</span>
                  </label>

                  {/* LINK TO RESET PASSWORD PAGE */}
                  <Link
                    to="/reset-password"
                    className="text-[10px] text-emerald-600 font-medium hover:text-emerald-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg bg-emerald-600 py-2 text-[11px] font-medium text-white shadow-[0_10px_24px_rgba(16,185,129,0.45)] hover:bg-emerald-700 transition-colors"
                >
                  Log In
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}