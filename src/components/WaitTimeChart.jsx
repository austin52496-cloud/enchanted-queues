import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const historical = payload.find(p => p.dataKey === 'actualWait');
    const forecast = payload.find(p => p.dataKey === 'forecastWait');
    
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl px-4 py-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
        
        {historical?.value != null && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-slate-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Actual:</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{historical.value} min</span>
          </div>
        )}
        
        {forecast?.value != null && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-violet-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">AI Forecast:</span>
            <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{forecast.value} min</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function WaitTimeChart({ 
  data = [],  // Historical actual data
  aiForecast = null,  // AI forecast from Edge Function
  fallbackForecast = [],  // Fallback forecast if AI fails
  height = 320, 
  currentHour, 
  currentWait, 
  rideIsOpen = true 
}) {
  // Use AI forecast if available, otherwise fallback
  const forecastData = aiForecast || fallbackForecast.filter(f => !f.isHistorical);
  
  // Group historical data by hour for easier matching
  const historicalByHour = {};
  data.forEach(item => {
    const hour12 = item.hour === 0 ? 12 : item.hour > 12 ? item.hour - 12 : item.hour;
    const ampm = item.hour >= 12 ? 'PM' : 'AM';
    const hourLabel = `${hour12} ${ampm}`;
    
    if (!historicalByHour[hourLabel]) {
      historicalByHour[hourLabel] = [];
    }
    historicalByHour[hourLabel].push(item.wait);
  });

  // Average historical data by hour
  const historicalAverages = {};
  Object.keys(historicalByHour).forEach(hour => {
    const waits = historicalByHour[hour];
    historicalAverages[hour] = Math.round(waits.reduce((a, b) => a + b, 0) / waits.length);
  });

  // Get all unique hours from both datasets
  const allHours = new Set([
    ...Object.keys(historicalAverages),
    ...forecastData.map(f => f.hour)
  ]);

  // Combine into chart data
  const chartData = Array.from(allHours).map(hour => ({
    hour: hour,
    actualWait: historicalAverages[hour] || null,
    forecastWait: forecastData.find(f => f.hour === hour)?.wait || null,
  })).sort((a, b) => {
    // Sort by time of day
    const parseHour = (h) => {
      const [time, period] = h.split(' ');
      let hour = parseInt(time);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour;
    };
    return parseHour(a.hour) - parseHour(b.hour);
  });

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-slate-500 dark:text-slate-400">No data available</p>
      </div>
    );
  }

  // Calculate stats
  const validData = chartData.filter(d => d.actualWait != null || d.forecastWait != null);
  const allWaits = validData.map(d => d.actualWait || d.forecastWait);
  const maxWait = Math.max(...allWaits, currentWait || 0);
  const minWait = Math.min(...allWaits.filter(w => w > 0));
  
  // Find best time from forecast
  const forecastPoints = chartData.filter(d => d.forecastWait != null);
  const bestTime = forecastPoints.length > 0 
    ? forecastPoints.reduce((min, d) => d.forecastWait < min.forecastWait ? d : min, forecastPoints[0])
    : null;

  // Find current hour index for "NOW" marker
  const currentIndex = currentHour ? chartData.findIndex(d => d.hour === currentHour) : -1;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 10 }}>
          <defs>
            {/* Gradient for AI forecast line */}
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
            
            {/* Fill gradient for forecast area */}
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E2E8F0" 
            strokeOpacity={0.5}
            vertical={false} 
          />
          
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            tickLine={false}
            axisLine={{ stroke: "#CBD5E1" }}
            interval="preserveStartEnd"
          />
          
          <YAxis 
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
            domain={[0, Math.ceil(maxWait * 1.1 / 10) * 10]}
            tickFormatter={(val) => `${val}`}
            label={{ 
              value: 'Wait (min)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#94A3B8' }
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Current wait reference line */}
          {currentWait != null && currentIndex >= 0 && (
            <ReferenceLine 
              x={chartData[currentIndex].hour}
              stroke="#10B981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: '← NOW', 
                position: 'top',
                fill: "#10B981", 
                fontSize: 11, 
                fontWeight: 700
              }}
            />
          )}

          {/* Best time marker */}
          {bestTime && (
            <ReferenceLine 
              x={bestTime.hour} 
              stroke="#10B981" 
              strokeDasharray="3 3"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
          )}

          {/* Historical data line (gray) */}
          <Line
            type="monotone"
            dataKey="actualWait"
            stroke="#94A3B8"
            strokeWidth={3}
            dot={false}
            connectNulls={false}
            isAnimationActive={true}
            animationDuration={800}
            strokeLinecap="round"
          />

          {/* AI Forecast line (purple gradient) */}
          <Line
            type="monotone"
            dataKey="forecastWait"
            stroke="url(#forecastGradient)"
            strokeWidth={3}
            dot={false}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={1000}
            strokeLinecap="round"
            strokeDasharray="5 5"
          />

        </LineChart>
      </ResponsiveContainer>

      {/* Legend and stats */}
      <div className="mt-4 space-y-3">
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-slate-400 dark:bg-slate-500 rounded" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Historical Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-violet-600 to-violet-400 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5CF6 0px, #8B5CF6 5px, transparent 5px, transparent 10px)' }} />
            <span className="text-slate-600 dark:text-slate-400 font-medium">AI Forecast</span>
          </div>
        </div>

        {/* Best time badge */}
        {bestTime && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 text-emerald-700 dark:text-emerald-400 rounded-full px-4 py-2 text-sm font-semibold border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Best time: {bestTime.hour} (~{bestTime.forecastWait} min wait)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}