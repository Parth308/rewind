'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AnalyticsPieChart({ data, color = '#a3e635' }: { data: any[], color?: string }) {
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

  // Generate some analogous colors based on the base color
  const COLORS = [color, `${color}cc`, `${color}99`, `${color}66`, `${color}33`, '#ffffff'];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full" style={{ background: payload[0].payload.fill }} />
                    <span className="text-neutral-300">{payload[0].name}:</span>
                    <span className="font-mono font-bold text-white">{payload[0].value}</span>
                  </div>
                </div>
              );
            }
            return null;
          }} 
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="circle"
          formatter={(value) => <span className="text-xs text-neutral-400 font-mono">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
