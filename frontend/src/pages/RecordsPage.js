import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../components/homepage/Footer";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CalculatorIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ConfirmDeleteModal from "../components/auth/ConfirmDeleteModal";
import useAuthStore from "../store/useAuthStore";
import {
  buildRowsFromDatabaseRecords,
  buildSourceOptionsFromRows,
  RECORDS_VISIBLE_COLUMNS,
} from "../utils/recordsData";
import { isAdminRole } from "../utils/roles";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const RECORDS_PER_PAGE = 8;

const defaultFormState = {
  date: "",
  account: "",
  accountType: "Expense",
  amount: "",
  category: "",
  description: "",
};

const defaultInvestmentFormState = {
  date: new Date().toISOString().slice(0, 10),
  amount: "",
  cashAccount: "Cash at Bank",
  equityAccount: "Company Capital",
  description: "",
};

const defaultBudgetFormState = {
  amount: "",
  effectiveMonth: new Date().toISOString().slice(0, 7),
  note: "",
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

const getRowSortTime = (row = {}) => {
  const source = String(row.__source || "").toLowerCase();
  const importFileType = String(row.__importFileType || "").toLowerCase();
  const isFileImport =
    source === "import" &&
    (importFileType === "csv" ||
      importFileType === "excel" ||
      importFileType === "xlsx");

  if (isFileImport) {
    const fileDate = row.parsedDate || row.transactionDate || row.date;
    const parsedFileDate =
      fileDate instanceof Date ? fileDate : new Date(fileDate);
    if (!Number.isNaN(parsedFileDate.getTime())) {
      return parsedFileDate.getTime();
    }
  }

  const candidates = [
    row.__importedOn,
    row.createdAt,
    row.transactionDate,
    row.date,
  ];
  for (const value of candidates) {
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return 0;
};

const getAmountTextClass = (row = {}) => {
  const amount = Number(row.amount || row.Amount || 0);
  const accountType = String(
    row.accountType || row["Account Type"] || "",
  ).toLowerCase();

  if (amount < 0 || accountType === "expense")
    return "font-semibold text-rose-600";
  if (amount > 0) return "font-semibold text-emerald-600";
  return "text-slate-500";
};

const sanitizeAmountInput = (value) => {
  const cleaned = String(value || "").replace(/[^\d.-]/g, "");
  const sign = cleaned.startsWith("-") ? "-" : "";
  const unsigned = cleaned.replace(/-/g, "");
  const [whole = "", ...decimalParts] = unsigned.split(".");
  const decimal = decimalParts.join("");
  return `${sign}${whole}${decimalParts.length > 0 ? `.${decimal}` : ""}`;
};

const sanitizeAlphabetInput = (value) =>
  String(value || "").replace(/[^a-zA-Z\s]/g, "");

const isValidAmount = (value) => /^-?\d+(\.\d+)?$/.test(String(value).trim());
const isValidAlphabetText = (value, { required = false } = {}) => {
  const text = String(value || "").trim();
  if (!text) return !required;
  return /^[a-zA-Z\s]+$/.test(text);
};

const getManualFormErrors = (form) => {
  const errors = {};

  if (!form.date) {
    errors.date = "Date is required.";
  }
  if (!form.amount) {
    errors.amount = "Amount is required.";
  } else if (!isValidAmount(form.amount)) {
    errors.amount = "Amount must be a valid number.";
  }
  if (!form.account) {
    errors.account = "Account is required.";
  } else if (!isValidAlphabetText(form.account, { required: true })) {
    errors.account = "Account must contain letters and spaces only.";
  }
  if (form.category && !isValidAlphabetText(form.category)) {
    errors.category = "Category must contain letters and spaces only.";
  }
  if (!form.description) {
    errors.description = "Description is required.";
  }

  return errors;
};

const getInputClass = (hasError) =>
  `w-full rounded-3xl border px-5 py-4 text-lg text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
  }`;

function FieldError({ id, message }) {
  if (!message) return null;

  return (
    <p id={id} className="mt-2 px-2 text-sm font-medium text-rose-600">
      {message}
    </p>
  );
}

function ValidatedInput({ error, idPrefix, name, className = "", ...props }) {
  const errorId = `${idPrefix}-${name}-error`;

  return (
    <>
      <input
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`${getInputClass(Boolean(error))} ${className}`.trim()}
      />
      <FieldError id={errorId} message={error} />
    </>
  );
}

function RecordModal({
  isOpen,
  mode,
  form,
  errors = {},
  onChange,
  onClose,
  onSubmit,
  submitDisabled,
}) {
  if (!isOpen) return null;

  const isEdit = mode === "edit";
  const handleAmountChange = (value) => {
    const sanitizedValue = sanitizeAmountInput(value);
    onChange(
      "amount",
      sanitizedValue,
      sanitizedValue !== value ? "Amount must contain numbers only." : "",
    );
  };
  const handleAlphabetChange = (field, value, label) => {
    const sanitizedValue = sanitizeAlphabetInput(value);
    onChange(
      field,
      sanitizedValue,
      sanitizedValue !== value
        ? `${label} must contain letters and spaces only.`
        : "",
    );
  };

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

        <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="sr-only">Date</span>
              <ValidatedInput
                idPrefix={mode}
                name="date"
                type="date"
                value={form.date}
                onChange={(e) => onChange("date", e.target.value)}
                error={errors.date}
                required
              />
            </label>

            <label className="block">
              <span className="sr-only">Amount</span>
              <ValidatedInput
                idPrefix={mode}
                name="amount"
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Amount"
                pattern="-?[0-9]+(\\.[0-9]+)?"
                title="Enter a valid number, for example 1200 or 1200.50"
                error={errors.amount}
                required
              />
            </label>

            <label className="block">
              <span className="sr-only">Account</span>
              <ValidatedInput
                idPrefix={mode}
                name="account"
                type="text"
                value={form.account}
                onChange={(e) =>
                  handleAlphabetChange("account", e.target.value, "Account")
                }
                placeholder="Account"
                pattern="[A-Za-z\\s]+"
                title="Use letters and spaces only"
                error={errors.account}
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
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
            </label>

            <label className="block">
              <span className="sr-only">Category</span>
              <ValidatedInput
                idPrefix={mode}
                name="category"
                type="text"
                value={form.category}
                onChange={(e) =>
                  handleAlphabetChange("category", e.target.value, "Category")
                }
                placeholder="Category"
                pattern="[A-Za-z\\s]*"
                title="Use letters and spaces only"
                error={errors.category}
              />
            </label>

            <label className="block">
              <span className="sr-only">Description</span>
              <ValidatedInput
                idPrefix={mode}
                name="description"
                type="text"
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                placeholder="Description"
                error={errors.description}
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

function InvestmentModal({
  isOpen,
  form,
  onChange,
  onClose,
  onSubmit,
  submitDisabled,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="investment-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="investment-title" className="text-2xl font-semibold text-slate-900">
              Add Investment
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              This creates a balanced journal entry: debit cash and credit owner equity.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close investment form"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          <input
            type="date"
            value={form.date}
            onChange={(e) => onChange("date", e.target.value)}
            className={getInputClass(false)}
            required
          />
          <input
            type="text"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => onChange("amount", sanitizeAmountInput(e.target.value))}
            placeholder="Investment amount"
            className={getInputClass(false)}
            required
          />
          <input
            type="text"
            value={form.cashAccount}
            onChange={(e) => onChange("cashAccount", e.target.value)}
            placeholder="Cash or bank account"
            className={getInputClass(false)}
            required
          />
          <input
            type="text"
            value={form.equityAccount}
            onChange={(e) => onChange("equityAccount", e.target.value)}
            placeholder="Equity account"
            className={getInputClass(false)}
            required
          />
          <input
            type="text"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Description"
            className={`${getInputClass(false)} md:col-span-2`}
            required
          />
          <button
            type="submit"
            disabled={submitDisabled}
            className="md:col-span-2 rounded-3xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save Investment
          </button>
        </form>
      </div>
    </div>
  );
}

function BudgetModal({
  isOpen,
  form,
  onChange,
  onClose,
  onSubmit,
  submitDisabled,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="budget-title" className="text-2xl font-semibold text-slate-900">
              Set Monthly Budget
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              The current amount is recurring by default, with every change kept in history.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close budget form"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
          <input
            type="text"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => onChange("amount", sanitizeAmountInput(e.target.value))}
            placeholder="Monthly budget amount"
            className={getInputClass(false)}
            required
          />
          <input
            type="month"
            value={form.effectiveMonth}
            onChange={(e) => onChange("effectiveMonth", e.target.value)}
            className={getInputClass(false)}
            required
          />
          <input
            type="text"
            value={form.note}
            onChange={(e) => onChange("note", e.target.value)}
            placeholder="Note"
            className={getInputClass(false)}
          />
          <button
            type="submit"
            disabled={submitDisabled}
            className="rounded-3xl bg-slate-900 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save Budget
          </button>
        </form>
      </div>
    </div>
  );
}

