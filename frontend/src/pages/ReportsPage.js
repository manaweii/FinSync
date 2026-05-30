import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, Outlet } from "react-router-dom";
import Footer from "../components/homepage/Footer";
import useAuthStore from "../store/useAuthStore";
import useRecordsStore from "../store/useRecordsStore";
import { CalendarIcon } from "@heroicons/react/24/outline";
import {
  buildRowsFromDatabaseRecords,
  buildRecordDataset,
  buildSourceOptionsFromRows,
} from "../utils/recordsData";

const EMPTY_RECORDS = [];

function ReportsPage() {
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const recordsCacheKey = `${currentUser?.orgName || ""}:${token || ""}`;
  const recordsEntry = useRecordsStore((s) => s.cache[recordsCacheKey]);
  const fetchRecords = useRecordsStore((s) => s.fetchRecords);

  const fromRef = useRef(null);
  const toRef = useRef(null);

  const [selectedImport, setSelectedImport] = useState("all");
  const [filterInput, setFilterInput] = useState({
    preset: "",
    from: "",
    to: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const dbRecords = recordsEntry?.records || EMPTY_RECORDS;
  const loadingImports = recordsEntry?.loading ?? Boolean(currentUser?.orgName);
  const error = recordsEntry?.error || null;

  const loadImports = useCallback(async ({ force = false } = {}) => {
    try {
      if (!currentUser?.orgName) {
        return;
      }

      await fetchRecords({
        apiBase: API_BASE,
        orgName: currentUser.orgName,
        token,
        force,
      });
    } catch (err) {
      console.error("loadImports error:", err);
    }
  }, [API_BASE, currentUser?.orgName, fetchRecords, token]);

  useEffect(() => {
    loadImports();
  }, [loadImports]);

  const importDetail = useMemo(
    () =>
      buildRecordDataset({
        dbRecords,
        selectedSource: selectedImport,
      }),
    [dbRecords, selectedImport],
  );

  const sourceOptions = useMemo(() => {
    const rows = buildRowsFromDatabaseRecords(dbRecords);
    return buildSourceOptionsFromRows(rows);
  }, [dbRecords]);

  const handleImportSelect = (e) => {
    setSelectedImport(e.target.value || "all");
  };

  const handleFilterChange = (e) => {
    setFilterInput({
      ...filterInput,
      [e.target.name]: e.target.value,
      preset:
        e.target.name === "from" || e.target.name === "to"
          ? ""
          : filterInput.preset,
    });
  };

  const handleMonthChange = (e) => {
    const monthIndex = e.target.value;
    if (monthIndex === "") {
      setFilterInput({
        ...filterInput,
        preset: "Custom Range",
        from: "",
        to: "",
      });
      return;
    }

    const year = new Date().getFullYear();
    // Use local date construction to avoid timezone shifts from ISO strings
    const firstDay = new Date(year, parseInt(monthIndex), 1);
    const lastDay = new Date(year, parseInt(monthIndex) + 1, 0);

    const formatDate = (d) => d.toISOString().split("T")[0];

    setFilterInput({
      ...filterInput,
      preset: months[monthIndex], // Store the actual Name (January, etc.)
      from: formatDate(firstDay),
      to: formatDate(lastDay),
    });
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filterInput });
  };

  const resetFilters = () => {
    const empty = { preset: "", from: "", to: "" };
    setFilterInput(empty);
    setAppliedFilters(empty);
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "dd/mm/yyyy";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50/40 to-slate-50 py-12 px-4">
        <div className="max-w-5xl mx-auto text-center mb-8">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-600 mb-4">
            Reports
          </span>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">
            Real-time financial reports at a glance.
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
            Every report below now reads from the same records dataset shown on
            the Records page.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-[0_32px_80px_rgba(15,23,42,0.12)] border border-slate-100">
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-slate-100">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium">
              {["pl", "balance-sheet", "cash-flow"].map((path) => (
                <NavLink
                  key={path}
                  to={`/reports/${path}`}
                  className={({ isActive }) =>
                    "px-4 py-1.5 rounded-lg " +
                    (isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700")
                  }
                >
                  {path === "pl"
                    ? "P&L"
                    : path
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[2.3fr,1fr] gap-0 px-6 py-6">
            <div className="pr-6 border-r border-slate-100">
              <Outlet
                context={{
                  importDetail,
                  filters: appliedFilters,
                  refresh: loadImports,
                }}
              />
            </div>

            <aside className="pl-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Filters
              </h3>

              <form className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1 text-slate-600">
                    Source data
                  </label>
                  {loadingImports ? (
                    <div className="text-xs text-slate-500 italic">
                      Loading records...
                    </div>
                  ) : (
                    <select
                      value={selectedImport}
                      onChange={handleImportSelect}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                    >
                      <option value="all">All records</option>
                      {sourceOptions.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Quick Select Month
                  </label>
                  <select
                    name="preset"
                    value={filterInput.preset}
                    onChange={handleMonthChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                  >
                    <option value="">Custom Range (Lastest Year)</option>
                    {months.map((month, index) => (
                      <option key={month} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Date Range
                  </label>
                  <div
                    onClick={() => fromRef.current?.showPicker()}
                    className="relative group flex items-center justify-between w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 cursor-pointer hover:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            filterInput.from
                              ? "text-slate-900 font-medium"
                              : "text-slate-400"
                          }
                        >
                          {formatDateForDisplay(filterInput.from)}
                        </span>
                        <span className="text-slate-300">-</span>
                        <span
                          className={
                            filterInput.to
                              ? "text-slate-900 font-medium"
                              : "text-slate-400"
                          }
                        >
                          {formatDateForDisplay(filterInput.to)}
                        </span>
                      </div>
                    </div>

                    <div className="absolute opacity-0 pointer-events-none">
                      <input
                        ref={fromRef}
                        type="date"
                        name="from"
                        value={filterInput.from}
                        onChange={(e) => {
                          handleFilterChange(e);
                          setTimeout(() => toRef.current?.showPicker(), 100);
                        }}
                      />
                      <input
                        ref={toRef}
                        type="date"
                        name="to"
                        value={filterInput.to}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="flex-1 rounded-lg bg-teal-600 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-sm transition-all active:scale-[0.98]"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Reset
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-50 text-[11px] text-slate-500 space-y-1">
                  <p>Current dataset</p>
                  <p className="font-medium text-slate-700">
                    {importDetail.fileName} ({importDetail.records} records)
                  </p>
                  <button
                    type="button"
                    onClick={() => loadImports({ force: true })}
                    className="mt-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                  >
                    Refresh imports
                  </button>
                </div>

                {error && (
                  <div className="text-xs text-rose-600 mt-3 p-2 bg-rose-50 rounded-md border border-rose-100 italic">
                    {error}
                  </div>
                )}
              </form>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ReportsPage;
