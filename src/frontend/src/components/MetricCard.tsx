import { Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  logic: string;
  trend?: string;
  unit?: string;
}

export function MetricCard({ title, value, logic, trend, unit }: MetricCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className="group relative">
          <Info size={16} className="text-slate-500 cursor-help" />
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-black border border-slate-700 text-xs text-slate-300 rounded shadow-xl z-50">
            <p className="font-bold mb-1 text-slate-100">Lógica SQL:</p>
            <code>{logic}</code>
          </div>
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-white tracking-tight">
          {unit && <span className="text-xl mr-1 text-slate-500 font-normal">{unit}</span>}
          {value}
        </span>
        {trend && (
          <span className={`text-xs px-2 py-0.5 rounded ${trend.startsWith('+') ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
