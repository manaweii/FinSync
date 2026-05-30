import { useEffect, useMemo, useState } from "react";
import Footer from "../components/homepage/Footer";
import {
  BellAlertIcon,
  SparklesIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import useAuthStore from "../store/useAuthStore";
import InsightCard from "../components/prediction/InsightCard";
import PredictionStatusBadge from "../components/prediction/PredictionStatusBadge";
import GoalProgressBar from "../components/prediction/GoalProgressBar";
import GoalCreatorCard from "../components/prediction/GoalCreatorCard";
import HistoricalGoals from "../components/prediction/HistoricalGoals";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const EMPTY_LIST = [];

const defaultMilestone = {
  title: "",
  metric: "profit",
  targetValue: "",
  deadline: "",
};

const METRIC_CONFIG = {
  profit: { label: "Profit" },
  revenue: { label: "Revenue" },
  expenses: { label: "Expenses" },
};

const normalizeMetric = (metric) => {
  if (metric === "expense") return "expenses";
  return METRIC_CONFIG[metric] ? metric : "profit";
};

const getMetricLabel = (metric) => METRIC_CONFIG[normalizeMetric(metric)].label;

const getMetricValue = (snapshot, metric) =>
  Number(snapshot?.[normalizeMetric(metric)] || 0);

// Utilities 

const formatCurrency = (value) =>
  `NPR ${new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 0,
  }).format(value || 0)}`;

const buildChartData = (historical, forecast) => {
  const labels = [
    ...historical.map((item) => item.label),
    ...forecast.map((item) => item.label),
  ];
  const historicalProfit = historical.map((item) => item.profit);
  const predictedProfit = [
    ...Array(Math.max(historical.length - 1, 0)).fill(null),
    historical.length ? historical[historical.length - 1].profit : null,
    ...forecast.map((item) => item.profit),
  ];

  return {
    labels,
    datasets: [
      {
        label: "Actual",
        data: [...historicalProfit, ...Array(forecast.length).fill(null)],
        borderColor: "#0f766e",
        backgroundColor: "rgba(15,118,110,0.12)",
        borderWidth: 2.5,
        pointRadius: 3,
        tension: 0.35,
        fill: true,
      },
      {
        label: "Prediction",
        data: predictedProfit,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.08)",
        borderDash: [7, 6],
        borderWidth: 2.5,
        pointRadius: 3,
        tension: 0.35,
        fill: true,
      },
    ],
  };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        usePointStyle: true,
        padding: 18,
        font: { size: 12 },
      },
    },
    tooltip: {
      callbacks: {
        label: (context) =>
          `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
      },
    },
  },
  scales: {
    y: {
      ticks: { callback: (value) => formatCurrency(value), font: { size: 11 } },
      grid: { color: "rgba(148,163,184,0.14)" },
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
};

// Status derivation helpers 

const deriveStatus = (actual, expected) => {
  if (!expected) return null;
  const ratio = actual / expected;
  if (ratio >= 0.9)
    return {
      label: "On Track",
      threshold: ">= 90%",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: ShieldCheckIcon,
    };
  if (ratio >= 0.7)
    return {
      label: "At Risk",
      threshold: "70-89%",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: ShieldExclamationIcon,
    };
  return {
    label: "Off Track",
    threshold: "< 70%",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: ExclamationTriangleIcon,
  };
};

const deriveGoalStatus = (actual, target, metric) => {
  if (!target) return null;
  const normalizedMetric = normalizeMetric(metric);

  if (normalizedMetric === "expenses") {
    if (actual <= target)
      return {
        label: "On Budget",
        color: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: CheckCircleIcon,
      };
    if (actual <= target * 1.3)
      return {
        label: "Near Limit",
        color: "border-amber-200 bg-amber-50 text-amber-700",
        icon: ShieldExclamationIcon,
      };
    return {
      label: "Over Budget",
      color: "border-rose-200 bg-rose-50 text-rose-700",
      icon: ExclamationTriangleIcon,
    };
  }

  const ratio = actual / target;
  if (ratio >= 1)
    return {
      label: "Achieved",
      color: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircleIcon,
    };
  if (ratio >= 0.7)
    return {
      label: "At Risk",
      color: "border-amber-200 bg-amber-50 text-amber-700",
      icon: ShieldExclamationIcon,
    };
  return {
    label: "Off Track",
    color: "border-rose-200 bg-rose-50 text-rose-700",
    icon: ExclamationTriangleIcon,
  };
};

//  Main Page

export default function PredictionsPage() {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // UI state
  const [months, setMonths] = useState(6);
  const [milestoneForm, setMilestoneForm] = useState(defaultMilestone);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Data state
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data fetching
  const fetchPredictions = async () => {
    if (!currentUser?.orgId) {
      setError("Organization context is missing.");
      setPredictionData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/predictions/${currentUser.orgId}?months=${months}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load predictions");
      }

      const data = await response.json();
      setPredictionData(data);
    } catch (fetchError) {
      console.error("Predictions fetch error:", fetchError);
      setError(fetchError.message || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [currentUser?.orgId, months, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Milestone handlers
  const handleMilestoneChange = (field, value) => {
    setMilestoneForm((current) => ({ ...current, [field]: value }));
  };

  const handleMilestoneSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.orgId) {
      setSaveMessage("Organization context is missing.");
      return;
    }

    try {
      setSavingMilestone(true);
      setSaveMessage("");

      const parsedTargetValue = Number(milestoneForm.targetValue);
      if (!Number.isFinite(parsedTargetValue) || parsedTargetValue <= 0) {
        throw new Error("Enter a target amount greater than zero.");
      }

      const response = await fetch(`${API_BASE}/predictions/milestones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orgId: currentUser.orgId,
          userId: currentUser.id || currentUser._id,
          title: milestoneForm.title,
          metric: normalizeMetric(milestoneForm.metric),
          targetValue: parsedTargetValue,
          deadline: milestoneForm.deadline || null,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save milestone");
      }

      setMilestoneForm(defaultMilestone);
      setSaveMessage("Goal saved successfully.");
      await fetchPredictions();
    } catch (saveError) {
      console.error("Milestone save error:", saveError);
      setSaveMessage(saveError.message || "Failed to save goal");
    } finally {
      setSavingMilestone(false);
    }
  };

  // Derived data
  const historical = predictionData?.historical ?? EMPTY_LIST;
  const forecast = predictionData?.forecast ?? EMPTY_LIST;
  const milestoneProjections =
    predictionData?.milestoneProjections ?? EMPTY_LIST;
  const latestMilestoneProjections = milestoneProjections.slice(0, 3);
  const savedMilestones = predictionData?.milestones ?? EMPTY_LIST;
  const anomalies = predictionData?.insights?.anomalies ?? EMPTY_LIST;

  const chartData = useMemo(
    () => buildChartData(historical, forecast),
    [historical, forecast],
  );

  // Current performance status (actual vs first forecast point)
  const currentStatus = useMemo(() => {
    if (!historical.length || !forecast.length) return null;
    const actual = Number(historical[historical.length - 1]?.profit || 0);
    const expected = Number(forecast[0]?.profit || 0);
    return deriveStatus(actual, expected);
  }, [historical, forecast]);

  // Latest saved goal (for the active progress bar under the chart)
  const latestGoal = savedMilestones[0] || null;
  const latestSnapshot = historical.length
    ? historical[historical.length - 1]
    : null;
  const currentActualForLatestGoal = latestGoal
    ? getMetricValue(latestSnapshot, latestGoal.metric)
    : 0;
  const latestAnomalies = anomalies.slice(0, 3);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50/30 to-slate-50 py-12 px-4">
        {/* ── Page Header ── */}
        <div className="mb-2 text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
            Prediction
          </span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">
            Financial Predictions.
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
            View AI-powered forecasts for your income, expenses, and cash flow
            based on your imported transaction history to help you plan budgets
            and identify trends.
          </p>
        </div>

        <main className="mx-auto max-w-7xl space-y-6">
          {/* ── Loading state ── */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm"
            >
              <div
                className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500 mb-4"
                aria-hidden="true"
              />
              <p className="text-sm text-slate-500">
                Building prediction graph from your imported records…
              </p>
            </div>
          ) : error ? (
            /* ── Error state ── */
            <div
              role="alert"
              className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-rose-700">{error}</p>
            </div>
          ) : (
            <>
              {/* ── Main two-column grid ── */}
              <div className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
                {/* ── Left column: Chart + Status section ── */}
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  {/* Chart controls header */}
                  <div className="mb-8 flex flex-col gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Profit Predictions
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                        Actual profit trend vs. AI-predicted profit based on
                        imported records.
                      </p>
                    </div>

                    <label className="w-full max-w-xs">
                      <span className="mb-2 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Forecast Horizon
                      </span>
                      <select
                        value={months}
                        onChange={(e) => setMonths(Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        aria-label="Select forecast horizon in months"
                      >
                        <option value={3}>Next 3 months</option>
                        <option value={6}>Next 6 months</option>
                        <option value={9}>Next 9 months</option>
                        <option value={12}>Next 12 months</option>
                      </select>
                    </label>
                  </div>

                  {/* Chart */}
                  <div className="h-[460px]">
                    <Line data={chartData} options={chartOptions} />
                  </div>

                  {/* ── Status section (directly under chart) ── */}
                  <div className="mt-6 pt-6 border-t border-slate-100 space-y-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Current Performance Status
                      </p>

                      {/* Active status badge + last recorded value */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <PredictionStatusBadge status={currentStatus} />
                        <div className="text-right">
                          <p className="text-xs text-slate-400">
                            Based on most recent actuals vs. trend
                          </p>
                          {historical.length > 0 && (
                            <p className="mt-0.5 text-sm font-semibold text-slate-700 tabular-nums">
                              Last recorded:{" "}
                              {formatCurrency(
                                historical[historical.length - 1].profit,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Slim progress bar toward the most-recent active goal */}
                    {latestGoal && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                          Active Goal Progress
                        </p>
                        <GoalProgressBar
                          actual={currentActualForLatestGoal}
                          target={Number(latestGoal.targetValue)}
                          label={latestGoal.title}
                          deadline={latestGoal.deadline}
                          metric={latestGoal.metric}
                          metricLabel={getMetricLabel(latestGoal.metric)}
                          formatCurrency={formatCurrency}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-6">
                  {/* AI Insights */}
                  <InsightCard icon={SparklesIcon} title="AI Insights">
                    <div className="space-y-3">
                      {latestMilestoneProjections.length ? (
                        latestMilestoneProjections.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <p className="font-semibold text-slate-800">
                              {milestone.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                              {milestone.reached
                                ? `Predicted to reach ${formatCurrency(
                                    milestone.targetValue,
                                  )} ${getMetricLabel(milestone.metric)} by ${
                                    milestone.predictedLabel
                                  }.`
                                : `No predicted date yet for ${formatCurrency(
                                    milestone.targetValue,
                                  )} ${getMetricLabel(milestone.metric)}.`}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Add a goal below to see when your target may be
                          reached.
                        </p>
                      )}
                    </div>
                  </InsightCard>

                  {/* Unusual Spikes */}
                  <InsightCard icon={BellAlertIcon} title="Unusual Spikes">
                    <div className="space-y-3">
                      {latestAnomalies.length ? (
                        latestAnomalies.map((anomaly, index) => (
                          <div
                            key={`${anomaly.month}-${index}`}
                            className="rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <p className="font-semibold text-slate-800">
                              {anomaly.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                              {anomaly.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          No unusual spending spikes detected from the current
                          historical timeline.
                        </p>
                      )}
                    </div>
                  </InsightCard>

                  {/* Goal Creator (replaces old "Add Milestone" card) */}
                  <GoalCreatorCard
                    form={milestoneForm}
                    onChange={handleMilestoneChange}
                    onSubmit={handleMilestoneSubmit}
                    saving={savingMilestone}
                    message={saveMessage}
                  />
                </div>
              </div>

              {/* ── Historical Goal Performance — full width at page bottom ── */}
              {savedMilestones.length > 0 && (
                <HistoricalGoals
                  milestones={savedMilestones}
                  latestSnapshot={latestSnapshot}
                  formatCurrency={formatCurrency}
                  deriveGoalStatus={deriveGoalStatus}
                  getMetricLabel={getMetricLabel}
                  getMetricValue={getMetricValue}
                />
              )}
            </>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
