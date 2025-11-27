import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 top-10 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute right-0 bottom-0 w-72 h-72 bg-teal-100/40 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl px-10 py-8">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500">
          {/* simple logo mark */}
          <span className="text-white text-xl font-bold">↗</span>
        </div>

        <h2 className="text-center text-2xl font-semibold text-slate-800">
          Welcome back
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Sign in to manage your finances and insights.
        </p>

        <form className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Email
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
              <span className="text-slate-400 mr-2">
                {/* mail icon */}
                &#9993;
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full border-0 bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">
              Password
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
              <span className="text-slate-400 mr-2">
                {/* lock icon */}
                &#128274;
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border-0 bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500"
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-teal-500 font-medium hover:text-teal-600"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-600 transition-colors"
          >
            Log In
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-teal-500 hover:text-teal-600">
              Create an account
            </Link>
          </p>

          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            OR
            <span className="h-px flex-1 bg-slate-200" />
          </div>

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
