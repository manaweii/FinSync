import React from "react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";

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

export default function RecordModal({
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

          <div className="flex justify-center w-full col-span-full mt-4">
            <button
              type="submit"
              disabled={submitDisabled}
              className="rounded-3xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-3.5 text-xl font-semibold text-white shadow-lg transition hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEdit ? "Save Changes" : "Add Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
