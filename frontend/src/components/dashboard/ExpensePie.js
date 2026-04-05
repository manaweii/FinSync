import React from 'react';
import { Pie } from 'react-chartjs-2';

const PIE_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

const ExpensePie = ({ expenseBreakdown = [], mounted, loadingDetail }) => {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Expense Breakdown</h2>
      </div>
      <div className="h-64 sm:h-72 md:h-80">
        {expenseBreakdown.length > 0 && mounted ? (
          <Pie data={{ labels: expenseBreakdown.map((item) => item.name), datasets: [ { data: expenseBreakdown.map((item) => item.value), backgroundColor: PIE_COLORS, borderWidth: 2, borderColor: '#ffffff' } ] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 20, font: { size: 12 } }, }, tooltip: { callbacks: { label: (context) => `$${context.parsed.toLocaleString()}` } }, }, cutout: '50%', }} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">{loadingDetail ? 'Loading Chart...' : 'No expense data available'}</div>
        )}
      </div>
    </div>
  );
};

export default ExpensePie;
