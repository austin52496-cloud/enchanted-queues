import React from "react";
import { cn } from "@/lib/utils";

const crowdConfig = {
  low: { label: "Low", color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50", border: "border-emerald-200" },
  moderate: { label: "Moderate", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50", border: "border-amber-200" },
  high: { label: "High", color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-50", border: "border-orange-200" },
  extreme: { label: "Extreme", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50", border: "border-red-200" },
};

function getCrowdLevel(level) {
  if (level <= 3) return "low";
  if (level <= 5) return "moderate";
  if (level <= 7) return "high";
  return "extreme";
}

export default function CrowdBadge({ level, size = "md", showDots = true }) {
  const key = typeof level === "string" ? level : getCrowdLevel(level);
  const config = crowdConfig[key] || crowdConfig.moderate;
  const numericLevel = typeof level === "number" ? level : { low: 2, moderate: 5, high: 7, extreme: 9 }[key];
  
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border", config.bgLight, config.border, sizes[size])}>
      {showDots && (
        <div className="flex gap-0.5">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all",
                size === "sm" ? "w-1 h-1" : size === "lg" ? "w-2 h-2" : "w-1.5 h-1.5",
                i < numericLevel ? config.color : "bg-gray-200"
              )}
            />
          ))}
        </div>
      )}
      <span className={cn("font-semibold", config.textColor)}>{config.label}</span>
    </div>
  );
}

export { getCrowdLevel, crowdConfig };