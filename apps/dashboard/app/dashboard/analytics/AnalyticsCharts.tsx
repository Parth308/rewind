'use client';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-neutral-400 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-neutral-300 capitalize">{entry.name}:</span>
            <span className="font-mono font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-sm text-neutral-500">No session data yet</p>
        <p className="text-xs text-neutral-600">Sessions will appear here as they're recorded</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a3e635" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="transparent"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          stroke="transparent"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="sessions"
          stroke="#a3e635"
          strokeWidth={2}
          fill="url(#colorSessions)"
          dot={{ fill: '#a3e635', strokeWidth: 0, r: 3 }}
          activeDot={{ fill: '#a3e635', strokeWidth: 0, r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
