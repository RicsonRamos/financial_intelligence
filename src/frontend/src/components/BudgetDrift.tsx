'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export function BudgetDrift() {
  const { data: driftData, error } = useSWR('/analytics/drift', fetcher);

  if (error) return <div className="text-red-500 p-4">Erro ao carregar orçamentos.</div>;
  if (!driftData) return <div className="p-4 bg-slate-900 animate-pulse rounded h-40"></div>;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
      <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-6">Drift de Orçamento (Mensal)</h3>
      <div className="space-y-6">
        {driftData.length === 0 ? (
          <p className="text-slate-500 text-sm italic">Nenhum orçamento configurado para este período.</p>
        ) : (
          driftData.map((item: any) => {
            const percentage = Math.min((item.actual / item.budget) * 100, 100);
            const isOver = item.actual > item.budget;
            
            return (
              <div key={item.category_name} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-medium">{item.category_name}</span>
                  <div className="text-right">
                    <span className={isOver ? 'text-red-400 font-bold' : 'text-slate-400'}>
                      R$ {item.actual}
                    </span>
                    <span className="text-slate-600 ml-1">/ R$ {item.budget}</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {isOver && (
                  <p className="text-[10px] text-red-500 font-medium">Excesso de R$ {item.drift}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
