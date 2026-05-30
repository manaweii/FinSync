import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const sanitizeAmountInput = (value) => {
  const cleaned = String(value || "").replace(/[^\d.-]/g, "");
  const sign = cleaned.startsWith("-") ? "-" : "";
  const unsigned = cleaned.replace(/-/g, "");
  const [whole = "", ...decimalParts] = unsigned.split(".");
  const decimal = decimalParts.join("");
  return `${sign}${whole}${decimalParts.length > 0 ? `.${decimal}` : ""}`;
};

const getInputClass = (hasError) =>
  `w-full rounded-3xl border px-5 py-4 text-lg text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
  }`;

export function InvestmentModal({
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
            <h3
              id="investment-title"
              className="text-2xl font-semibold text-slate-900"
            >
              Add Investment
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              This creates a balanced journal entry: debit cash and credit owner
              equity.
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
            onChange={(e) =>
              onChange("amount", sanitizeAmountInput(e.target.value))
            }
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
          <div className="flex justify-center w-full col-span-full mt-4">
            <button
              type="submit"
              disabled={submitDisabled}
              className="rounded-3xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-3.5 text-xl font-semibold text-white shadow-lg transition hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
