export default function PredictionStatusBadge({ status }) {
  if (!status) return null;
  const Icon = status.icon;

  return (
    <span
      role="status"
      aria-label={`Performance status: ${status.label}`}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${status.color}`}
    >
      <Icon className="h-4 w-4 stroke-2" aria-hidden="true" />
      {status.label}
    </span>
  );
}
