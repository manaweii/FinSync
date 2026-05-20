export default function GoalProgressBar({
  actual,
  target,
  label,
  metric = "profit",
  metricLabel,
  formatCurrency,
}) {
  const normalizedMetric = metric === "expense" ? "expenses" : metric;
  const safeTarget = Math.max(Number(target) || 0, 1);
  const rawProgress =
    normalizedMetric === "expenses"
      ? (safeTarget / Math.max(actual, 1)) * 100
      : (actual / safeTarget) * 100;
  const pct = Math.min(Math.round(rawProgress), 100);
  const barColor =
    pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="max-w-[65%] truncate text-xs font-medium text-slate-600">
          {label}
        </span>
        <span className="tabular-nums text-xs font-bold text-slate-800">{pct}%</span>
      </div>
      <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-400">
        {metricLabel || normalizedMetric}
      </p>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Goal progress for ${label}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="tabular-nums text-[10px] text-slate-400">
          {formatCurrency(actual)}
        </span>
        <span className="tabular-nums text-[10px] text-slate-400">
          {formatCurrency(target)}
        </span>
      </div>
    </div>
  );
}
