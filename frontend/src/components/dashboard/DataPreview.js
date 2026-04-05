import React from 'react';

const DataPreview = ({ importDetail, loadingDetail }) => {
  if (!importDetail?.previewRows || importDetail.previewRows.length === 0) return null;
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Data Preview</h2>
        <span className="text-xs text-slate-400">Showing {Math.min(importDetail.previewRows.length, 10)} of {importDetail.records} records</span>
      </div>
      <div className="overflow-auto rounded-2xl border border-slate-100">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50">{importDetail.columns.map((col) => (
              <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{col}</th>
            ))}</tr>
          </thead>
          <tbody>
            {importDetail.previewRows.slice(0, 10).map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                {importDetail.columns.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{String(row[col] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataPreview;
