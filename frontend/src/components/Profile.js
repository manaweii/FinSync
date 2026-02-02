import React from "react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top pill label */}
      <header className="pt-10 pb-6 flex flex-col items-center">
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-600">
          Profile
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          Profile &amp; Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500 text-center max-w-md">
          Review and manage your personal identity details, company association,
          and administrative security preferences.
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-12">
        <div className="w-full max-w-3xl space-y-6">
          {/* Identity card */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-8">
            <p className="text-xs font-semibold tracking-wide text-slate-400">
              IDENTITY DETAILS
            </p>

            <div className="mt-6 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-semibold">
                AS
              </div>

              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Anjali Singh
              </h2>

              {/* Role pill */}
              <span className="mt-2 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-600">
                Admin
              </span>

              {/* Company */}
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
                  />
                </svg>
                <span>Tech Innovations Pvt. Ltd.</span>
              </div>

              {/* Divider */}
              <div className="mt-6 h-px w-full bg-slate-100" />

              {/* Authentication email */}
              <div className="mt-6 w-full text-left">
                <p className="text-xs font-semibold tracking-wide text-slate-400 mb-2">
                  AUTHENTICATION EMAIL
                </p>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 6l8 7 8-7M4 6v12h16V6"
                    />
                  </svg>
                  <span>anjali.singh@techinnovations.com</span>
                </div>
              </div>
            </div>
          </section>

          {/* Platform security card */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                <svg
                  className="h-5 w-5 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3l7 4v5c0 4.418-3.134 8.418-7 9-3.866-.582-7-4.582-7-9V7l7-4z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Platform Security
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Manage your session and access protection.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <button className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                Change Password
              </button>
              <button className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700">
                Enable 2FA
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
