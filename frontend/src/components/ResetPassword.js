import React from "react";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 top-10 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute right-0 bottom-0 w-72 h-72 bg-teal-100/40 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl px-10 py-8">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500">
          {/* lock icon */}
          <span className="text-white text-xl">&#128274;</span>
        </div>

        <h2 className="text-center text-2xl font-semibold text-slate-800">
          Reset your password
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Enter your email to receive a secure password reset link.
        </p>

        <form className="mt-8 space-y-4">
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
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-600 transition-colors"
          >
            Send reset link
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Remembered your password?{" "}
            <a href="#" className="font-medium text-teal-500 hover:text-teal-600">
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
