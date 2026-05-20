import { BanknotesIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import StatusBadge from "./StatusBadge";

export function GoalSetter({ goal, setGoal, currentProfit }) {
  const safeGoal = Math.max(Number(goal) || 0, 1);
  const percentComplete = Math.min(Math.round((currentProfit / safeGoal) * 100), 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <BanknotesIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Monthly Revenue Goal</h3>
            <p className="text-xs text-slate-500 font-medium">Target vs. Actuals</p>
          </div>
        </div>
        <StatusBadge actual={currentProfit} goal={safeGoal} />
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Progress</span>
            <span className="text-slate-900 font-bold">{percentComplete}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
        </div>

        {/* Input Field */}
        <div className="relative pt-2">
          <label className="absolute -top-1 left-3 px-1 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Adjust Goal
          </label>
          <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <span className="text-slate-400 text-sm font-medium mr-1">Rs.</span>
            <input 
              type="number" 
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800"
            />
            <PencilSquareIcon className="h-4 w-4 text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
