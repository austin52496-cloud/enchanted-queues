import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NotificationList from "./NotificationList";

export default function NotificationBell({ user }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Notification.filter(
        { user_email: user.email },
        "-created_date",
        50
      );
    },
    enabled: !!user?.email,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data?.user_email === user.email) {
        refetch();
      } else if (event.type === "update" || event.type === "delete") {
        refetch();
      }
    });

    return unsubscribe;
  }, [user?.email, refetch]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              className="mb-4 w-full"
              disabled={markAllRead.isPending}
            >
              Mark all as read
            </Button>
          )}
          <NotificationList
            notifications={notifications}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}