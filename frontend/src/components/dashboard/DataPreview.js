import React, { memo, useMemo } from 'react';

const PREVIEW_COLUMNS = ['date', 'account', 'accountType', 'amount', 'category', 'description'];
const EMPTY_ROWS = [];

const DataPreview = memo(function DataPreview({ importDetail, loadingDetail }) {
  const rows = importDetail?.rows || EMPTY_ROWS;

  const recentRows = useMemo(
    () =>
      [...rows]
        .sort((a, b) => {
          const aDate = a?.parsedDate || new Date(a?.date);
          const bDate = b?.parsedDate || new Date(b?.date);
          const aTime = Number.isNaN(aDate.getTime()) ? -Infinity : aDate.getTime();
          const bTime = Number.isNaN(bDate.getTime()) ? -Infinity : bDate.getTime();

          return bTime - aTime;
        })
        .slice(0, 10),
    [rows],
  );

  if (rows.length === 0) return null;

  const formatValue = (row, column) => {
    if (column === 'amount') {
      return Number(row?.[column] || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    const value = row?.[column];
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getColumnLabel = (column) => {
    if (column === 'accountType') return 'Account Type';
    return column.charAt(0).toUpperCase() + column.slice(1);
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Data Preview</h2>
        <span className="text-xs text-slate-400">Showing {recentRows.length} of {importDetail.records || rows.length} records</span>
      </div>
      <div className="overflow-auto rounded-2xl border border-slate-100">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50">{PREVIEW_COLUMNS.map((col) => (
              <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{getColumnLabel(col)}</th>
            ))}</tr>
          </thead>
          <tbody>
            {recentRows.map((row, i) => (
              <tr key={row.__recordId || i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                {PREVIEW_COLUMNS.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{formatValue(row, col)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default DataPreview;