function DescriptionCell({ value }) {
  const text = normalizeValue(value);
  const lines = text.includes("\n")
    ? text.split("\n")
    : text.startsWith("Items:")
      ? text.split(/,\s+/)
      : [text];
  const structuredLines = lines
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return {
        label: rest.length > 0 ? label.trim() : "",
        value: rest.length > 0 ? rest.join(":").trim() : line.trim(),
      };
    })
    .filter(({ value }) => value);
  const itemLine = structuredLines.find(
    ({ label }) => label.toLowerCase() === "items",
  );
  const metricLines = structuredLines.filter(({ label }) =>
    ["sales", "cogs", "vat"].includes(label.toLowerCase()),
  );
  const otherLines = structuredLines.filter(({ label }) => {
    const normalizedLabel = label.toLowerCase();
    return (
      normalizedLabel !== "items" &&
      !["sales", "cogs", "vat"].includes(normalizedLabel)
    );
  });
  const itemList = itemLine?.value.split(/,\s*/).filter(Boolean) || [];

  return (
    <div className="max-w-[240px] whitespace-normal text-[11px] leading-5 text-slate-700">
      {itemLine ? (
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Items
          </span>
          <div className="mt-0.5 space-y-0.5">
            {itemList.map((item) => (
              <span
                key={item}
                className="block break-words font-medium text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {metricLines.length > 0 ? (
        <div className={itemLine ? "mt-1" : ""}>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {metricLines.map(({ label, value }) => (
              <span key={label} className="whitespace-nowrap">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </span>{" "}
                <span className="font-semibold text-slate-800">{value}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {otherLines.map(({ label, value }, index) => (
        <div key={`${label}-${value}-${index}`} className="mt-1">
          {label ? (
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </span>
          ) : null}
          <span className="block break-words font-semibold text-slate-800">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function DeleteErrorModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-error-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <XMarkIcon className="h-6 w-6" />
          </div>
          <div>
            <h3
              id="delete-error-title"
              className="text-xl font-semibold text-slate-900"
            >
              Delete unavailable
            </h3>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function SpendingLimitModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spending-limit-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <XMarkIcon className="h-6 w-6" />
        </div>
        <h3
          id="spending-limit-title"
          className="mt-4 text-xl font-semibold text-slate-900"
        >
          {message}
        </h3>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function RecordsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const isOrgAdmin = isAdminRole(currentUser?.role);

  const [dbRecords, setDbRecords] = useState([]);
  const [financeSetup, setFinanceSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [error, setError] = useState("");
  const [financeError, setFinanceError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState("all");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [selectedImportedOn, setSelectedImportedOn] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [recordPendingDelete, setRecordPendingDelete] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [spendingLimitMessage, setSpendingLimitMessage] = useState("");
  const [formState, setFormState] = useState(defaultFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [investmentForm, setInvestmentForm] = useState(defaultInvestmentFormState);
  const [budgetForm, setBudgetForm] = useState(defaultBudgetFormState);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const loadRecords = useCallback(async () => {
    if (!currentUser?.orgName) {
      setDbRecords([]);
      setLoading(false);
      setError("Organization context is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const recordsRes = await fetch(
        `${API_BASE}/records?orgName=${encodeURIComponent(currentUser.orgName)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!recordsRes.ok) {
        const text = await recordsRes.text();
        throw new Error(text || "Failed to load records");
      }

      const recordsData = await recordsRes.json();
      setDbRecords(Array.isArray(recordsData) ? recordsData : []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error loading records page data:", err);
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.orgName, token]);

  const loadFinanceSetup = useCallback(async () => {
    try {
      setFinanceLoading(true);
      setFinanceError("");
      const res = await fetch(`${API_BASE}/organization/finance-setup`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load finance setup");
      setFinanceSetup(data);
    } catch (err) {
      setFinanceError(err.message || "Failed to load finance setup");
    } finally {
      setFinanceLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    loadFinanceSetup();
  }, [loadFinanceSetup]);

  useEffect(() => {
    if (!spendingLimitMessage) return undefined;
    const timeoutId = window.setTimeout(() => {
      setSpendingLimitMessage("");
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [spendingLimitMessage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("setup") === "investment" && isOrgAdmin) {
      setInvestmentForm(defaultInvestmentFormState);
      setIsInvestmentModalOpen(true);
      params.delete("setup");
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : "",
        },
        { replace: true },
      );
    }
  }, [isOrgAdmin, location.pathname, location.search, navigate]);

  const allRows = useMemo(() => {
    return buildRowsFromDatabaseRecords(dbRecords, {
      summarizeFruityGoOrders: true,
    }).sort((a, b) => getRowSortTime(b) - getRowSortTime(a));
  }, [dbRecords]);

  const fileOptions = useMemo(
    () =>
      buildSourceOptionsFromRows(allRows).map((option) => ({
        id: option.id,
        fileName: option.label,
      })),
    [allRows],
  );

  const fileTypeOptions = useMemo(() => {
    return Array.from(
      new Set(allRows.map((row) => row.__fileType || "Unknown")),
    );
  }, [allRows]);

  const visibleColumns = useMemo(
    () =>
      RECORDS_VISIBLE_COLUMNS.filter(
        (column) =>
          !["__fileName", "orgName", "transactionId"].includes(column),
      ),
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
      column === "__fileType"
        ? "Source"
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

  const updateFormField = (field, value, fieldError = "") => {
    setFormState((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (fieldError) {
        return { ...current, [field]: fieldError };
      }
      if (!current[field]) return current;
      const { [field]: _removed, ...remaining } = current;
      return remaining;
    });
  };

  const updateInvestmentField = (field, value) => {
    setInvestmentForm((current) => ({ ...current, [field]: value }));
  };

  const updateBudgetField = (field, value) => {
    setBudgetForm((current) => ({ ...current, [field]: value }));
  };

  const showErrorMessage = (message, fallback) => {
    const text = String(message || fallback || "");
    if (text.toLowerCase().includes("spending limit")) {
      setSpendingLimitMessage("Spending limit exceeded");
      return;
    }
    alert(text || fallback);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setEditingRecordId(null);
    setIsInvestmentModalOpen(false);
    setIsBudgetModalOpen(false);
    setRecordPendingDelete(null);
    setFormState(defaultFormState);
    setFormErrors({});
  };

  const openAddModal = () => {
    setFormState(defaultFormState);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openInvestmentModal = () => {
    if (!isOrgAdmin) return;
    setInvestmentForm(defaultInvestmentFormState);
    setIsInvestmentModalOpen(true);
  };

  const openBudgetModal = () => {
    if (!isOrgAdmin) return;
    setBudgetForm({
      ...defaultBudgetFormState,
      amount: financeSetup?.monthlyBudget
        ? String(financeSetup.monthlyBudget)
        : "",
    });
    setIsBudgetModalOpen(true);
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
    setFormErrors({});
    setEditingRecordId(row.__recordDocId || row.__recordId);
  };

  const validateManualForm = () => {
    const errors = getManualFormErrors(formState);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!validateManualForm()) return;

    try {
      const res = await fetch(`${API_BASE}/records/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orgName: currentUser?.orgName || "",
          date: formState.date,
          account: formState.account,
          accountType: formState.accountType,
          amount: Number(formState.amount),
          category: formState.category,
          description: formState.description,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.message || "Failed to add record");
      }

      await Promise.all([loadRecords(), loadFinanceSetup()]);
      closeModals();
      setCurrentPage(1);
    } catch (err) {
      showErrorMessage(err.message, "Failed to add record");
    }
  };

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    if (!isOrgAdmin) return;
    if (!investmentForm.date || !isValidAmount(investmentForm.amount) || Number(investmentForm.amount) <= 0) {
      alert("Enter a valid positive investment amount and date.");
      return;
    }

    try {
      setSavingInvestment(true);
      const res = await fetch(`${API_BASE}/records/investment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...investmentForm,
          amount: Number(investmentForm.amount),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.message || "Failed to add investment");

      await Promise.all([loadRecords(), loadFinanceSetup()]);
      closeModals();
    } catch (err) {
      alert(err.message || "Failed to add investment");
    } finally {
      setSavingInvestment(false);
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!isOrgAdmin) return;
    if (!isValidAmount(budgetForm.amount) || Number(budgetForm.amount) < 0 || !budgetForm.effectiveMonth) {
      alert("Enter a valid monthly budget and effective month.");
      return;
    }

    try {
      setSavingBudget(true);
      const res = await fetch(`${API_BASE}/organization/monthly-budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...budgetForm,
          amount: Number(budgetForm.amount),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.message || "Failed to save budget");

      await loadFinanceSetup();
      closeModals();
    } catch (err) {
      alert(err.message || "Failed to save budget");
    } finally {
      setSavingBudget(false);
    }
  };

  const handleRecalculateRecords = async () => {
    if (!isOrgAdmin) return;
    try {
      setRecalculating(true);
      const res = await fetch(`${API_BASE}/records/recalculate`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.message || "Failed to recalculate records");
      await Promise.all([loadRecords(), loadFinanceSetup()]);
    } catch (err) {
      alert(err.message || "Failed to recalculate records");
    } finally {
      setRecalculating(false);
    }
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();
    if (!validateManualForm()) return;

    try {
      const res = await fetch(`${API_BASE}/records/manual/${editingRecordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orgName: currentUser?.orgName || "",
          date: formState.date,
          account: formState.account,
          accountType: formState.accountType,
          amount: Number(formState.amount),
          category: formState.category,
          description: formState.description,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.message || "Failed to update record");
      }

      await Promise.all([loadRecords(), loadFinanceSetup()]);
      closeModals();
    } catch (err) {
      showErrorMessage(err.message, "Failed to update record");
    }
  };

  const openDeleteModal = (row) => {
    setRecordPendingDelete(row);
  };

  const closeDeleteModal = () => {
    if (deletingRecord) return;
    setRecordPendingDelete(null);
  };

  const handleDeleteRecord = async () => {
    const recordId =
      recordPendingDelete?.__recordDocId || recordPendingDelete?.__recordId;
    if (!recordId) return;

    try {
      setDeletingRecord(true);
      const res = await fetch(`${API_BASE}/records/${recordId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orgName: currentUser?.orgName || "",
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.message || "Failed to delete record");
      }

      setDbRecords((current) =>
        current.filter((record) => String(record?._id) !== String(recordId)),
      );
      await loadFinanceSetup();
      setRecordPendingDelete(null);
    } catch (err) {
      setRecordPendingDelete(null);
      setDeleteErrorMessage(err.message || "Failed to delete record");
    } finally {
      setDeletingRecord(false);
    }
  };

  const selectedEditableRow =
    allRows.find(
      (row) => (row.__recordDocId || row.__recordId) === editingRecordId,
    ) || null;

  const manualRecordCount = allRows.filter((row) => row.__isManual).length;
  const recordMetrics = useMemo(() => {
    return allRows.reduce(
      (totals, row) => {
        const accountType = String(
          row?.accountType || row?.["Account Type"] || "",
        )
          .toLowerCase()
          .trim();
        const category = String(row?.category || row?.Category || "")
          .toLowerCase()
          .trim();
        const amount = Number(row?.amount ?? row?.Amount ?? 0);
        const safeAmount = Number.isFinite(amount) ? amount : 0;

        if (accountType === "equity" && category === "capital") {
          totals.totalInvestment += safeAmount;
        }

        if (accountType === "revenue" || accountType === "income") {
          totals.totalRevenue += safeAmount;
        }

        if (accountType === "expense") {
          totals.totalExpenses += safeAmount;
        }

        return totals;
      },
      {
        totalInvestment: 0,
        totalRevenue: 0,
        totalExpenses: 0,
      },
    );
  }, [allRows]);
  const totalInvestment = recordMetrics.totalInvestment;
  const totalAmountMade = recordMetrics.totalRevenue;
  const totalSpent = Math.abs(recordMetrics.totalExpenses);
  const remainingFunds =
    recordMetrics.totalInvestment +
    recordMetrics.totalRevenue +
    recordMetrics.totalExpenses;
  const monthlyBudget = financeSetup?.monthlyBudget || 0;
  const formatMoney = (value) =>
    `Rs. ${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <>
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
              All CSV/Excel imports plus online checkout records are shown in
              one table, so you can review every row from a single page.
            </p>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BanknotesIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Owner Investment
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {loading ? "Loading..." : formatMoney(totalInvestment)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatMoney(remainingFunds)} remaining.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openInvestmentModal}
                  disabled={!isOrgAdmin}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Investment
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <BanknotesIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Total Amount Made
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {loading ? "Loading..." : formatMoney(totalAmountMade)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatMoney(totalSpent)} spent from available funds.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <CalculatorIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Monthly Budget
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {financeLoading ? "Loading..." : formatMoney(monthlyBudget)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {financeSetup?.budgetHistory?.length || 0} budget update{financeSetup?.budgetHistory?.length === 1 ? "" : "s"} saved
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openBudgetModal}
                  disabled={!isOrgAdmin}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <CalculatorIcon className="h-5 w-5" />
                  Set Budget
                </button>
              </div>
            </div>
          </div>

          {financeError ? (
            <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {financeError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Data Sources
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {fileOptions.length}
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
                    onClick={loadRecords}
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
                    onClick={handleRecalculateRecords}
                    disabled={!isOrgAdmin || recalculating}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowPathIcon className={`h-5 w-5 ${recalculating ? "animate-spin" : ""}`} />
                    Recalculate
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
                      aria-label="Filter by source"
                    >
                      <option value="all">All Sources</option>
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
                  No rows found. Import a CSV/Excel file or place FruityGo
                  orders to see records here.
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
                              {column === "__fileType"
                                ? "Source"
                                : column === "__importedOn"
                                  ? "Imported On"
                                  : column === "accountType"
                                    ? "Account Type"
                                    : column.charAt(0).toUpperCase() +
                                      column.slice(1)}
                            </th>
                          ))}
                          <th className="sticky right-0 z-10 w-[104px] whitespace-nowrap border-l border-slate-100 bg-slate-50 px-4 py-3 text-center font-medium shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
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
                                className={`whitespace-nowrap px-4 py-3 ${
                                  column === "amount"
                                    ? getAmountTextClass(row)
                                    : "text-slate-700"
                                }`}
                              >
                                {column === "__importedOn" ? (
                                  formatImportedOn(row[column])
                                ) : column === "amount" ? (
                                  Number(row[column] || 0).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )
                                ) : column === "description" ? (
                                  <DescriptionCell value={row[column]} />
                                ) : (
                                  normalizeValue(row[column])
                                )}
                              </td>
                            ))}
                            <td className="sticky right-0 w-[104px] whitespace-nowrap border-l border-slate-100 bg-white px-4 py-3 text-slate-700 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(row)}
                                  disabled={!row.__isManual}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Edit record ${normalizeValue(row.description || row.Description || row.__recordId)}`}
                                  title="Edit record"
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(row)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 text-rose-600 transition hover:bg-rose-50"
                                  aria-label={`Delete record ${normalizeValue(row.description || row.Description || row.__recordId)}`}
                                  title="Delete record"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
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
                      {manualRecordCount > 0
                        ? ` ${manualRecordCount} manual record${manualRecordCount === 1 ? "" : "s"} can be edited.`
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
                      <span className="h-7 rounded-full bg-emerald-600 px-3 text-xs font-medium leading-7 text-white">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
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
          errors={formErrors}
          onChange={updateFormField}
          onClose={closeModals}
          onSubmit={handleAddRecord}
          submitDisabled={false}
        />

        <RecordModal
          isOpen={Boolean(editingRecordId)}
          mode="edit"
          form={formState}
          errors={formErrors}
          onChange={updateFormField}
          onClose={closeModals}
          onSubmit={handleEditRecord}
          submitDisabled={!selectedEditableRow}
        />
        <InvestmentModal
          isOpen={isInvestmentModalOpen}
          form={investmentForm}
          onChange={updateInvestmentField}
          onClose={closeModals}
          onSubmit={handleAddInvestment}
          submitDisabled={savingInvestment}
        />
        <BudgetModal
          isOpen={isBudgetModalOpen}
          form={budgetForm}
          onChange={updateBudgetField}
          onClose={closeModals}
          onSubmit={handleSaveBudget}
          submitDisabled={savingBudget}
        />
        <ConfirmDeleteModal
          isOpen={Boolean(recordPendingDelete)}
          title="Delete record?"
          message="Are you sure you want to delete this record?"
          itemLabel={normalizeValue(
            recordPendingDelete?.description ||
              recordPendingDelete?.Description ||
              recordPendingDelete?.transactionId ||
              recordPendingDelete?.__recordDocId,
          )}
          deleting={deletingRecord}
          onCancel={closeDeleteModal}
          onConfirm={handleDeleteRecord}
        />
        <DeleteErrorModal
          message={deleteErrorMessage}
          onClose={() => setDeleteErrorMessage("")}
        />
        <SpendingLimitModal
          message={spendingLimitMessage}
          onClose={() => setSpendingLimitMessage("")}
        />
      </div>
      <Footer />
    </>
  );
}
