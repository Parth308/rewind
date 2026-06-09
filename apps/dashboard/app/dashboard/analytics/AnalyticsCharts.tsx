'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
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

export default function AnalyticsCharts({ data, color = '#a3e635' }: { data: any[], color?: string }) {
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
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id={`color-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="transparent"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={false}
          dy={8}
          interval="preserveStartEnd"  // ← prevents label crowding on mobile
        />
        <YAxis
          stroke="transparent"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}  // ← fixed width prevents layout shift
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#color-${color.replace('#','')})`}
          dot={{ fill: color, strokeWidth: 0, r: 3 }}
          activeDot={{ fill: color, strokeWidth: 0, r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}