import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ParkHoursCalendar({ parkId, parkName }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: parkHours = [], isLoading } = useQuery({
    queryKey: ["park-hours", parkId],
    queryFn: async () => {
      const hours = await base44.entities.ParkHours.filter(
        { park_id: parkId },
        "date",
        60
      );
      return hours;
    },
    enabled: !!parkId,
  });

  const todayHours = parkHours.find(h => {
    const date = new Date(h.date);
    return date.toDateString() === new Date().toDateString();
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="animate-pulse h-12 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  const upcomingHours = parkHours
    .filter(h => {
      const date = new Date(h.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 31);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Today's Hours */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Hours</p>
              {todayHours ? (
                todayHours.is_closed ? (
                  <p className="text-lg font-bold text-red-600 dark:text-red-500">Closed</p>
                ) : (
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {todayHours.open_time} - {todayHours.close_time}
                    </p>
                    {(todayHours.early_entry_time || todayHours.extended_hours_close) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {todayHours.early_entry_time && `Early Entry: ${todayHours.early_entry_time}`}
                        {todayHours.early_entry_time && todayHours.extended_hours_close && " • "}
                        {todayHours.extended_hours_close && `Extended: ${todayHours.extended_hours_close}`}
                      </p>
                    )}
                  </div>
                )
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Hours not available</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            View Calendar
            <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Expanded Calendar */}
      {isExpanded && (
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {upcomingHours.length > 0 ? (
            upcomingHours.map((hour) => {
              const date = new Date(hour.date);
              const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
              const dayOfMonth = date.getDate();
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={hour.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    isToday
                      ? "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex flex-col items-center justify-center",
                        isToday ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <span className="text-xs font-medium">{dayOfWeek}</span>
                      <span className="text-lg font-bold">{dayOfMonth}</span>
                    </div>
                    <div>
                      {hour.is_closed ? (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Closed</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="font-medium text-slate-900 dark:text-white">
                              {hour.open_time} - {hour.close_time}
                            </span>
                          </div>
                          {(hour.early_entry_time || hour.extended_hours_close) && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 ml-6">
                              {hour.early_entry_time && `Early Entry: ${hour.early_entry_time}`}
                              {hour.early_entry_time && hour.extended_hours_close && " • "}
                              {hour.extended_hours_close && `Extended: ${hour.extended_hours_close}`}
                            </p>
                          )}
                        </div>
                      )}
                      {hour.special_hours && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hour.special_hours}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Park hours will be available soon</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}