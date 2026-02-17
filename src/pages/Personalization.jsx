import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Bell, Layout as LayoutIcon, Sparkles, Moon, Sun, MonitorSmartphone, Crown, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function Personalization() {
  const queryClient = useQueryClient();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs[0];
    },
    enabled: !!user?.email,
  });

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";

  const defaultPreferences = {
    theme: "system",
    compactView: false,
    showWaitTimeColors: true,
    defaultSortBy: "wait_time",
    autoRefresh: true,
    refreshInterval: 5,
    resort: "",
  };

  const [tripCheckInDate, setTripCheckInDate] = useState("");

  const { data: resorts = [] } = useQuery({
    queryKey: ["resorts"],
    queryFn: () => base44.entities.Resort.list(),
  });

  const [preferences, setPreferences] = useState(defaultPreferences);

  // Load saved preferences when user data is available
  React.useEffect(() => {
    if (user?.preferences) {
      setPreferences({ ...defaultPreferences, ...user.preferences });
    }
    if (user?.trip_check_in_date) {
      setTripCheckInDate(user.trip_check_in_date);
    }
  }, [user]);

  const updatePreferences = useMutation({
    mutationFn: async (newPrefs) => {
      return await base44.auth.updateMe({
        preferences: newPrefs,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Preferences saved");
    },
    onError: (error) => {
      toast.error("Failed to save preferences");
      console.error(error);
    },
  });

  const updateTripDate = useMutation({
    mutationFn: async (date) => {
      return await base44.auth.updateMe({
        trip_check_in_date: date || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Trip date saved");
    },
    onError: (error) => {
      toast.error("Failed to save trip date");
      console.error(error);
    },
  });

  const handlePreferenceChange = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    updatePreferences.mutate(newPrefs);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to personalize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => base44.auth.redirectToLogin()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Personalization</h1>
          <p className="text-slate-600 dark:text-slate-400">Customize your Enchanted Queues experience</p>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-violet-500" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription className="dark:text-slate-400">Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-white">Theme</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose your preferred color scheme</p>
                </div>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => handlePreferenceChange("theme", value)}
                >
                  <SelectTrigger className="w-36 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="system" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <MonitorSmartphone className="w-4 h-4" />
                        System
                      </div>
                    </SelectItem>
                    <SelectItem value="light" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Dark
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800">
                <div>
                  <Label className="dark:text-white">Compact View</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Show more content on screen</p>
                </div>
                <Switch
                  checked={preferences.compactView}
                  onCheckedChange={(checked) => handlePreferenceChange("compactView", checked)}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800">
                <div>
                  <Label className="dark:text-white">Wait Time Colors</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Color-code wait times by duration</p>
                </div>
                <Switch
                  checked={preferences.showWaitTimeColors}
                  onCheckedChange={(checked) => handlePreferenceChange("showWaitTimeColors", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LayoutIcon className="w-5 h-5 text-violet-500" />
                <CardTitle>Display Preferences</CardTitle>
              </div>
              <CardDescription className="dark:text-slate-400">Control how information is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-white">Default Sort Order</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">How rides are sorted by default</p>
                </div>
                <Select
                  value={preferences.defaultSortBy}
                  onValueChange={(value) => handlePreferenceChange("defaultSortBy", value)}
                >
                  <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="wait_time" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">Wait Time</SelectItem>
                    <SelectItem value="name" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">Name</SelectItem>
                    <SelectItem value="area" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Trip Check-in Date */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-500" />
                <CardTitle>My Disney Trip</CardTitle>
              </div>
              <CardDescription className="dark:text-slate-400">Set your trip check-in date and resort for a countdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="trip-date" className="dark:text-white">Check-in Date</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Display a countdown to your trip on the homepage</p>
                <Input
                  id="trip-date"
                  type="date"
                  value={tripCheckInDate}
                  onChange={(e) => {
                    setTripCheckInDate(e.target.value);
                    updateTripDate.mutate(e.target.value);
                  }}
                  className="mt-3 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800">
                <div>
                  <Label className="dark:text-white">Resort</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your Disney resort</p>
                </div>
                <Select
                  value={preferences.resort || ""}
                  onValueChange={(value) => handlePreferenceChange("resort", value)}
                >
                  <SelectTrigger className="w-48 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select a resort" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {resorts.sort((a, b) => (a.order || 0) - (b.order || 0)).map((resort) => (
                      <SelectItem key={resort.id} value={resort.value} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">
                        {resort.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data & Updates */}
           <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <CardTitle>Data & Updates</CardTitle>
              </div>
              <CardDescription className="dark:text-slate-400">Control how often data refreshes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-white">Auto-Refresh</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Automatically update wait times</p>
                </div>
                <Switch
                  checked={preferences.autoRefresh}
                  onCheckedChange={(checked) => handlePreferenceChange("autoRefresh", checked)}
                />
              </div>

              {preferences.autoRefresh && (
                <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800">
                  <div>
                    <Label className="dark:text-white">Refresh Interval</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">How often to update (minutes)</p>
                  </div>
                  <Select
                    value={preferences.refreshInterval.toString()}
                    onValueChange={(value) => handlePreferenceChange("refreshInterval", parseInt(value))}
                  >
                    <SelectTrigger className="w-28 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="1" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">1 min</SelectItem>
                      <SelectItem value="3" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">3 min</SelectItem>
                      <SelectItem value="5" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">5 min</SelectItem>
                      <SelectItem value="10" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">10 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}