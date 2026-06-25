'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsBarChart({ data, color = '#a3e635' }: { data: any[], color?: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-sm text-neutral-500">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="transparent"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={false}
          dy={8}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="transparent"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip 
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-300">{payload[0].payload.name}:</span>
                    <span className="font-mono font-bold text-white">{payload[0].value}</span>
                  </div>
                </div>
              );
            }
            return null;
          }} 
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={color} fillOpacity={Math.max(0.2, 0.9 - (index * 0.1))} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
