import React from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

function DescriptionCell({ value, normalizeValue }) {
  const text = normalizeValue(value);
  const lines = text.includes("\n")
    ? text.split("\n")
    : text.startsWith("Items:")
      ? text.split(/,\s+/)
      : [text];
  const structuredLines = lines
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return {
        label: rest.length > 0 ? label.trim() : "",
        value: rest.length > 0 ? rest.join(":").trim() : line.trim(),
      };
    })
    .filter(({ value: lineValue }) => lineValue);
  const itemLine = structuredLines.find(
    ({ label }) => label.toLowerCase() === "items",
  );
  const metricLines = structuredLines.filter(({ label }) =>
    ["sales", "cogs", "vat"].includes(label.toLowerCase()),
  );
  const otherLines = structuredLines.filter(({ label }) => {
    const normalizedLabel = label.toLowerCase();
    return (
      normalizedLabel !== "items" &&
      !["sales", "cogs", "vat"].includes(normalizedLabel)
    );
  });
  const itemList = itemLine?.value.split(/,\s*/).filter(Boolean) || [];

  return (
    <div className="max-w-[240px] whitespace-normal text-[11px] leading-5 text-slate-700">
      {itemLine ? (
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Items
          </span>
          <div className="mt-0.5 space-y-0.5">
            {itemList.map((item) => (
              <span
                key={item}
                className="block break-words font-medium text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {metricLines.length > 0 ? (
        <div className={itemLine ? "mt-1" : ""}>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {metricLines.map(({ label, value: lineValue }) => (
              <span key={label} className="whitespace-nowrap">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </span>{" "}
                <span className="font-semibold text-slate-800">
                  {lineValue}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {otherLines.map(({ label, value: lineValue }, index) => (
        <div key={`${label}-${lineValue}-${index}`} className="mt-1">
          {label ? (
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </span>
          ) : null}
          <span className="block break-words font-semibold text-slate-800">
            {lineValue}
          </span>
        </div>
      ))}
    </div>
  );
}

const formatColumnHeading = (column) => {
  if (column === "__fileType") return "Source";
  if (column === "__importedOn") return "Imported On";
  if (column === "accountType") return "Account Type";
  return column.charAt(0).toUpperCase() + column.slice(1);
};

export default function RecordsTablePanel({
  loading,
  error,
  filteredRows,
  paginatedRows,
  visibleColumns,
  fileOptions,
  fileTypeOptions,
  search,
  selectedFile,
  selectedFileType,
  selectedImportedOn,
  currentPage,
  totalPages,
  manualRecordCount,
  recalculating,
  isOrgAdmin,
  onSearchChange,
  onSelectedFileChange,
  onSelectedFileTypeChange,
  onSelectedImportedOnChange,
  onClearFilters,
  onRefresh,
  onExport,
  onRecalculate,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onPageChange,
  normalizeValue,
  formatImportedOn,
  getAmountTextClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pb-4 pt-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Financial Records
            </h2>
            <p className="text-xs text-slate-500">
              Manage and track all transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Refresh records"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onRecalculate}
              disabled={!isOrgAdmin || recalculating}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${recalculating ? "animate-spin" : ""}`}
              />
              Recalculate
            </button>
            <button
              type="button"
              onClick={onAddRecord}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white shadow-md transition hover:bg-cyan-600"
            >
              <PlusIcon className="h-5 w-5" />
              Add Record
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              placeholder="Search records..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <CalendarDaysIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={selectedImportedOn}
                onChange={(e) => onSelectedImportedOnChange(e.target.value)}
                className="min-w-[180px] rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
                aria-label="Filter by imported date"
              />
            </div>

            <div className="relative">
              <select
                value={selectedFileType}
                onChange={(e) => onSelectedFileTypeChange(e.target.value)}
                className="min-w-[132px] appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
                aria-label="Filter by source"
              >
                <option value="all">All Sources</option>
                {fileTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={selectedFile}
                onChange={(e) => onSelectedFileChange(e.target.value)}
                className="min-w-[132px] appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100"
                aria-label="Filter by file"
              >
                <option value="all">All Files</option>
                {fileOptions.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.fileName}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Loading imported records...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm text-rose-600">
            {error}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No rows found. Import a CSV/Excel file or place FruityGo orders to
            see records here.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {visibleColumns.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap px-4 py-3 font-medium"
                      >
                        {formatColumnHeading(column)}
                      </th>
                    ))}
                    <th className="sticky right-0 z-10 w-[104px] whitespace-nowrap border-l border-slate-100 bg-slate-50 px-4 py-3 text-center font-medium shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRows.map((row) => (
                    <tr key={row.__recordId} className="align-top">
                      {visibleColumns.map((column) => (
                        <td
                          key={column}
                          className={`whitespace-nowrap px-4 py-3 ${
                            column === "amount"
                              ? getAmountTextClass(row)
                              : "text-slate-700"
                          }`}
                        >
                          {column === "__importedOn" ? (
                            formatImportedOn(row[column])
                          ) : column === "amount" ? (
                            Number(row[column] || 0).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          ) : column === "description" ? (
                            <DescriptionCell
                              value={row[column]}
                              normalizeValue={normalizeValue}
                            />
                          ) : (
                            normalizeValue(row[column])
                          )}
                        </td>
                      ))}
                      <td className="sticky right-0 w-[104px] whitespace-nowrap border-l border-slate-100 bg-white px-4 py-3 text-slate-700 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditRecord(row)}
                            disabled={!row.__isManual}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Edit record ${normalizeValue(row.description || row.Description || row.__recordId)}`}
                            title="Edit record"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 text-rose-600 transition hover:bg-rose-50"
                            aria-label={`Delete record ${normalizeValue(row.description || row.Description || row.__recordId)}`}
                            title="Delete record"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>
                Showing {paginatedRows.length} of {filteredRows.length} record
                {filteredRows.length === 1 ? "" : "s"} on this page.
                {manualRecordCount > 0
                  ? ` ${manualRecordCount} manual record${manualRecordCount === 1 ? "" : "s"} can be edited.`
                  : ""}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Previous
                </button>
                <span className="h-7 rounded-full bg-emerald-600 px-3 text-xs font-medium leading-7 text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onPageChange((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
