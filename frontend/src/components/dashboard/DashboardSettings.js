import React from 'react';
import useDashboardSettings from '../../store/useDashboardSettings';

export default function DashboardSettings() {
  const {
    showKPIs,
    showTrend,
    showExpensePie,
    showCategoryBar,
    showDataPreview,
    toggle,
    reset,
  } = useDashboardSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 border">
        <h1 className="text-2xl font-semibold mb-4">Dashboard Settings</h1>
        <p className="text-sm text-slate-500 mb-4">Toggle which dashboard components should be visible.</p>

        <div className="space-y-3">
          {/* Toggle row - reusable style */}
          {[
            { key: 'showKPIs', title: 'Show KPI cards', subtitle: 'Revenue, Expenses, Profit, Cash', value: showKPIs },
            { key: 'showTrend', title: 'Show Revenue vs Expenses Trend', subtitle: 'Line chart showing revenue and expenses over time', value: showTrend },
            { key: 'showExpensePie', title: 'Show Expense Breakdown (Pie)', subtitle: '', value: showExpensePie },
            { key: 'showCategoryBar', title: 'Show Revenue by Category (Bar)', subtitle: '', value: showCategoryBar },
            { key: 'showDataPreview', title: 'Show Data Preview', subtitle: '', value: showDataPreview },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{item.title}</div>
                {item.subtitle && <div className="text-xs text-slate-500">{item.subtitle}</div>}
              </div>

              {/* Accessible switch-style toggle */}
              <button
                role="switch"
                aria-checked={item.value}
                onClick={() => toggle(item.key)}
                className={
                  `relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ` +
                  (item.value ? 'bg-teal-600 hover:bg-teal-500 focus:ring-teal-300' : 'bg-slate-200 hover:bg-slate-300 focus:ring-slate-200')
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
          ))}

          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => reset()} className="px-3 py-2 rounded border text-sm">Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
