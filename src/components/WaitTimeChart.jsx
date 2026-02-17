import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl px-4 py-3">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{data.wait} min</p>
        {data.isHistorical && (
          <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5 font-medium">Historical Data</p>
        )}
        {!data.isHistorical && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">AI Forecast</p>
        )}
        {data.crowd && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">Crowd: {data.crowd}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function WaitTimeChart({ data, height = 280, currentHour, currentWait, rideIsOpen = true }) {
  if (!data || data.length === 0) return null;

  // Blend historical and forecast into continuous line
  const processedData = data.map(d => ({
    ...d,
    wait: d.wait,
  }));

  // Find the transition point based on current hour
  const currentIndex = currentHour ? data.findIndex(d => d.hour === currentHour) : data.findIndex(d => !d.isHistorical);
  const transitionPercent = currentIndex >= 0 ? ((currentIndex + 1) / data.length) * 100 : 100;

  const validData = data.filter(d => d.wait != null && !d.isDown);
  const maxWait = validData.length > 0 ? Math.max(...validData.map(d => d.wait)) : 100;
  const minWait = validData.length > 0 ? Math.min(...validData.map(d => d.wait)) : 0;
  const bestTime = validData.length > 0 ? validData.reduce((min, d) => d.wait < min.wait ? d : min, validData[0]) : null;
  const hasDowntime = data.some(d => d.isDown);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
         <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="blendedLineGradient" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset={`${transitionPercent}%`} stopColor="#C4B5FD" />
              <stop offset={`${transitionPercent}%`} stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="blendedFillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="downFillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FCA5A5" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FCA5A5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis 
            dataKey="hour" 
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

          {currentWait != null && (
            <ReferenceLine 
              y={currentWait} 
              stroke="#EF4444" 
              strokeWidth={2.5}
              label={{ 
                value: `Actual: ${currentWait} min`, 
                position: "insideTopRight", 
                fill: "#EF4444", 
                fontSize: 11, 
                fontWeight: 700,
                offset: 10
              }}
            />
          )}
          {bestTime && (
            <ReferenceLine 
              x={bestTime.hour} 
              stroke="#10B981" 
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}
          {/* Historical data area */}
          <Area
            type="monotone"
            dataKey="wait"
            stroke="url(#blendedLineGradient)"
            strokeWidth={3}
            fill="url(#blendedFillGradient)"
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
          />
          {/* Ride down indicator */}
          {hasDowntime && (
            <Area
              type="stepAfter"
              dataKey={(d) => d.isDown ? 50 : null}
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#downFillGradient)"
              dot={false}
              isAnimationActive={false}
            />
          )}

        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-2">
        {bestTime && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full px-3 py-1 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Best time: {bestTime.hour} ({bestTime.wait} min)
            </div>
          </div>
        )}
        {hasDowntime && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 rounded-full px-3 py-1 text-xs font-medium border border-red-200 dark:border-red-800">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
              Ride was closed during operating hours
            </div>
          </div>
        )}

      </div>
    </div>
  );
}