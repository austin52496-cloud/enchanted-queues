import React from "react";
import { motion } from "framer-motion";
import { Clock, Zap, Star, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import CrowdBadge from "./CrowdBadge";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";


const typeConfig = {
  thrill: { label: "Thrill", color: "bg-red-100 text-red-700 border-red-200" },
  family: { label: "Family", color: "bg-blue-100 text-blue-700 border-blue-200" },
  show: { label: "Show", color: "bg-purple-100 text-purple-700 border-purple-200" },
  water: { label: "Water", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  dark_ride: { label: "Dark Ride", color: "bg-slate-100 text-slate-700 border-slate-200" },
  spinner: { label: "Spinner", color: "bg-pink-100 text-pink-700 border-pink-200" },
};

export default function RideCard({ ride, index, history = [], isPremium = false }) {
  const type = typeConfig[ride.type] || typeConfig.family;
  const isClosed = ride.is_open === false;
  const currentWait = isClosed ? 0 : (ride.current_wait_minutes || ride.avg_wait_minutes || 0);
  const hasLiveData = ride.current_wait_minutes != null;
  
  const waitColor = currentWait <= 20 ? "text-emerald-600" : currentWait <= 45 ? "text-amber-600" : currentWait <= 70 ? "text-orange-600" : "text-red-600";
  
  // Gradient background based on wait time
  const getGradientClass = () => {
    if (isClosed) return "bg-slate-50 dark:bg-slate-900";
    if (currentWait <= 20) return "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30";
    if (currentWait <= 45) return "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30";
    if (currentWait <= 70) return "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30";
    return "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30";
  };
  
  const chartData = history.map(h => ({ wait: h.wait_minutes }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={createPageUrl(`RideDetail?rideId=${ride.id}`)}>
        <div className={cn("group flex gap-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-4 hover:shadow-lg hover:border-violet-200/60 dark:hover:border-violet-700/60 transition-all duration-300 cursor-pointer", getGradientClass())}>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-900 dark:text-white truncate">{ride.name}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{ride.land}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {isClosed ? (
                  <div>
                    <Badge variant="outline" className="border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                      Closed
                    </Badge>
                  </div>
                ) : (
                   <div>
                     <Badge variant="outline" className="border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs">
                       Open
                     </Badge>
                   </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px] px-2 py-0 border", type.color)}>
                {type.label}
              </Badge>
              {!isClosed && currentWait > 0 && (
                <span className={cn("text-sm font-bold flex items-center gap-1", waitColor)}>
                  <Clock className="w-3.5 h-3.5" />
                  {currentWait} min
                </span>
              )}
              {ride.has_lightning_lane && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                  <Zap className="w-2.5 h-2.5 mr-0.5" />
                  LL
                </Badge>
              )}
            </div>

            {/* Wait Time Progress Bar - Always show for open rides */}
            {!isClosed && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Wait trend</span>
                  {history.length > 1 && history[history.length - 1].wait_minutes > history[0].wait_minutes ? (
                    <TrendingUp className="w-3 h-3 text-red-500" />
                  ) : history.length > 1 ? (
                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                  ) : null}
                </div>
                <div className="h-2 bg-slate-200/50 dark:bg-slate-700/30 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      currentWait === 0 ? "bg-blue-500" :
                      currentWait <= 30 ? "bg-gradient-to-r from-green-500 to-green-400" :
                      currentWait <= 60 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                      currentWait <= 90 ? "bg-gradient-to-r from-orange-500 to-orange-400" :
                      "bg-gradient-to-r from-red-500 to-red-400"
                    )}
                    style={{ width: `${Math.min((currentWait / 120) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center">
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-violet-500 transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}