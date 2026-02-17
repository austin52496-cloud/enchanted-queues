import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg px-3 py-2">
        <p className="text-xs font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white">{data.wait} min</p>
        {data.isHistorical && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Historical</p>
        )}
      </div>
    );
  }
  return null;
};

export default function EnhancedWaitTimeChart({ data, isClosed = false }) {
  if (isClosed || !data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            🎢 Ride closed – no forecast available
          </p>
        </div>
      </div>
    );
  }

  // Find peak and its time
  const validData = data.filter(d => d.wait != null);
  const peak = validData.length > 0 ? validData.reduce((max, d) => d.wait > max.wait ? d : max, validData[0]) : null;

  // Fill gaps to create continuous line
  const processedData = validData.map(d => ({
    ...d,
    confidenceHigh: d.wait + 15,
    confidenceLow: Math.max(0, d.wait - 15),
  }));

  return (
    <div className="w-full space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={processedData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#93C5FD" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" dark:stroke="#475569" vertical={false} />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 12, fill: "#64748B" }}
            tickLine={false}
            axisLine={{ stroke: "#E2E8F0" }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}m`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Confidence Band */}
          <Area
            type="monotone"
            dataKey="confidenceHigh"
            fill="url(#confidenceBand)"
            stroke="none"
            isAnimationActive={false}
          />
          
          {/* Single blended line with color coding */}
          <defs>
            <linearGradient id="blendedLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="wait"
            stroke="url(#blendedLineGradient)"
            strokeWidth={3}
            fill="none"
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 6, fill: "#fff", stroke: "#64748B", strokeWidth: 2 }}
          />
          
          {/* Peak reference line */}
          {peak && (
            <ReferenceLine
              y={peak.wait}
              stroke="#94A3B8"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Peak: ${peak.wait} min at ${peak.hour}`,
                position: "insideTopRight",
                fill: "#64748B",
                fontSize: 11,
                fontWeight: 600,
                offset: 10,
                background: { fill: "#FFFFFF", opacity: 0.8, radius: 4, padding: 4 }
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">Short (&lt;30 min)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-600 dark:text-slate-400">Moderate (30–60 min)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600 dark:text-slate-400">Long (&gt;60 min)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-300 to-blue-100 dark:from-blue-400 dark:to-blue-600 rounded-full opacity-30" />
          <span className="text-slate-600 dark:text-slate-400">Confidence band</span>
        </div>
      </div>
    </div>
  );
}