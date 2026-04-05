import React from 'react';
import { Bar } from 'react-chartjs-2';

const PIE_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

const CategoryBar = ({ categoryData = [], mounted, loadingDetail }) => {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Revenue by Category</h2>
      <div className="h-56 sm:h-72 md:h-80">
        {categoryData.length > 0 && mounted ? (
          <Bar data={{ labels: categoryData.map((item) => item.name), datasets: [ { label: 'Revenue', data: categoryData.map((item) => item.Revenue), backgroundColor: PIE_COLORS, borderRadius: 8, borderSkipped: false } ] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `$${context.parsed.y.toLocaleString()}` } } }, scales: { y: { ticks: { callback: (value) => `$${(value / 1000).toFixed(0)}K` }, grid: { color: '#e2e8f0' } }, x: { grid: { display: false }, ticks: { font: { size: 12 } } } } }} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">{loadingDetail ? 'Loading Chart...' : 'No category data available'}</div>
        )}
      </div>
    </div>
  );
};

export default CategoryBar;
