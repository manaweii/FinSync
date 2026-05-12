import React, { useEffect, useMemo, useState } from "react";
import Footer from "../components/homepage/Footer";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../store/useAuthStore";
import { parseDateValue } from "../utils/financialData";
import {
  buildImportedRowsFromImports,
  loadManualRows,
  saveManualRows,
} from "../utils/recordsData";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const RECORDS_PER_PAGE = 15;

const defaultFormState = {
  date: "",
  account: "",
  accountType: "Expense",
  amount: "",
  category: "",
  description: "",
};

const normalizeValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatImportedOn = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString();
};

const formatDateInputValue = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
};

function RecordModal({
  isOpen,
  mode,
  form,
  onChange,
  onClose,
  onSubmit,
  submitDisabled,
}) {
  if (!isOpen) return null;

  const isEdit = mode === "edit";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${mode}-record-title`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id={`${mode}-record-title`}
              className="text-3xl font-semibold text-slate-900"
            >
              {isEdit ? "Edit Record" : "Add New Record"}
            </h3>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              {isEdit
                ? "Choose a row from the table to update it here."
                : "Capture transactions quickly and keep the table up to date."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close form"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="sr-only">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => onChange("date", e.target.value)}
                className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                required
              />
            </label>

            <label className="block">
              <span className="sr-only">Amount</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={form.amount}
                onChange={(e) => onChange("amount", e.target.value)}
                placeholder="Amount"
                className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-lg text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                required
              />
            </label>

            <label className="block">
              <span className="sr-only">Account</span>
              <input
                type="text"
                value={form.account}
                onChange={(e) => onChange("account", e.target.value)}
                placeholder="Account"
                className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-lg text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                required
              />
            </label>

            <label className="relative block">
              <span className="sr-only">Account Type</span>
              <select
                value={form.accountType}
                onChange={(e) => onChange("accountType", e.target.value)}
                className="w-full appearance-none rounded-3xl border border-slate-200 bg-white px-5 py-4 pr-14 text-lg text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
            </label>

            <label className="block">
              <span className="sr-only">Category</span>
              <input
                type="text"
                value={form.category}
                onChange={(e) => onChange("category", e.target.value)}
                placeholder="Category"
                className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-lg text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="block">
              <span className="sr-only">Description</span>
              <input
                type="text"
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                placeholder="Description"
                className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-lg text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitDisabled}
            className="w-full rounded-3xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 text-xl font-semibold text-white shadow-lg transition hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEdit ? "Save Changes" : "Add Record"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RecordsPage() {
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);

  const [imports, setImports] = useState([]);
  const [manualRows, setManualRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState("all");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [selectedImportedOn, setSelectedImportedOn] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);

  useEffect(() => {
    setManualRows(loadManualRows(currentUser?.orgId));
  }, [currentUser?.orgId]);

  useEffect(() => {
    if (!currentUser?.orgId) return;
    saveManualRows(currentUser.orgId, manualRows);
  }, [currentUser?.orgId, manualRows]);

  useEffect(() => {
    const fetchImports = async () => {
      if (!currentUser?.orgId) {
        setImports([]);
        setLoading(false);
        setError("Organization context is missing.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/past-imports/${currentUser.orgId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load imported records");
        }

        const data = await res.json();
        setImports(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error loading imports for records page:", err);
        setError(err.message || "Failed to load imported records");
      } finally {
        setLoading(false);
      }
    };

    fetchImports();
  }, [currentUser?.orgId, token]);

  const loadImports = async () => {
    if (!currentUser?.orgId) {
      setImports([]);
      setLoading(false);
      setError("Organization context is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/past-imports/${currentUser.orgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load imported records");
      }

      const data = await res.json();
      setImports(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error loading imports for records page:", err);
      setError(err.message || "Failed to load imported records");
    } finally {
      setLoading(false);
    }
  };

  const fileOptions = useMemo(
    () =>
      imports.map((imp) => ({
        id: imp._id,
        fileName: imp.fileName || "Untitled import",
      })),
    [imports],
  );

  const importedRows = useMemo(() => {
    return buildImportedRowsFromImports(imports);
  }, [imports]);

  const allRows = useMemo(
    () => [...manualRows, ...importedRows],
    [manualRows, importedRows],
  );

  const fileTypeOptions = useMemo(() => {
    return Array.from(
      new Set(allRows.map((row) => row.__fileType || "Unknown")),
    );
  }, [allRows]);

  const visibleColumns = useMemo(
    () => [
      "__fileName",
      "__fileType",
      "__importedOn",
      "date",
      "account",
      "accountType",
      "amount",
      "category",
      "description",
    ],
    [],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allRows.filter((row) => {
      const matchesFile =
        selectedFile === "all" ? true : row.__fileId === selectedFile;
      const matchesFileType =
        selectedFileType === "all" ? true : row.__fileType === selectedFileType;
      const matchesImportedOn = !selectedImportedOn
        ? true
        : formatDateInputValue(row.__importedOn) === selectedImportedOn;

      if (!matchesFile || !matchesFileType || !matchesImportedOn) return false;
      if (!query) return true;

      return visibleColumns.some((column) =>
        normalizeValue(row[column]).toLowerCase().includes(query),
      );
    });
  }, [
    allRows,
    search,
    selectedFile,
    selectedFileType,
    selectedImportedOn,
    visibleColumns,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / RECORDS_PER_PAGE),
  );

  const paginatedRows = useMemo(
    () =>
      filteredRows.slice(
        (currentPage - 1) * RECORDS_PER_PAGE,
        currentPage * RECORDS_PER_PAGE,
      ),
    [filteredRows, currentPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedFile, selectedFileType, selectedImportedOn]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const exportRowsToCsv = () => {
    if (filteredRows.length === 0) return;

    const headers = visibleColumns.map((column) =>
      column === "__fileName"
        ? "Source File"
        : column === "__fileType"
          ? "File Type"
          : column === "__importedOn"
            ? "Imported On"
            : column,
    );

    const escapeCsv = (value) =>
      `"${normalizeValue(value).replace(/"/g, '""')}"`;
    const lines = [
      headers.map(escapeCsv).join(","),
      ...filteredRows.map((row) =>
        visibleColumns
          .map((column) =>
            escapeCsv(
              column === "__importedOn"
                ? formatImportedOn(row[column])
                : row[column],
            ),
          )
          .join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "records-export.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const updateFormField = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setEditingRecordId(null);
    setFormState(defaultFormState);
  };

  const openAddModal = () => {
    setFormState(defaultFormState);
    setIsAddModalOpen(true);
  };

  const openEditModal = (row) => {
    setFormState({
      date: formatDateInputValue(row.date || row.__importedOn),
      account: row.account || row.Account || "",
      accountType: row.accountType || row["Account Type"] || "Expense",
      amount: String(row.amount || row.Amount || ""),
      category: row.category || row.Category || "",
      description:
        row.description || row.Description || row.desc || row.Desc || "",
    });
    setEditingRecordId(row.__recordId);
  };

  const handleAddRecord = (e) => {
    e.preventDefault();

    const newRow = {
      __recordId: `manual-${Date.now()}`,
      __fileId: "manual",
      __fileName: "Manual Record",
      __fileType: "Manual",
      __importedOn: new Date().toISOString(),
      date: formState.date,
      parsedDate: parseDateValue(formState.date),
      account: formState.account,
      accountType: formState.accountType,
      amount: Number(formState.amount),
      category: formState.category,
      description: formState.description,
    };

    setManualRows((current) => [newRow, ...current]);
    setCurrentPage(1);
    closeModals();
  };

  const handleEditRecord = (e) => {
    e.preventDefault();

    setManualRows((current) =>
      current.map((row) =>
        row.__recordId === editingRecordId
          ? {
              ...row,
              date: formState.date,
              parsedDate: parseDateValue(formState.date),
              account: formState.account,
              accountType: formState.accountType,
              amount: Number(formState.amount),
              category: formState.category,
              description: formState.description,
            }
          : row,
      ),
    );

    closeModals();
  };

  const selectedEditableRow =
    manualRows.find((row) => row.__recordId === editingRecordId) || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50/40 to-slate-50 py-12 px-4">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="text-center mb-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
            Record
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">
            Financial Records.
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto">
            All CSV and Excel imports for your organization are shown here in
            one table, so you can review every imported row from a single page.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Imported Files
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {imports.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Total Rows
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {allRows.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Showing
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {filteredRows.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Financial Records
                </h2>
                <p className="text-xs text-slate-500">
                  Manage and track all transactions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadImports}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Refresh records"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={exportRowsToCsv}
                  disabled={filteredRows.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white shadow-md transition hover:bg-cyan-600"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Record
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="Search records..."
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <CalendarDaysIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={selectedImportedOn}
                    onChange={(e) => setSelectedImportedOn(e.target.value)}
                    className="min-w-[180px] rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    aria-label="Filter by imported date"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                    className="min-w-[132px] appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    aria-label="Filter by file type"
                  >
                    <option value="all">All Types</option>
                    {fileTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="relative">
                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="min-w-[132px] appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    aria-label="Filter by file"
                  >
                    <option value="all">All Files</option>
                    {fileOptions.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.fileName}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedFile("all");
                    setSelectedFileType("all");
                    setSelectedImportedOn("");
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-4">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Loading imported records...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm text-rose-600">
                {error}
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No imported rows found. Import a CSV or Excel file to see
                records here.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        {visibleColumns.map((column) => (
                          <th
                            key={column}
                            className="whitespace-nowrap px-4 py-3 font-medium"
                          >
                            {column === "__fileName"
                              ? "Source File"
                              : column === "__fileType"
                                ? "File Type"
                                : column === "__importedOn"
                                  ? "Imported On"
                                  : column === "accountType"
                                    ? "Account Type"
                                    : column.charAt(0).toUpperCase() +
                                      column.slice(1)}
                          </th>
                        ))}
                        <th className="whitespace-nowrap px-4 py-3 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedRows.map((row) => (
                        <tr key={row.__recordId} className="align-top">
                          {visibleColumns.map((column) => (
                            <td
                              key={column}
                              className="whitespace-nowrap px-4 py-3 text-slate-700"
                            >
                              {column === "__importedOn"
                                ? formatImportedOn(row[column])
                                : column === "amount"
                                  ? Number(row[column] || 0).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )
                                  : normalizeValue(row[column])}
                            </td>
                          ))}
                          <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                            <button
                              type="button"
                              onClick={() => openEditModal(row)}
                              disabled={
                                !String(row.__recordId).startsWith("manual-")
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Edit record ${normalizeValue(row.description || row.Description || row.__recordId)}`}
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                  <span>
                    Showing {paginatedRows.length} of {filteredRows.length}{" "}
                    record
                    {filteredRows.length === 1 ? "" : "s"} on this page.
                    {manualRows.length > 0
                      ? ` ${manualRows.length} manual record${manualRows.length === 1 ? "" : "s"} can be edited.`
                      : ""}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="h-7 rounded-full bg-emerald-600 px-3 text-xs font-medium text-white"
                    >
                      {currentPage}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <RecordModal
        isOpen={isAddModalOpen}
        mode="add"
        form={formState}
        onChange={updateFormField}
        onClose={closeModals}
        onSubmit={handleAddRecord}
        submitDisabled={
          !formState.date ||
          !formState.amount ||
          !formState.description ||
          !formState.account
        }
      />

      <RecordModal
        isOpen={Boolean(editingRecordId)}
        mode="edit"
        form={formState}
        onChange={updateFormField}
        onClose={closeModals}
        onSubmit={handleEditRecord}
        submitDisabled={
          !selectedEditableRow ||
          !formState.date ||
          !formState.amount ||
          !formState.description ||
          !formState.account
        }
      />
      <Footer />
    </div>
  );
}
