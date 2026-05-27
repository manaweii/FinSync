import React from "react";
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
          403 Forbidden
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          You do not have access to this page.
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          This area is restricted to superadmin accounts.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
