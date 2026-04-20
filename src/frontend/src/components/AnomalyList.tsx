import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/api';

export function AnomalyList() {
  const { data: anomalies, error } = useSWR('/analytics/anomalies', fetcher);

  const handleCorrect = async (id: string) => {
    // This is a simplified interaction for the demo
    console.log('Correcting anomaly:', id);
    // In real life, we would open a category selection modal here
  };

  if (error) return <div className="text-red-500">Erro ao carregar anomalias.</div>;
  if (!anomalies) return <div className="text-slate-500 animate-pulse">Carregando triagem...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-400" />
          Anomalias Detectadas (Z-Score &gt; 3)
        </h3>
        <span className="text-xs text-slate-500">{anomalies.length} pendentes</span>
      </div>
      <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
        {anomalies.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma anomalia crítica nas últimas 24h.</div>
        ) : (
          anomalies.map((tx: any) => (
            <div key={tx.id} className="p-4 hover:bg-slate-800/50 transition-colors group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">{tx.description || 'Transação sem descrição'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {tx.category_name} • {new Date(tx.transaction_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold">R$ {Math.abs(tx.amount).toFixed(2)}</p>
                  <p className="text-[10px] text-slate-600">Z-Score: {Number(tx.z_score).toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleCorrect(tx.id)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded border border-slate-700 uppercase tracking-tighter"
                >
                  Corrigir Categoria
                </button>
                <button className="text-[10px] text-slate-500 hover:text-emerald-400 px-2 py-1">
                  Marcar como Válida
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
