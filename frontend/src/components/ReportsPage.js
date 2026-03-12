import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

function ReportsPage() {
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const [imports, setImports] = useState([]);
  const [selectedImport, setSelectedImport] = useState(null);
  const [importDetail, setImportDetail] = useState(null);
  const [loadingImports, setLoadingImports] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadImports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.orgId, token]);

  const loadImports = async () => {
    setLoadingImports(true);
    setError(null);
    try {
      if (!currentUser?.orgId) {
        setImports([]);
        return;
      }
      const res = await fetch(`${API_BASE}/past-imports/${currentUser.orgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Failed to load imports");
      }
      const data = await res.json();
      setImports(data || []);

      // auto-select the most recent import
      if (data && data.length > 0) {
        const first = data[0];
        setSelectedImport(first._id || first.id);
        // fetch its detail
        loadImportDetail(first._id || first.id);
      } else {
        setSelectedImport(null);
        setImportDetail(null);
      }
    } catch (err) {
      console.error("loadImports error:", err);
      setError(err.message || "Failed to load imports");
    } finally {
      setLoadingImports(false);
    }
  };

  const loadImportDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/imports/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Failed to load import details");
      }
      const data = await res.json();
      setImportDetail(data);
    } catch (err) {
      console.error("loadImportDetail error:", err);
      setError(err.message || "Failed to load import details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleImportSelect = (e) => {
    const id = e.target.value;
    setSelectedImport(id);
    if (id) loadImportDetail(id);
  };

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
            {/* Pass importDetail to child routes so they can build reports from it */}
            <Outlet context={{ importDetail, refresh: () => loadImports() }} />
          </div>

          {/* right: filters panel */}
          <aside className="pl-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Filters</h3>

            <form className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 text-slate-600">Source import</label>
                {loadingImports ? (
                  <div className="text-xs text-slate-500">Loading imports...</div>
                ) : (
                  <select
                    value={selectedImport || ''}
                    onChange={handleImportSelect}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">Select import (most recent)</option>
                    {imports.map((imp) => (
                      <option key={imp._id || imp.id} value={imp._id || imp.id}>
                        {imp.fileName} — {new Date(imp.importedOn).toLocaleString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

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
                <button type="button" className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700">Apply</button>
                <button type="button" className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Reset</button>
              </div>

              <div className="pt-4 text-[11px] text-slate-500 space-y-1">
                <p>Last updated</p>
                <p className="font-medium text-slate-700">{importDetail ? new Date(importDetail.importedOn).toLocaleString() : '—'}</p>
                <button type="button" onClick={() => loadImports()} className="mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">Refresh imports</button>
              </div>

              {error && <div className="text-xs text-rose-600 mt-3">{error}</div>}
            </form>
          </aside>
        </div>

        {/* export buttons */}
        <div className="flex justify-center gap-3 border-t border-slate-100 px-6 py-4">
          <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">Export as PDF</button>
          <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">Export as CSV</button>
          <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">Print</button>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
