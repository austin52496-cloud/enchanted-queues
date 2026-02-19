import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Zap, Ruler, Star, Lightbulb, TrendingDown, TrendingUp, MapPin, Heart, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WaitTimeChart from "@/components/WaitTimeChart";

import PremiumGate from "@/components/PremiumGate";
import NotificationSettings from "@/components/NotificationSettings";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format, addDays, isAfter, isBefore } from "date-fns";

const typeLabels = {
  thrill: "Thrill Ride", family: "Family Ride", show: "Show",
  water: "Water Ride", dark_ride: "Dark Ride", spinner: "Spinner"
};

// Reliable fallback forecast using well-researched Disney crowd patterns
function generateFallbackForecast(ride, forecastDate, parkHours) {
  const month = forecastDate.getMonth();
  const dayOfWeek = forecastDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Real-world Disney crowd multipliers by season
  const seasonMult = month >= 5 && month <= 7 ? 1.35    // Summer peak
    : month === 11 || month === 0 ? 1.25                // Holiday/Christmas
    : (month === 2 || month === 3) ? 1.15               // Spring break
    : isWeekend ? 1.1 : 0.85;                           // Shoulder season

  // Sane base wait — never show 0 or garbage
  const baseWait = Math.max(15, Math.min(ride?.avg_wait_minutes || 35, 90));
  const peakWait = Math.max(baseWait * 1.8, ride?.peak_wait_minutes || baseWait * 2);

  let startHour = 9, endHour = 22;
  if (parkHours && !parkHours.is_closed) {
    const parseHour = (str) => {
      const m = str?.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return null;
      let h = parseInt(m[1]);
      if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
      return h;
    };
    startHour = parseHour(parkHours.open_time) ?? 9;
    endHour = parseHour(parkHours.close_time) ?? 22;
  }

  // Realistic Disney crowd curve: slow open → builds to midday peak → evening dip → slight close surge
  const crowdCurve = (progress) => {
    if (progress < 0.15) return 0.25 + progress * 2.0;   // Rope drop — short waits
    if (progress < 0.45) return 0.60 + progress * 0.9;   // Morning build
    if (progress < 0.60) return 0.95 + progress * 0.1;   // Midday peak (1-3pm)
    if (progress < 0.75) return 1.0 - progress * 0.4;    // Afternoon drop
    if (progress < 0.90) return 0.70 - progress * 0.2;   // Dinner lull
    return 0.55 + progress * 0.3;                        // Evening surge before close
  };

  const totalHours = Math.max(endHour - startHour, 1);
  const result = [];

  for (let hour24 = startHour; hour24 <= endHour; hour24++) {
    const progress = (hour24 - startHour) / totalHours;
    const rawWait = Math.round(baseWait * crowdCurve(progress) * seasonMult);
    const wait = Math.max(5, Math.min(rawWait, peakWait));

    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    result.push({ hour: `${hour12} ${ampm}`, wait, isHistorical: false });
  }
  return result;
}

// Merge real historical data into forecast — real data always wins over prediction
function generateDailyForecast(ride, historicalData, forecastDate, parkHours) {
  const fallback = generateFallbackForecast(ride, forecastDate, parkHours);

  if (!historicalData || historicalData.length === 0) return fallback;

  // Replace forecast slots where we have real data
  return fallback.map(slot => {
    const hour24 = (() => {
      const [time, ampm] = slot.hour.split(' ');
      let h = parseInt(time);
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h;
    })();

    const realPoints = historicalData.filter(h => h.hour === hour24);
    if (realPoints.length > 0) {
      const avgWait = Math.round(realPoints.reduce((s, h) => s + h.wait, 0) / realPoints.length);
      return { ...slot, wait: avgWait, isHistorical: true };
    }
    return slot;
  });
}

