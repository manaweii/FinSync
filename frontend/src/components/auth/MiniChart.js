import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

const MiniChart = () => {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue",
        data: [45000, 52000, 48000, 60000, 70000, 75000],
        borderColor: "#14B8A6",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#14B8A6",
        pointBorderWidth: 2,
      },
      {
        label: "Expenses",
        data: [32000, 35000, 33000, 38000, 42000, 45000],
        borderColor: "#1215d1ff",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#1215d1ff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, 
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => value / 1000 + "K",
          font: { size: 10 },
        },
        grid: {
          borderDash: [4, 4],
          color: "#E5E7EB",
        },
      },
      x: {
        ticks: {
          font: { size: 10 },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default MiniChart;