import React from "react";
import { motion } from "framer-motion";
import { Clock, AlertCircle, Sparkles, Bell, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const typeConfig = {
  wait_drop: { icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
  ride_closed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
  ride_reopen: { icon: Sparkles, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800" },
  system: { icon: Bell, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-900", border: "border-slate-200 dark:border-slate-700" }
};

export default function NotificationList({ notifications, onClose }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const markAsRead = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.ride_id) {
      navigate(createPageUrl(`RideDetail?rideId=${notification.ride_id}`));
      onClose();
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification, index) => {
        const config = typeConfig[notification.type] || typeConfig.system;
        const Icon = config.icon;
        const timeAgo = formatDistanceToNow(new Date(notification.created_date), { addSuffix: true });

        return (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleNotificationClick(notification)}
            className={cn(
              "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group",
              config.bg,
              config.border,
              !notification.is_read && "ring-2 ring-violet-200 dark:ring-violet-800"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", config.bg)}>
                <Icon className={cn("w-5 h-5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={cn("font-semibold text-sm", !notification.is_read && "text-slate-900 dark:text-white")}>
                    {notification.title}
                  </h4>
                  {!notification.is_read && (
                    <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{timeAgo}</p>
                  {notification.ride_id && (
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-violet-500 transition-colors" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}