import React from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

export default function ParkCard({ park, index, averageWait, isClosed, hoursDisplay }) {
  const gradients = [
    "from-violet-600 to-fuchsia-600",
    "from-blue-600 to-cyan-600",
    "from-orange-600 to-red-600",
    "from-emerald-600 to-teal-600",
    "from-pink-600 to-rose-600",
    "from-amber-600 to-orange-600",
  ];
  
  const gradient = gradients[index % gradients.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={createPageUrl(`ParkDetail?parkId=${park.id}`)}>
        <div className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer h-full">
          <div className={`relative bg-gradient-to-br ${gradient} p-8 transition-all duration-500 group-hover:scale-[1.02]`}>
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 text-white text-xs font-semibold border border-white/20 whitespace-nowrap">
              {isClosed ? "Closed" : `${averageWait}m`}
            </div>
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-3xl font-bold text-white tracking-tight leading-tight relative z-10">
              {park.name}
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{park.description || "Explore the magic of this Disney park"}</p>

            {/* Wait Time Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Average Wait</span>
                <span className={cn("text-sm font-bold", averageWait <= 20 ? "text-emerald-600" : averageWait <= 45 ? "text-amber-600" : averageWait <= 70 ? "text-orange-600" : "text-red-600")}>
                  {averageWait}m
                </span>
              </div>
              <div className="h-2 bg-slate-200/50 dark:bg-slate-700/30 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    averageWait <= 20 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                    averageWait <= 45 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                    averageWait <= 70 ? "bg-gradient-to-r from-orange-500 to-orange-400" :
                    "bg-gradient-to-r from-red-500 to-red-400"
                  )}
                  style={{ width: `${Math.min((averageWait / 120) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {hoursDisplay}
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-violet-600 group-hover:translate-x-1 transition-transform">
                View Rides
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}