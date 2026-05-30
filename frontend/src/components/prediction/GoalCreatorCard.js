import { FlagIcon } from "@heroicons/react/24/outline";

export default function GoalCreatorCard({ form, onChange, onSubmit, saving, message }) {
  const metrics = [
    { value: "profit", label: "Profit" },
    { value: "revenue", label: "Revenue" },
    { value: "expenses", label: "Expense Limit" },
  ];

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-indigo-50 p-2 text-indigo-600" aria-hidden="true">
          <FlagIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Goal Creator</h3>
          <p className="text-xs text-slate-400">Set a target with a deadline</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="goal-title"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Goal Name
          </label>
          <input
            id="goal-title"
            type="text"
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="e.g. Q3 Revenue Target"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-300 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            required
            aria-required="true"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Metric Type
          </legend>
          <div className="flex flex-wrap gap-2" role="group">
            {metrics.map((metric) => {
              const isSelected = form.metric === metric.value;
              return (
                <button
                  key={metric.value}
                  type="button"
                  onClick={() => onChange("metric", metric.value)}
                  aria-pressed={isSelected}
                  className={`rounded-2xl border px-4 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isSelected
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {metric.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="goal-amount"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Target Amount
            </label>
            <div className="relative flex items-center">
              <span
                className="pointer-events-none absolute left-4 select-none text-xs font-semibold text-slate-400"
                aria-hidden="true"
              >
                NPR
              </span>
              <input
                id="goal-amount"
                type="number"
                min="1"
                step="1"
                value={form.targetValue}
                onChange={(e) => onChange("targetValue", e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 py-3 pl-14 pr-4 text-sm text-slate-700 placeholder-slate-300 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                required
                aria-required="true"
                aria-label="Target amount in Nepalese Rupees"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="goal-deadline"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Deadline
            </label>
            <input
              id="goal-deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => onChange("deadline", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              required
              aria-required="true"
              aria-label="Goal deadline date"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-indigo-600 hover:to-cyan-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          aria-busy={saving}
        >
          {saving ? "Saving…" : "Save Goal"}
        </button>

        {message && (
          <p
            role="status"
            aria-live="polite"
            className={`text-xs font-medium ${
              message.toLowerCase().includes("success")
                ? "text-emerald-600"
                : "text-rose-500"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
