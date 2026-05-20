export default function InsightCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-600" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="mt-4 text-sm text-slate-600">{children}</div>
    </div>
  );
}
