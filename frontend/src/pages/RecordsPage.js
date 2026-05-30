import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FinancialControlPanel from "../components/records/FinancialControlPanel";
import Footer from "../components/homepage/Footer";
import ConfirmDeleteModal from "../components/auth/ConfirmDeleteModal";
import RecordModal from "../components/records/RecordModal";
import { InvestmentModal } from "../components/records/FinanceSetupModals";
import {
  DeleteErrorModal,
  SpendingLimitModal,
} from "../components/records/RecordFeedbackModals";
import RecordsPageHeading from "../components/records/RecordsPageHeading";
import RecordsSummaryCards from "../components/records/RecordsSummaryCards";
import RecordsTablePanel from "../components/records/RecordsTablePanel";
import useAuthStore from "../store/useAuthStore";
import {
  buildRowsFromDatabaseRecords,
  buildSourceOptionsFromRows,
  RECORDS_VISIBLE_COLUMNS,
} from "../utils/recordsData";
import { isAdminRole } from "../utils/roles";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const RECORDS_PER_PAGE = 8;

const getLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultFormState = {
  date: "",
  account: "",
  accountType: "Expense",
  amount: "",
  category: "",
  description: "",
};

const defaultInvestmentFormState = {
  date: getLocalDateInputValue(),
  amount: "",
  cashAccount: "Cash at Bank",
  equityAccount: "Company Capital",
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

const parseRowTime = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
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
    const fileTime = parseRowTime(fileDate);
    if (fileTime !== null) {
      return fileTime;
    }
  }

  const candidates = [
    row.parsedDate,
    row.transactionDate,
    row.date,
    row.__importedOn,
    row.createdAt,
  ];
  for (const value of candidates) {
    const time = parseRowTime(value);
    if (time !== null) return time;
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

export default function RecordsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const isOrgAdmin = isAdminRole(currentUser?.role);

  const [dbRecords, setDbRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  const [investmentForm, setInvestmentForm] = useState(defaultInvestmentFormState);
  const [savingInvestment, setSavingInvestment] = useState(false);
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

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

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

      await loadRecords();
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

      await loadRecords();
      closeModals();
    } catch (err) {
      alert(err.message || "Failed to add investment");
    } finally {
      setSavingInvestment(false);
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
      await loadRecords();
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

      await loadRecords();
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
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50/40 to-slate-50 py-12 px-4">
        <div className="mx-auto w-full max-w-7xl px-4">
          <RecordsPageHeading />

          <FinancialControlPanel
            loading={loading}
            allRows={allRows}
            isOrgAdmin={isOrgAdmin}
            totalInvestment={totalInvestment}
            remainingFunds={remainingFunds}
            totalAmountMade={totalAmountMade}
            totalSpent={totalSpent}
            onOpenInvestmentModal={openInvestmentModal}
          />

          <RecordsSummaryCards
            dataSourceCount={fileOptions.length}
            totalRows={allRows.length}
            showingRows={filteredRows.length}
          />

          <RecordsTablePanel
            loading={loading}
            error={error}
            filteredRows={filteredRows}
            paginatedRows={paginatedRows}
            visibleColumns={visibleColumns}
            fileOptions={fileOptions}
            fileTypeOptions={fileTypeOptions}
            search={search}
            selectedFile={selectedFile}
            selectedFileType={selectedFileType}
            selectedImportedOn={selectedImportedOn}
            currentPage={currentPage}
            totalPages={totalPages}
            manualRecordCount={manualRecordCount}
            recalculating={recalculating}
            isOrgAdmin={isOrgAdmin}
            onSearchChange={setSearch}
            onSelectedFileChange={setSelectedFile}
            onSelectedFileTypeChange={setSelectedFileType}
            onSelectedImportedOnChange={setSelectedImportedOn}
            onClearFilters={() => {
              setSearch("");
              setSelectedFile("all");
              setSelectedFileType("all");
              setSelectedImportedOn("");
            }}
            onRefresh={loadRecords}
            onExport={exportRowsToCsv}
            onRecalculate={handleRecalculateRecords}
            onAddRecord={openAddModal}
            onEditRecord={openEditModal}
            onDeleteRecord={openDeleteModal}
            onPageChange={setCurrentPage}
            normalizeValue={normalizeValue}
            formatImportedOn={formatImportedOn}
            getAmountTextClass={getAmountTextClass}
          />
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
