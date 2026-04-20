'use client';

import { Activity, CreditCard, TrendingDown, Calendar } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { MetricCard } from '@/components/MetricCard';
import { BalanceChart } from '@/components/BalanceChart';
import { AnomalyList } from '@/components/AnomalyList';
import { BudgetDrift } from '@/components/BudgetDrift';

export default function DashboardPage() {
  const { data: burnRate } = useSWR('/analytics/burn-rate', fetcher);
  const { data: balance } = useSWR('/analytics/balance', fetcher);
  const { data: forecast } = useSWR('/analytics/forecast', fetcher);

  // Get current balance (last entry in running balance)
  const currentBalance = balance ? balance[balance.length - 1]?.running_balance : '0.00';
  
  // Find zero-day from forecast
  const zeroDayStr = forecast?.find((d: any) => parseFloat(d.projected_balance) <= 0)?.date;
  const zeroDayFormatted = zeroDayStr ? new Date(zeroDayStr).toLocaleDateString('pt-BR') : 'Indeterminado';

  return (
    <main className="min-h-screen bg-black text-slate-200 p-8 font-sans">
      <header className="mb-10 flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tighter">FINANCE_IQ</h1>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest">Painel de Diagnóstico Analítico</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 font-mono">STATUS: OPERACIONAL</div>
          <div className="text-xs text-emerald-500 font-mono">SQL_ENGINE: SLONIK_V48</div>
        </div>
      </header>

      {/* Primary Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          title="Saldo Atual" 
          unit="R$"
          value={currentBalance}
          logic="SUM(amount) OVER (ORDER BY date)"
          trend="-2.4%"
        />
        <MetricCard 
          title="Burn Rate Diário" 
          unit="R$"
          value={burnRate?.value || '0.00'}
          logic={burnRate?.logic || '...'}
        />
        <MetricCard 
          title="Projeção Saldo Zero" 
          value={zeroDayFormatted}
          logic="current_balance + (avg_burn * days_ahead)"
        />
      </section>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visualizations */}
        <div className="lg:col-span-2 space-y-8">
          <BalanceChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <BudgetDrift />
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Saúde do Fluxo</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-950 rounded-full"><Activity size={16} className="text-emerald-400" /></div>
                      <span className="text-xs">Estabilidade de Gastos</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">ALTA</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-950 rounded-full"><TrendingDown size={16} className="text-red-400" /></div>
                      <span className="text-xs">Taxa de Drift Mensal</span>
                    </div>
                    <span className="text-xs font-bold text-red-400">+12.5%</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-950 rounded-full"><Calendar size={16} className="text-blue-400" /></div>
                      <span className="text-xs">Liquidez Projetada</span>
                      <InfoTooltip logic="SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount > 0" />
                    </div>
                    <span className="text-xs font-bold text-blue-400">42 Dias</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Triage */}
        <div className="lg:col-span-1">
          <AnomalyList />
        </div>
      </div>
    </main>
  );
}

function InfoTooltip({ logic }: { logic: string }) {
    return (
        <div className="group relative ml-2">
          <Activity size={12} className="text-slate-600 cursor-help" />
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-black border border-slate-700 text-[10px] text-slate-300 rounded shadow-xl z-50">
            <code>{logic}</code>
          </div>
        </div>
    )
}
