import { useEffect, useMemo, useState } from "react";
import {
  BellAlertIcon,
  CalendarDaysIcon,
  FlagIcon,
  SparklesIcon,
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const defaultMilestone = {
  title: "",
  metric: "profit",
  targetValue: "",
};

const formatCurrency = (value) =>
  `Rs. ${new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 0,
  }).format(value || 0)}`;

const buildChartData = (historical, forecast) => {
  const labels = [...historical.map((item) => item.label), ...forecast.map((item) => item.label)];
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
        backgroundColor: "rgba(15,118,110,0.14)",
        borderWidth: 3,
        pointRadius: 3,
        tension: 0.35,
      },
      {
        label: "Prediction",
        data: predictedProfit,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.14)",
        borderDash: [7, 6],
        borderWidth: 3,
        pointRadius: 3,
        tension: 0.35,
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
      },
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
      },
    },
  },
  scales: {
    y: {
      ticks: {
        callback: (value) => formatCurrency(value),
      },
      grid: {
        color: "rgba(148,163,184,0.16)",
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

function InsightCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="mt-4 text-sm text-slate-600">{children}</div>
    </div>
  );
}

export default function PredictionsPage() {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const [months, setMonths] = useState(6);
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [milestoneForm, setMilestoneForm] = useState(defaultMilestone);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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
  }, [currentUser?.orgId, months, token]);

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
          metric: milestoneForm.metric,
          targetValue: Number(milestoneForm.targetValue),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save milestone");
      }

      setMilestoneForm(defaultMilestone);
      setSaveMessage("Milestone saved.");
      await fetchPredictions();
    } catch (saveError) {
      console.error("Milestone save error:", saveError);
      setSaveMessage(saveError.message || "Failed to save milestone");
    } finally {
      setSavingMilestone(false);
    }
  };

  const historical = predictionData?.historical || [];
  const forecast = predictionData?.forecast || [];
  const milestoneProjections = predictionData?.milestoneProjections || [];
  const savedMilestones = predictionData?.milestones || [];
  const anomalies = predictionData?.insights?.anomalies || [];
  const chartData = useMemo(() => buildChartData(historical, forecast), [historical, forecast]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Predictions</p>
            <p className="mt-1 text-sm text-slate-400">
              Actual profit trend vs predicted profit based on imported records.
            </p>
          </div>

          <label className="w-full max-w-xs">
            <span className="mb-2 block text-sm text-slate-500">Forecast Horizon</span>
            <select
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            >
              <option value={3}>Next 3 months</option>
              <option value={6}>Next 6 months</option>
              <option value={9}>Next 9 months</option>
              <option value={12}>Next 12 months</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Building prediction graph from your imported records...
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-[460px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="space-y-6">
              <InsightCard icon={SparklesIcon} title="AI Insights">
                <div className="space-y-3">
                  {milestoneProjections.length ? (
                    milestoneProjections.map((milestone) => (
                      <div key={milestone.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="font-medium text-slate-800">{milestone.title}</p>
                        <p className="mt-1 text-slate-500">
                          {milestone.reached
                            ? `Predicted to reach ${formatCurrency(milestone.targetValue)} ${milestone.metric} by ${milestone.predictedLabel}.`
                            : `No predicted date yet for ${formatCurrency(milestone.targetValue)} ${milestone.metric}.`}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Add a milestone to see the predicted month when your target may be reached.
                    </p>
                  )}
                </div>
              </InsightCard>

              <InsightCard icon={BellAlertIcon} title="Unusual Spikes">
                <div className="space-y-3">
                  {anomalies.length ? (
                    anomalies.map((anomaly, index) => (
                      <div key={`${anomaly.month}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="font-medium text-slate-800">{anomaly.label}</p>
                        <p className="mt-1 text-slate-500">{anomaly.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      No unusual spending spikes detected from the current historical timeline.
                    </p>
                  )}
                </div>
              </InsightCard>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                    <FlagIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Add Milestone</h3>
                </div>

                <form className="mt-4 space-y-4" onSubmit={handleMilestoneSubmit}>
                  <input
                    type="text"
                    value={milestoneForm.title}
                    onChange={(event) => handleMilestoneChange("title", event.target.value)}
                    placeholder="Milestone title"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    required
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      value={milestoneForm.metric}
                      onChange={(event) => handleMilestoneChange("metric", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                      <option value="profit">Profit</option>
                      <option value="revenue">Revenue</option>
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={milestoneForm.targetValue}
                      onChange={(event) => handleMilestoneChange("targetValue", event.target.value)}
                      placeholder="Target amount"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingMilestone}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingMilestone ? "Saving..." : "Save Milestone"}
                  </button>

                  {saveMessage ? <p className="text-sm text-slate-500">{saveMessage}</p> : null}
                </form>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                    <CalendarDaysIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Saved Milestones</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {savedMilestones.length ? (
                    savedMilestones.map((milestone) => (
                      <div
                        key={milestone._id || milestone.id}
                        className="rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <p className="font-medium text-slate-800">{milestone.title}</p>
                        <p className="mt-1 text-slate-500">
                          Target {formatCurrency(milestone.targetValue)} {milestone.metric}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">No milestones saved yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