// AI-powered insight for the forecast (calls Claude API)
async function getAIForecastInsight(ride, forecastData, forecastDate) {
  try {
    // Call our new dynamic AI tip Edge Function
    const resp = await fetch("https://sviblotdflujritawqem.supabase.co/functions/v1/generateAITip", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2aWJsb3RkZmx1anJpdGF3cWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzOTUsImV4cCI6MjA4NjkxNjM5NX0.VmJhHUmO7JmL4NFsZWMHLWcdfqS1DCSN7XM_00kdVUQ"
      },
      body: JSON.stringify({ rideId: ride.id })
    });
    
    if (!resp.ok) {
      console.error('AI tip fetch failed:', resp.status);
      return getFallbackTip(ride, forecastData);
    }
    
    const data = await resp.json();
    return data.tip || getFallbackTip(ride, forecastData);
  } catch (error) {
    console.error('AI tip error:', error);
    return getFallbackTip(ride, forecastData);
  }
}

// Fallback tip if Edge Function fails
function getFallbackTip(ride, forecastData) {
  const bestSlot = forecastData.reduce((min, d) => d.wait < min.wait ? d : min, forecastData[0]);
  const currentWait = ride.current_wait_minutes || 0;
  
  if (currentWait < 20) {
    return `🎉 Perfect timing! ${ride.name} has a short wait right now. Jump in line!`;
  } else if (bestSlot && bestSlot.wait < currentWait - 10) {
    return `⏰ Best time to ride is around ${bestSlot.hour} with an estimated ${bestSlot.wait} min wait. Plan accordingly!`;
  } else {
    return `💡 ${ride.name} is popular today. Consider using Lightning Lane or visiting during meal times for shorter waits.`;
  }
}

