import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!acceptTerms) {
      setError("You must agree to the Terms and Privacy Policy.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email,
          organization: companyName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess("Account created successfully. Redirecting...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // keep your JSX form exactly as before, only handleSubmit changed
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 top-10 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute right-0 bottom-0 w-72 h-72 bg-teal-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl bg-white/90 backdrop-blur rounded-2xl shadow-xl px-10 py-8">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500">
          <span className="text-white text-xl font-bold">↗</span>
        </div>

        <h2 className="text-center text-2xl font-semibold text-slate-800">
          Create your account
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Start tracking your finances, insights, and growth in one place.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
              {success}
            </p>
          )}

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Full name
            </label>
            <input
              type="text"
              placeholder="Sarah Johnson"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Company name */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Company name
            </label>
            <input
              type="text"
              placeholder="Your company"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Email
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
              <span className="mr-2 text-slate-400">&#9993;</span>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full border-0 bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Password
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
              <span className="mr-2 text-slate-400">&#128274;</span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border-0 bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Confirm password
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
              <span className="mr-2 text-slate-400">&#128274;</span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border-0 bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label htmlFor="terms">
              I agree to the{" "}
              <a href="#" className="text-teal-500 font-medium hover:text-teal-600">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-teal-500 font-medium hover:text-teal-600">
                Privacy Policy
              </a>
              .
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {/* Switch to login */}
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-teal-500 hover:text-teal-600"
            >
              Log in
            </Link>
          </p>

          {/* Divider */}
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            OR
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google button */}
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="text-lg">G</span>
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
