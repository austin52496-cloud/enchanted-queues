import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function NotificationSettings({ favorite, onUpdate, isPremium, userPhoneNumber }) {
  const [notifyOnWaitDrop, setNotifyOnWaitDrop] = useState(favorite?.notify_on_wait_drop || false);
  const [notifyOnClosure, setNotifyOnClosure] = useState(favorite?.notify_on_status_change || false);
  const [notifyOnReopen, setNotifyOnReopen] = useState(favorite?.notify_on_ride_reopen || false);
  const [threshold, setThreshold] = useState(favorite?.wait_time_threshold || 30);
  const [notifyMethods, setNotifyMethods] = useState(favorite?.notify_methods || ["app", "email"]);
  const queryClient = useQueryClient();

  const toggleNotifyMethod = (method) => {
    setNotifyMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      await onUpdate(updates);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["favorite", favorite?.id] });
      const previous = queryClient.getQueryData(["favorite", favorite?.id]);
      queryClient.setQueryData(["favorite", favorite?.id], { ...favorite, ...updates });
      return { previous };
    },
    onError: (err, updates, context) => {
      queryClient.setQueryData(["favorite", favorite?.id], context.previous);
      toast.error("Failed to save settings");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", favorite?.id] });
      toast.success("Notification settings saved!");
    },
  });

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      notify_on_wait_drop: notifyOnWaitDrop,
      notify_on_status_change: notifyOnClosure,
      notify_on_ride_reopen: notifyOnReopen,
      wait_time_threshold: notifyOnWaitDrop ? threshold : null,
      notify_methods: notifyMethods
    });
  };

  return (
    <Card className="border-violet-200/60 dark:border-violet-800/60 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
            <Bell className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-base dark:text-white">Notification Alerts</CardTitle>
            <CardDescription className="text-xs dark:text-slate-400">Get notified when conditions are met</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="wait-drop" className="text-sm flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-violet-500" />
              Wait time drops below threshold
            </Label>
            <Switch
              id="wait-drop"
              checked={notifyOnWaitDrop}
              onCheckedChange={setNotifyOnWaitDrop}
            />
          </div>
          
          {notifyOnWaitDrop && (
            <div className="ml-6 flex items-center gap-2">
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-20 h-8"
                min="5"
                max="120"
              />
              <span className="text-xs text-slate-600">minutes</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
             <Label htmlFor="closure" className="text-sm flex items-center gap-2">
               <Mail className="w-3.5 h-3.5 text-violet-500" />
               Ride closure alerts
             </Label>
             <Switch
               id="closure"
               checked={notifyOnClosure}
               onCheckedChange={setNotifyOnClosure}
             />
           </div>

           {isPremium && (
             <div className="flex items-center justify-between">
               <Label htmlFor="reopen" className="text-sm flex items-center gap-2">
                 <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                 Ride reopen alerts
               </Label>
               <Switch
                 id="reopen"
                 checked={notifyOnReopen}
                 onCheckedChange={setNotifyOnReopen}
               />
             </div>
           )}
          </div>

        {/* Notification Methods */}
        <div className="space-y-3 pt-4 border-t border-violet-200/50 dark:border-violet-800/50">
          <Label className="text-sm font-semibold text-slate-900 dark:text-white">Notification Methods</Label>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-500" />
                <span className="text-sm dark:text-white">App Notification</span>
              </div>
              <Switch
                checked={notifyMethods.includes("app")}
                onCheckedChange={() => toggleNotifyMethod("app")}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-500" />
                <span className="text-sm dark:text-white">Email Notification</span>
              </div>
              <Switch
                checked={notifyMethods.includes("email")}
                onCheckedChange={() => toggleNotifyMethod("email")}
              />
            </div>

            {isPremium && (
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <div>
                    <span className="text-sm dark:text-white">SMS Notification</span>
                    {!userPhoneNumber && (
                      <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">Add phone in profile first</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={notifyMethods.includes("sms") && !!userPhoneNumber}
                  onCheckedChange={() => toggleNotifyMethod("sms")}
                  disabled={!userPhoneNumber}
                />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-violet-600 hover:bg-violet-700"
          size="sm"
        >
          {updateMutation.isPending ? "Saving..." : "Save Alert Settings"}
        </Button>
        
        {(notifyOnWaitDrop || notifyOnClosure || notifyOnReopen) && (
           <div className="bg-violet-100/50 dark:bg-violet-900/30 rounded-lg p-3 text-xs text-violet-700 dark:text-violet-300">
             <strong>Active Alerts:</strong>
             {notifyOnWaitDrop && <div>• Wait drops below {threshold} min</div>}
             {notifyOnClosure && <div>• Ride closure</div>}
             {notifyOnReopen && <div>• Ride reopen</div>}
             {notifyMethods.length > 0 && <div>• Via: {notifyMethods.join(', ').toUpperCase()}</div>}
           </div>
         )}

        <p className="text-[10px] text-slate-500 text-center">
          Alerts sent max once per 2 hours per ride
        </p>
      </CardContent>
    </Card>
  );
}