export default function RideDetail() {
  const params = new URLSearchParams(window.location.search);
  const rideId = params.get("rideId") || params.get("rideid");

  const [forecastDate, setForecastDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiInsight, setAiInsight] = useState(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const queryClient = useQueryClient();

  // Update current time every minute
  React.useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: user } = useQuery({
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

  const { data: ride, isLoading } = useQuery({
    queryKey: ["ride", rideId],
    queryFn: async () => {
      const rides = await base44.entities.Ride.list();
      return rides.find(r => r.id === rideId);
    },
    enabled: !!rideId,
  });

  const { data: favoriteData } = useQuery({
    queryKey: ["favorite", rideId, user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_email', user.email)
        .eq('ride_id', rideId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Favorite query error:', error);
      }
      return data;
    },
    enabled: !!user?.email && !!rideId,
  });

  const isFavorite = !!favoriteData;

  const { data: parkHours } = useQuery({
    queryKey: ["parkHours", ride?.park_id, forecastDate.toDateString()],
    queryFn: async () => {
      if (!ride?.park_id) return null;
      const hours = await base44.entities.ParkHours.filter({ park_id: ride.park_id });
      // Find matching date same way as ParkDetail
      return hours.find(h => {
        if (!h.date) return false;
        const hDate = new Date(h.date);
        return hDate.toDateString() === forecastDate.toDateString();
      }) || null;
    },
    enabled: !!ride?.park_id,
  });

  // Fetch AI-powered forecast from Edge Function
  const { data: aiForecastData } = useQuery({
    queryKey: ["aiForecast", rideId, forecastDate.toISOString().split('T')[0]],
    queryFn: async () => {
      try {
        const response = await fetch('https://sviblotdflujritawqem.supabase.co/functions/v1/generateAIForecast', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2aWJsb3RkZmx1anJpdGF3cWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDAzOTUsImV4cCI6MjA4NjkxNjM5NX0.VmJhHUmO7JmL4NFsZWMHLWcdfqS1DCSN7XM_00kdVUQ'
          },
          body: JSON.stringify({ 
            rideId: rideId,
            date: forecastDate.toISOString().split('T')[0]
          })
        });
        
        if (!response.ok) {
          console.error('AI forecast fetch failed:', response.status);
          return null;
        }
        
        const data = await response.json();
        return data.success ? data.forecast : null;
      } catch (error) {
        console.error('AI forecast error:', error);
        return null;
      }
    },
    enabled: !!rideId && !!forecastDate && isPremium, // Only fetch for premium users
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const { data: historicalData = [] } = useQuery({
    queryKey: ["history", rideId, forecastDate.toDateString()],
    queryFn: async () => {
      const startOfDay = new Date(forecastDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(forecastDate);
      endOfDay.setHours(23, 59, 59, 999);

      const history = await base44.entities.WaitTimeHistory.filter({ ride_id: rideId }, "-recorded_at", 5000);
      
      // Filter for selected date
      const dayHistory = history.filter(h => {
        const recordedDate = new Date(h.recorded_at);
        return recordedDate >= startOfDay && recordedDate <= endOfDay;
      });
      
      // Sort by time
      dayHistory.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
      
      return dayHistory.map(h => ({
        time: new Date(h.recorded_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        hour: new Date(h.recorded_at).getHours(),
        wait: h.wait_minutes,
        isHistorical: true
      }));
    },
    enabled: !!rideId,
  });

  const selectedDateStr = forecastDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isToday = forecastDate.toDateString() === new Date().toDateString();

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please sign in to save favorites");
        return;
      }
      if (!isPremium) {
        toast.error("Upgrade to Premium to save favorites");
        return;
      }
      
      if (isFavorite) {
        // Delete favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', favoriteData.id);
        
        if (error) throw error;
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_email: user.email,
            ride_id: rideId,
            ride_name: ride?.name,
            park_name: ride?.park_name
          });
        
        if (error) throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["favorite", rideId, user?.email] });
      const previousFavorite = queryClient.getQueryData(["favorite", rideId, user?.email]);
      queryClient.setQueryData(["favorite", rideId, user?.email], isFavorite ? null : { 
        id: "temp", 
        user_email: user.email, 
        ride_id: rideId, 
        ride_name: ride?.name 
      });
      return { previousFavorite };
    },
    onError: (err, newFav, context) => {
      queryClient.setQueryData(["favorite", rideId, user?.email], context.previousFavorite);
      toast.error("Failed to update favorite");
      console.error('Favorite error:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", rideId, user?.email] });
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites!");
    },
  });

  const updateNotifications = useMutation({
    mutationFn: async (settings) => {
      if (!favoriteData) return;
      await base44.entities.Favorite.update(favoriteData.id, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["favorite"]);
    },
  });

  // Get current hour early so it's available for calculateUptime
  const now = new Date();
  const currentHour24 = now.getHours();

  // Calculate uptime percentage (only during park operating hours)
  const calculateUptime = () => {
    if (!parkHours || parkHours.is_closed) return null;
    if (historicalData.length === 0) return null; // Need historical data to calculate uptime
    
    // Parse park hours
    const openMatch = parkHours.open_time?.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let startHour = 9;
    if (openMatch) {
      let hour = parseInt(openMatch[1]);
      if (openMatch[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (openMatch[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
      startHour = hour;
    }
    
    // For today, only count hours from park open to current hour
    const countUntilHour = isToday ? currentHour24 : 24;
    
    // Get all unique hours in the relevant range
    const relevantHours = new Set();
    historicalData.forEach(h => {
      if (h.hour >= startHour && h.hour <= countUntilHour) {
        relevantHours.add(h.hour);
      }
    });
    
    // An hour is "down" if it has no data recorded for it (it was closed)
    const downHours = [];
    for (let hour = startHour; hour <= countUntilHour; hour++) {
      if (!relevantHours.has(hour)) {
        downHours.push(hour);
      }
    }
    
    const totalHours = countUntilHour - startHour + 1;
    const upHours = totalHours - downHours.length;
    
    return Math.round((upHours / totalHours) * 100);
  };

  let forecast = ride ? generateDailyForecast(ride, historicalData, forecastDate, parkHours) : [];

  // Auto-generate AI insight when ride + forecast are ready
  React.useEffect(() => {
    if (!ride || forecast.length === 0 || aiInsight) return;
    setAiInsightLoading(true);
    getAIForecastInsight(ride, forecast, forecastDate).then(tip => {
      setAiInsight(tip);
      setAiInsightLoading(false);
    });
  }, [ride?.id, forecastDate.toDateString()]);

  const uptimePercentage = calculateUptime();

  // Calculate stats for the selected date only
  const avgWaitForDate = historicalData.length > 0 
    ? Math.round(historicalData.reduce((sum, h) => sum + h.wait, 0) / historicalData.length)
    : ride?.avg_wait_minutes || null;

  const peakWaitForDate = historicalData.length > 0
    ? Math.max(...historicalData.map(h => h.wait))
    : ride?.peak_wait_minutes || null;
  
  // Best time today is the lowest wait from actual synced data
  const bestTimeToday = historicalData.length > 0 ? historicalData.reduce((min, d) => d.wait < min.wait ? d : min, historicalData[0]) : null;
  
  // Worst time from forecast
  const worstTime = forecast.length ? forecast.reduce((max, d) => d.wait > max.wait ? d : max, forecast[0]) : null;

  // Format current hour for "Now" line and color transition
  const currentHour12 = currentHour24 === 0 ? 12 : currentHour24 > 12 ? currentHour24 - 12 : currentHour24;
  const currentAMPM = currentHour24 >= 12 ? 'PM' : 'AM';
  const currentHourLabel = isToday ? `${currentHour12} ${currentAMPM}` : null;

  const maxFutureDate = addDays(new Date(), isPremium ? 60 : 0);
  const disabledDates = (date) => {
    if (isPremium) {
      return isAfter(date, maxFutureDate);
    } else {
      // Non-premium can only view past dates (historical data)
      return isAfter(date, new Date());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Ride not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="relative h-56 md:h-72 overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600">
       <div className="absolute inset-0 bg-black/20" />
       <div className="absolute top-6 left-6 right-6 flex justify-between">
         <Link to={createPageUrl(`ParkDetail?parkId=${ride.park_id}`)}>
           <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl">
             <ArrowLeft className="w-5 h-5" />
           </Button>
         </Link>
         <div className="flex gap-2">
           <Button
             variant="ghost"
             size="icon"
             onClick={async () => {
               setIsRefreshing(true);
               await queryClient.invalidateQueries({ queryKey: ["ride", rideId] });
               await queryClient.invalidateQueries({ queryKey: ["history", rideId] });
               setIsRefreshing(false);
             }}
             className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl"
             disabled={isRefreshing}
           >
             <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => toggleFavorite.mutate()}
             className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl"
           >
             <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
           </Button>
         </div>
       </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/20 text-xs">
              {typeLabels[ride.type] || ride.type}
            </Badge>
            {ride.has_lightning_lane && (
              <Badge className="bg-amber-500/20 backdrop-blur-sm text-amber-200 border-amber-300/20 text-xs">
                <Zap className="w-3 h-3 mr-1" />Lightning Lane
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{ride.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 text-sm text-white/70">
            <MapPin className="w-3.5 h-3.5" />
            {ride.land} · {ride.park_name}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Closed Notice */}
        {ride.is_open === false && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-5 border border-slate-300 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Temporarily Closed</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">This attraction is currently not operating. Check back later for updates.</p>
            </div>
          </div>
        </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ride.is_open !== false && ride.current_wait_minutes != null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} 
              className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 border border-red-200/60 text-center relative overflow-hidden">
              <div className="absolute top-1 right-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
              <Clock className="w-5 h-5 text-red-600 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-red-600">{ride.current_wait_minutes}</p>
              <p className="text-[10px] text-red-600 uppercase tracking-wider mt-0.5 font-bold">Live Now</p>
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <Clock className="w-5 h-5 text-violet-500 mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{avgWaitForDate || "—"}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{isToday ? "Today's Avg" : "Avg Wait"}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <TrendingUp className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">{peakWaitForDate || "—"}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{isToday ? "Today's Peak" : "Peak Wait"}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <TrendingDown className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{bestTimeToday?.wait || "—"}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Today's Lowest Wait</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <Ruler className="w-5 h-5 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-slate-700 dark:text-white">{ride.height_requirement || "None"}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Height Req</p>
          </motion.div>
          {uptimePercentage != null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{uptimePercentage}%</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Uptime</p>
            </motion.div>
          )}
        </div>

        {/* Forecast & Historical Data */}
         <Card className="border-slate-200/60 dark:border-slate-700/60 dark:bg-slate-800 shadow-sm">
          <Tabs defaultValue="forecast" className="w-full">
          <CardHeader className="pb-3">
           <TabsList className="grid w-full grid-cols-1">
             <TabsTrigger value="forecast">
               <Star className="w-4 h-4 mr-2" />
               Forecast
             </TabsTrigger>
           </TabsList>
          </CardHeader>
            <CardContent className="space-y-5">
              <TabsContent value="forecast" className="mt-0 space-y-5">
                <div className="space-y-3">
                 <div className="flex items-center justify-between gap-2 flex-wrap">
                   <div>
                     <h4 className="text-sm font-semibold text-slate-700 dark:text-white">
                       {isToday ? "Today's Forecast" : selectedDateStr}
                     </h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                       {historicalData.length > 0 ? "Historical + AI forecast" : "AI-powered predictions"}
                     </p>
                   </div>
                   <div className="flex gap-2">
                     {isPremium && (
                       <Popover>
                         <PopoverTrigger asChild>
                           <Button 
                             variant="outline" 
                             size="sm"
                             className="h-8 gap-1.5"
                           >
                             <Calendar className="w-4 h-4" />
                             <span className="hidden sm:inline">Pick Date</span>
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-auto p-0" align="end">
                           <CalendarPicker
                             mode="single"
                             selected={forecastDate}
                             onSelect={(date) => date && setForecastDate(date)}
                             disabled={disabledDates}
                             initialFocus
                           />
                         </PopoverContent>
                       </Popover>
                     )}
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => setForecastDate(new Date(forecastDate.getTime() - 86400000))}
                       className="h-8"
                     >
                       ← Prev
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => setForecastDate(new Date(forecastDate.getTime() + 86400000))}
                       className="h-8"
                     >
                       Next →
                     </Button>
                   </div>
                  </div>
                </div>
                <WaitTimeChart 
                   data={historicalData}
                   aiForecast={aiForecastData}
                   fallbackForecast={forecast}
                   currentHour={currentHourLabel}
                   currentWait={isToday && ride.current_wait_minutes != null ? ride.current_wait_minutes : null}
                   rideIsOpen={ride.is_open !== false}
                 />
                 <div className="flex items-center gap-3 text-xs">
                   <div className="flex items-center gap-1.5">
                     <div className="w-3 h-3 rounded-sm bg-violet-200 dark:bg-violet-300" />
                     <span className="text-slate-600 dark:text-slate-400">Historical Data</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <div className="w-3 h-3 rounded-sm bg-violet-500 dark:bg-violet-600" />
                     <span className="text-slate-600 dark:text-slate-400">AI Forecast</span>
                   </div>
                 </div>

                 {/* AI Insight Box */}
                 <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 rounded-xl p-4 border border-violet-200/60 dark:border-violet-800/40">
                   <div className="flex items-center gap-2 mb-2">
                     <span className="text-sm font-semibold text-violet-800 dark:text-violet-300">🧚 AI Tip for This Day</span>
                     {aiInsightLoading && <span className="text-xs text-violet-400 animate-pulse">Thinking...</span>}
                   </div>
                   {aiInsight ? (
                     <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">{aiInsight}</p>
                   ) : !aiInsightLoading ? (
                     <p className="text-xs text-violet-400 italic">Tip unavailable — check your connection.</p>
                   ) : null}
                 </div>


              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Pro Tip */}
        {ride.tip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-800/40"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Pro Tip</h4>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 leading-relaxed">{ride.tip}</p>
              </div>
            </div>
          </motion.div>
        )}



        {/* Notification Settings - Premium Only */}
         {isPremium && isFavorite && favoriteData && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
             <NotificationSettings
               favorite={favoriteData}
               onUpdate={(settings) => updateNotifications.mutate(settings)}
               isPremium={isPremium}
               userPhoneNumber={user?.phone_number}
             />
           </motion.div>
         )}

        {/* Best Time Highlight */}
        {bestTimeToday && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-5 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Lowest Wait Today</h4>
                <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
                  The shortest wait today was at <span className="font-bold">{bestTimeToday.time}</span> with <span className="font-bold">{bestTimeToday.wait} minutes</span>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}