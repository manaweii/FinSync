import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear } from 'date-fns';

// ReportFilters component
// Props:
// - filters: { preset, from, to, categories: [], regions: [] }
// - setFilters: function to update filters state
// - availableCategories / availableRegions (optional arrays)

export default function ReportFilters({ filters, setFilters, availableCategories = [], availableRegions = [] }) {
  const presets = [
    'This Month',
    'Last Month',
    'This Quarter',
    'Last Quarter',
    'YTD',
    'Last Year',
    'Custom'
  ];

  useEffect(() => {
    // ensure date strings are formatted yyyy-MM-dd for input fields
  }, []);

  const applyPreset = (preset) => {
    const today = new Date();
    let from = null;
    let to = null;

    switch (preset) {
      case 'This Month':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'Last Month': {
        const last = subMonths(today, 1);
        from = startOfMonth(last);
        to = endOfMonth(last);
        break;
      }
      case 'This Quarter':
        from = startOfQuarter(today);
        to = endOfQuarter(today);
        break;
      case 'Last Quarter': {
        const lastQ = subQuarters(today, 1);
        from = startOfQuarter(lastQ);
        to = endOfQuarter(lastQ);
        break;
      }
      case 'YTD':
        from = startOfYear(today);
        to = endOfYear(today);
        break;
      case 'Last Year': {
        const lastY = new Date(today.getFullYear() - 1, 0, 1);
        from = startOfYear(lastY);
        to = endOfYear(lastY);
        break;
      }
      case 'Custom':
      default:
        break;
    }

    setFilters((prev) => ({
      ...prev,
      preset,
      from: from ? format(from, 'yyyy-MM-dd') : prev.from,
      to: to ? format(to, 'yyyy-MM-dd') : prev.to,
    }));
  };

  const toggleCategory = (c) => {
    setFilters((prev) => {
      const exists = prev.categories?.includes(c);
      return { ...prev, categories: exists ? prev.categories.filter(x => x !== c) : [...(prev.categories||[]), c] };
    });
  };

  const toggleRegion = (r) => {
    setFilters((prev) => {
      const exists = prev.regions?.includes(r);
      return { ...prev, regions: exists ? prev.regions.filter(x => x !== r) : [...(prev.regions||[]), r] };
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block mb-1 text-slate-600 text-xs">Period</label>
        <div className="flex gap-2 flex-wrap">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={`text-xs px-3 py-1 rounded-full border ${filters.preset === p ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="date"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
            value={filters.from || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, preset: 'Custom', from: e.target.value }))}
          />
          <input
            type="date"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
            value={filters.to || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, preset: 'Custom', to: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 text-slate-600 text-xs">Category</label>
        <div className="flex gap-2 flex-wrap">
          {(availableCategories.length ? availableCategories : ['Sales','Marketing','Operations','Admin','Product']).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCategory(c)}
              className={`text-xs px-2 py-1 rounded-full border ${filters.categories?.includes(c) ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block mb-1 text-slate-600 text-xs">Region / Location</label>
        <div className="flex gap-2 flex-wrap">
          {(availableRegions.length ? availableRegions : ['Kathmandu','Pokhara','Biratnagar','International']).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRegion(r)}
              className={`text-xs px-2 py-1 rounded-full border ${filters.regions?.includes(r) ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setFilters({ preset: 'This Month', from: '', to: '', categories: [], regions: [] })} className="text-xs px-3 py-1 rounded-lg bg-white border">Reset</button>
        <button type="button" onClick={() => { /* placeholder for apply action, parent will react to filters changes */ }} className="text-xs px-3 py-1 rounded-lg bg-emerald-600 text-white">Apply</button>
      </div>
    </div>
  );
}
