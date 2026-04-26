import React, { memo, useState, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import Plot from 'react-plotly.js';
import { downloadChart } from '../../utils/chartUtils';
import { formatChartCurrency } from '../../utils/financialData';

const TrendWidget = memo(function TrendWidget({ trendData = [], mounted, loadingDetail, selectedImportId, periodLabel }) {
  const [chartType, setChartType] = useState('line');
  const chartId = `trend-chart-${selectedImportId || 'local'}`;

  const ohlc = useMemo(() => {
    return trendData.map((d) => {
      const base = Number(d.Revenue || 0);
      const variance = Math.max(1, Math.abs(Number(d.Revenue || 0) - Number(d.Expenses || 0)) * 0.2);
      const open = +(base - variance * 0.2).toFixed(2);
      const close = +base.toFixed(2);
      const high = +Math.max(base, base + variance * 0.5).toFixed(2);
      const low = +Math.min(base, base - variance * 0.5).toFixed(2);
      return { x: d.name, open, high, low, close };
    });
  }, [trendData]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Income vs Expense Trend</h2>
          <p className="text-sm text-slate-500">{periodLabel || "Monthly view"}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="px-3 py-2 rounded border bg-white text-sm">
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="waterfall">Waterfall</option>
            <option value="boxplot">Box Plot</option>
            <option value="candlestick">Candlestick</option>
          </select>

          <button onClick={() => downloadChart(chartId, `${chartId}.jpg`)} aria-label="Download chart" title="Download chart" className="p-2 rounded border bg-white hover:bg-slate-50 text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 md:h-80">
        {trendData.length > 0 && mounted ? (
          <>
            {chartType === 'line' && (
              <Line id={chartId} data={{ labels: trendData.map((d) => d.name), datasets: [ { label: 'Income', data: trendData.map((d) => d.Revenue), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', fill: true, tension: 0.3 }, { label: 'Expenses', data: trendData.map((d) => d.Expenses), borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.12)', fill: true, tension: 0.3 } ] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatChartCurrency(context.parsed.y)}` } } }, scales: { y: { ticks: { callback: (value) => formatChartCurrency(value) } } } }} />
            )}

            {chartType === 'area' && (
              <Line id={chartId} data={{ labels: trendData.map((d) => d.name), datasets: [ { label: 'Income', data: trendData.map((d) => d.Revenue), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.28)', fill: 'start', tension: 0.3 }, { label: 'Expenses', data: trendData.map((d) => d.Expenses), borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.18)', fill: 'start', tension: 0.3 } ] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatChartCurrency(context.parsed.y)}` } } }, scales: { y: { ticks: { callback: (value) => formatChartCurrency(value) } } } }} />
            )}

            {chartType === 'bar' && (
              <Bar id={chartId} data={{ labels: trendData.map((d) => d.name), datasets: [ { label: 'Income', data: trendData.map((d) => d.Revenue), backgroundColor: '#10b981' }, { label: 'Expenses', data: trendData.map((d) => d.Expenses), backgroundColor: '#f97316' } ] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatChartCurrency(context.parsed.y)}` } } }, scales: { y: { ticks: { callback: (value) => formatChartCurrency(value) } } } }} />
            )}

            {chartType === 'waterfall' && (
              <div id={chartId} style={{ width: '100%', height: '100%' }}>
                <Plot data={[ { type: 'waterfall', measure: trendData.map(() => 'relative'), x: trendData.map((d) => d.name), y: trendData.map((d) => d.Revenue - d.Expenses), text: trendData.map((d) => formatChartCurrency(d.Revenue - d.Expenses)), decreasing: { marker: { color: '#ef4444' } }, increasing: { marker: { color: '#10b981' } } } ]} layout={{ autosize: true, margin: { t: 30, b: 40, l: 40, r: 20 }, yaxis: { tickprefix: 'NPR ' } }} useResizeHandler style={{ width: '100%', height: '100%' }} config={{ responsive: true }} />
              </div>
            )}

            {chartType === 'boxplot' && (
              <div id={chartId} style={{ width: '100%', height: '100%' }}>
                <Plot data={[ { y: trendData.map((d) => d.Revenue), type: 'box', name: 'Income', marker: { color: '#10b981' } }, { y: trendData.map((d) => d.Expenses), type: 'box', name: 'Expenses', marker: { color: '#f97316' } } ]} layout={{ autosize: true, margin: { t: 30, b: 40, l: 40, r: 20 } }} useResizeHandler style={{ width: '100%', height: '100%' }} config={{ responsive: true }} />
              </div>
            )}

            {chartType === 'candlestick' && (
              <div id={chartId} style={{ width: '100%', height: '100%' }}>
                <Plot data={[ { x: ohlc.map((p) => p.x), open: ohlc.map((p) => p.open), high: ohlc.map((p) => p.high), low: ohlc.map((p) => p.low), close: ohlc.map((p) => p.close), type: 'candlestick', increasing: { line: { color: '#10b981' } }, decreasing: { line: { color: '#ef4444' } } } ]} layout={{ autosize: true, margin: { t: 30, b: 40, l: 40, r: 20 } }} useResizeHandler style={{ width: '100%', height: '100%' }} config={{ responsive: true }} />
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">{loadingDetail ? 'Loading Chart...' : 'No trend data available'}</div>
        )}
      </div>
    </div>
  );
});

export default TrendWidget;
