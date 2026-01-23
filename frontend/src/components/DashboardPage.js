import React from "react";
import Navbar from "./Navbar";

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navbar */}
      <Navbar isLoggedIn={true} />

      {/* Main area */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 border-r border-slate-200 bg-white min-h-[calc(100vh-3.5rem)]">
          <nav className="p-4 space-y-1 text-sm">
            <p className="text-xs font-semibold text-slate-400 mb-2">
              Overview
            </p>
            <button className="w-full text-left px-3 py-2 rounded-lg bg-teal-50 text-teal-600 font-medium">
              Dashboard
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
              Reports
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
              Transactions
            </button>

            <p className="text-xs font-semibold text-slate-400 mt-4 mb-2">
              Settings
            </p>
            <button className="w-full text-left px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
              Account
            </button>
          </nav>
        </aside>

        {/* Content area */}
        <main className="flex-1 p-4 sm:p-6 space-y-4">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Overview of your financial performance
              </p>
            </div>
            <button className="text-xs px-3 py-2 rounded-lg bg-teal-500 text-white font-medium">
              New Report
            </button>
          </div>

          {/* Top cards row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white border border-slate-200 h-24" />
            <div className="rounded-2xl bg-white border border-slate-200 h-24" />
            <div className="rounded-2xl bg-white border border-slate-200 h-24" />
          </div>

          {/* Middle layout */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Large main area */}
            <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 h-80" />
            {/* Right column */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-slate-200 h-36" />
              <div className="rounded-2xl bg-white border border-slate-200 h-36" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
