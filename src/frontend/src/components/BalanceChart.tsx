'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export function BalanceChart() {
  const { data: balanceData, error } = useSWR('/analytics/balance', fetcher);

  if (error) return <div className="h-64 flex items-center justify-center text-red-500">Erro no gráfico.</div>;
  if (!balanceData) return <div className="h-64 flex items-center justify-center text-slate-700 animate-pulse bg-slate-900 rounded">Carregando gráfico...</div>;

  const formattedData = balanceData.map((d: any) => ({
    date: new Date(d.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    saldo: parseFloat(d.running_balance),
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest text-slate-400">Saldo Acumulado Real</h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
                <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                />
                <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                    itemStyle={{ color: '#3b82f6' }}
                    labelStyle={{ color: '#94a3b8' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSaldo)" 
                />
            </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}
