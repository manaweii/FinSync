import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function DeleteErrorModal({ message, onClose }) {
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

export function SpendingLimitModal({ message, onClose }) {
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
