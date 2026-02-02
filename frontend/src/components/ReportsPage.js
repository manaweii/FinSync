import React from "react";
import { NavLink, Outlet } from "react-router-dom";

function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50/40 to-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto text-center mb-8">
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-600 mb-4">
          Reports
        </span>

        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">
          Real-time financial reports at a glance.
        </h1>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
          Load your current P&L, Balance Sheet, and Cash Flow reports, then drill
          into detailed accounts.
        </p>
      </div>

      {/* main white card */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-[0_32px_80px_rgba(15,23,42,0.12)] border border-slate-100">
        {/* tabs + filter button */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-slate-100">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium">
            <NavLink
              to="/pl"
              className={({ isActive }) =>
                "px-4 py-1.5 rounded-lg " +
                (isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700")
              }
            >
              P&L
            </NavLink>
            <NavLink
              to="/balance-sheet"
              className={({ isActive }) =>
                "px-4 py-1.5 rounded-lg " +
                (isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700")
              }
            >
              Balance Sheet
            </NavLink>
            <NavLink
              to="/cash-flow"
              className={({ isActive }) =>
                "px-4 py-1.5 rounded-lg " +
                (isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700")
              }
            >
              Cash Flow
            </NavLink>
          </div>

          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <span>Filter</span>
          </button>
        </div>

        {/* content area: left report + right filters */}
        <div className="grid grid-cols-[2.3fr,1fr] gap-0 px-6 py-6">
          {/* left: each page injects its own cards and table */}
          <div className="pr-6 border-r border-slate-100">
            <Outlet />
          </div>

          {/* right: filters panel */}
          <aside className="pl-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Filters
            </h3>

            <form className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 text-slate-600">Report Period</label>
                <input
                  type="text"
                  placeholder="This Month"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>

              <div className="pt-4 text-[11px] text-slate-500 space-y-1">
                <p>Last updated</p>
                <p className="font-medium text-slate-700">5 minutes ago</p>
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Refresh data
                </button>
              </div>
            </form>
          </aside>
        </div>

        {/* export buttons */}
        <div className="flex justify-center gap-3 border-t border-slate-100 px-6 py-4">
          <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
            Export as PDF
          </button>
          <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
            Export as CSV
          </button>
          <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
