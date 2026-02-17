import React from "react";
import { Calendar, Sun, Cloud, Snowflake, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const seasons = [
  { key: "spring", label: "Spring", icon: Flower2, color: "text-pink-500" },
  { key: "summer", label: "Summer", icon: Sun, color: "text-amber-500" },
  { key: "fall", label: "Fall", icon: Cloud, color: "text-orange-500" },
  { key: "winter", label: "Winter", icon: Snowflake, color: "text-blue-500" },
];

const dayTypes = [
  { key: "weekday", label: "Weekday" },
  { key: "weekend", label: "Weekend" },
  { key: "holiday", label: "Holiday" },
];

export default function ForecastControls({ date, season, dayType, onDateChange, onSeasonChange, onDayTypeChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition-all">
            <Calendar className="w-4 h-4 text-violet-500" />
            <span className="text-sm">{date ? format(date, "MMM d, yyyy") : "Select Date"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker mode="single" selected={date} onSelect={onDateChange} />
        </PopoverContent>
      </Popover>
      
      <div className="flex items-center bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 p-0.5">
        {seasons.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => onSeasonChange(s.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                season === s.key ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", season === s.key ? "text-white dark:text-slate-900" : s.color)} />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 p-0.5">
        {dayTypes.map((d) => (
          <button
            key={d.key}
            onClick={() => onDayTypeChange(d.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              dayType === d.key ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}