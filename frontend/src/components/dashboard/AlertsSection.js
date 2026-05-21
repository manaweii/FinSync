import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const formatCurrency = (value) =>
  `Rs. ${new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;

const formatMetric = (metric) => {
  if (metric === "revenue") return "revenue";
  if (metric === "profit") return "profit";
  if (metric === "expenses") return "expenses";
  return metric || "value";
};

// 1. REUSABLE ICON COMPONENT (No libraries needed)
const StatusIcon = ({ type }) => {
  if (type === "milestone") {
    return (
      <svg
        className="w-5 h-5 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    );
  }
  if (type === "danger") {
    return (
      <svg
        className="w-5 h-5 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  }
  // Default Warning Icon
  return (
    <svg
      className="w-5 h-5 text-orange-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
};

export default function AlertsSection() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const [predictionData, setPredictionData] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!currentUser?.orgId) {
        setPredictionData(null);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/predictions/${currentUser.orgId}?months=6`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setPredictionData(data);
      } catch (error) {
        console.error("Failed to load alert predictions:", error);
      }
    };

    fetchPredictions();
  }, [currentUser?.orgId, token]);

  const milestone = predictionData?.milestoneProjections?.[0] || null;
  const anomaly = predictionData?.insights?.anomalies?.[0] || null;

  const milestoneAlert = useMemo(() => {
    if (!milestone) {
      return {
        title: "No milestones yet",
        message: "Add a milestone in Predictions to see forecasted targets.",
        timeLabel: "Prediction data",
      };
    }

    if (milestone.reached) {
      return {
        title: milestone.title || "Milestone forecast available",
        message: `Predicted to reach ${formatCurrency(milestone.targetValue)} ${formatMetric(milestone.metric)} by ${milestone.predictedLabel}.`,
        timeLabel: milestone.predictedLabel
          ? `Target month: ${milestone.predictedLabel}`
          : "Prediction data",
      };
    }

    return {
      title: milestone.title || "Milestone forecast pending",
      message: `No predicted month yet for ${formatCurrency(milestone.targetValue)} ${formatMetric(milestone.metric)}.`,
      timeLabel: "Prediction data",
    };
  }, [milestone]);

  const anomalyAlert = useMemo(() => {
    if (!anomaly) {
      return {
        title: "No unusual spending detected",
        message: "No anomaly was found in your current transaction history.",
        timeLabel: "Prediction data",
      };
    }

    return {
      title: anomaly.label || "Unusual spending detected",
      message: anomaly.message || "An unusual expense spike was detected.",
      timeLabel: anomaly.month || "Prediction data",
    };
  }, [anomaly]);

  return (
    <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Alerts & Anomalies
          </h2>
          <p className="text-[11px] text-slate-400">Important notifications</p>
        </div>
        <div>
          <button
            onClick={() => navigate("/predictions")}
            className="text-teal-600 text-xs font-semibold hover:underline"
          >
            View all
          </button>
        </div>
      </div>

      {/* Alerts Container */}
      <div className="space-y-3">
        {/* 1. Revenue Milestone (From your latest attachment) */}
        <div
          onClick={() => navigate("/predictions")}
          className="flex gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 group cursor-pointer hover:bg-blue-100/50 transition-all"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <StatusIcon type="milestone" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-sm font-semibold text-blue-900 leading-tight">
                {milestoneAlert.title}
              </h4>
            </div>
            <p className="text-xs leading-tight text-blue-700 mt-0.5">
              {milestoneAlert.message}
            </p>
            <span className="text-[10px] text-blue-400 mt-1 block">
              {milestoneAlert.timeLabel}
            </span>
          </div>
        </div>

        {/* 2. Unusual Spending Alert */}
        <div
          onClick={() => navigate("/predictions")}
          className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-100 group cursor-pointer hover:bg-red-100/50 transition-all"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <StatusIcon type="danger" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900 leading-tight">
              {anomalyAlert.title}
            </h4>
            <p className="text-xs leading-tight text-red-700 mt-0.5">
              {anomalyAlert.message}
            </p>
            <span className="text-[10px] text-red-400 mt-1 block">
              {anomalyAlert.timeLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
