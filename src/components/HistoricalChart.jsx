import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl px-4 py-3">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{payload[0].value} min</p>
      </div>
    );
  }
  return null;
};

export default function HistoricalChart({ data, height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No historical data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis 
          dataKey="time" 
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={{ stroke: "#E2E8F0" }}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val) => `${val}m`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="wait"
          stroke="#6366F1"
          strokeWidth={2.5}
          fill="url(#historicalGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}