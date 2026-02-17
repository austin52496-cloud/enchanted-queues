import React from "react";
import { Zap, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LightningLaneDisplay({ ride, isPremium, isCompact = false }) {
  if (!ride?.has_lightning_lane || !ride?.lightning_lane_times?.length) {
    return null;
  }

  const times = ride.lightning_lane_times.filter(t => t.available !== false);
  const displayTimes = isPremium ? times : times.slice(0, 1);

  if (isCompact) {
    // Compact display for ride cards
    const nextAvailable = times.find(t => t.available);
    if (!nextAvailable) return null;

    return (
      <div className="flex items-center gap-1.5 mt-2">
        <Zap className="w-3 h-3 text-amber-500" />
        <span className="text-xs text-slate-600">Next: {nextAvailable.time}</span>
        {!isPremium && times.length > 1 && (
          <Lock className="w-3 h-3 text-slate-400" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/60">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-3">Lightning Lane Times</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayTimes.map((slot, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="justify-center py-2 bg-emerald-50 border-emerald-200 text-emerald-700"
              >
                {slot.time}
              </Badge>
            ))}
          </div>
          {!isPremium && times.length > 1 && (
            <div className="flex items-center gap-2 mt-3 text-xs text-amber-700">
              <Lock className="w-3 h-3" />
              <span>Upgrade to Premium to see all available times</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}