import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export const getStatusFromGoal = (actualValue, targetValue) => {
  if (!targetValue || targetValue <= 0) return null;

  const ratio = actualValue / targetValue;
  if (ratio >= 1) {
    return {
      label: "Goal Met",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: ShieldCheckIcon,
    };
  }

  if (ratio >= 0.8) {
    return {
      label: "Near Goal",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: ShieldExclamationIcon,
    };
  }

  return {
    label: "Below Goal",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: ExclamationTriangleIcon,
  };
};

export default function StatusBadge({ actual = 0, goal = 0, status }) {
  const derivedStatus = status || getStatusFromGoal(actual, goal);
  if (!derivedStatus) return null;

  const Icon = derivedStatus.icon;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${derivedStatus.color}`}
    >
      <Icon className="h-5 w-5 stroke-[2px]" />
      <span>{derivedStatus.label}</span>
    </div>
  );
}
