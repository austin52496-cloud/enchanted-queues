import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Filter, MapPin, Clock, Zap, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RideCard from "@/components/RideCard";
import ParkHoursCalendar from "@/components/ParkHoursCalendar";
import { cn } from "@/lib/utils";

const rideTypes = [
  { key: "all", label: "All" },
  { key: "thrill", label: "Thrill" },
  { key: "family", label: "Family" },
  { key: "dark_ride", label: "Dark Ride" },
  { key: "water", label: "Water" },
  { key: "show", label: "Show" },
  { key: "spinner", label: "Spinner" },
];

const sortOptions = [
  { key: "wait_low", label: "Shortest Wait" },
  { key: "wait_high", label: "Longest Wait" },
  { key: "area", label: "By Area" },
  { key: "closed", label: "Closed First" },
];

export default function ParkDetail() {
  const params = new URLSearchParams(window.location.search);
  const parkId = params.get("parkId");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("wait_low");
  const [showClosed, setShowClosed] = useState(true);

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

  // Load user's default sort preference
  React.useEffect(() => {
    if (user?.preferences?.defaultSortBy) {
      const prefToSortKey = {
        "wait_time": "wait_low",
        "area": "area"
      };
      setSortBy(prefToSortKey[user.preferences.defaultSortBy] || "wait_low");
    }
  }, [user]);

  const { data: park, isLoading: parkLoading } = useQuery({
    queryKey: ["park", parkId],
    queryFn: async () => {
      const parks = await base44.entities.Park.filter({ id: parkId });
      return parks[0];
    },
    enabled: !!parkId,
  });

  const { data: parkHoursList = [] } = useQuery({
    queryKey: ["park-hours", parkId],
    queryFn: () => base44.entities.ParkHours.filter({ park_id: parkId }),
    enabled: !!parkId,
  });

  const todayHours = parkHoursList.length > 0 ? parkHoursList.find(h => {
    if (!h.date) return false;
    const hDate = new Date(h.date);
    const today = new Date();
    return hDate.toDateString() === today.toDateString();
  }) : null;

  // Check if park is currently open (including early entry)
  const isParkOpen = () => {
    if (!todayHours || todayHours.is_closed) return false;
    
    const now = new Date();
    const currentTimeEST = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
    const [datePart, timePart] = currentTimeEST.split(', ');
    const [hour, minute] = timePart.split(':').map(Number);
    const currentMinutes = hour * 60 + minute;
    
    // Parse early entry time if available
    let openMinutes;
    if (todayHours.early_entry_time) {
      const earlyMatch = todayHours.early_entry_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (earlyMatch) {
        let earlyHour = parseInt(earlyMatch[1]);
        const earlyMin = parseInt(earlyMatch[2]);
        if (earlyMatch[3].toUpperCase() === 'PM' && earlyHour !== 12) earlyHour += 12;
        if (earlyMatch[3].toUpperCase() === 'AM' && earlyHour === 12) earlyHour = 0;
        openMinutes = earlyHour * 60 + earlyMin;
      }
    }
    
    // Parse regular open time if no early entry
    if (openMinutes === undefined) {
      const openMatch = todayHours.open_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!openMatch) return true;
      let openHour = parseInt(openMatch[1]);
      const openMin = parseInt(openMatch[2]);
      if (openMatch[3].toUpperCase() === 'PM' && openHour !== 12) openHour += 12;
      if (openMatch[3].toUpperCase() === 'AM' && openHour === 12) openHour = 0;
      openMinutes = openHour * 60 + openMin;
    }
    
    // Parse close time (use extended hours if available)
    let closeMinutes;
    const closeTime = todayHours.extended_hours_close || todayHours.close_time;
    const closeMatch = closeTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!closeMatch) return true;
    let closeHour = parseInt(closeMatch[1]);
    const closeMin = parseInt(closeMatch[2]);
    if (closeMatch[3].toUpperCase() === 'PM' && closeHour !== 12) closeHour += 12;
    if (closeMatch[3].toUpperCase() === 'AM' && closeHour === 12) closeHour = 0;
    closeMinutes = closeHour * 60 + closeMin;
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  const parkOpen = isParkOpen();

  const { data: rides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ["rides", parkId],
    queryFn: () => base44.entities.Ride.filter({ park_id: parkId }),
    enabled: !!parkId,
  });

  const { data: allHistory = {} } = useQuery({
    queryKey: ["ride-history", parkId],
    queryFn: async () => {
      const history = await base44.entities.WaitTimeHistory.filter(
        { park_id: parkId },
        "-recorded_at",
        500
      );
      
      // Group by ride_id
      const grouped = {};
      history.forEach(h => {
        if (!grouped[h.ride_id]) grouped[h.ride_id] = [];
        grouped[h.ride_id].push(h);
      });
      
      // Keep only last 10 for each ride
      Object.keys(grouped).forEach(rideId => {
        grouped[rideId] = grouped[rideId].slice(0, 10).reverse();
      });
      
      return grouped;
    },
    enabled: !!parkId,
  });

  // Fetch all of today's history for accurate stats
  const { data: todayHistory = [] } = useQuery({
    queryKey: ["today-history", parkId, new Date().toDateString()],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const history = await base44.entities.WaitTimeHistory.filter(
        { park_id: parkId },
        "-recorded_at",
        5000
      );
      
      return history.filter(h => {
        const recordedDate = new Date(h.recorded_at);
        return recordedDate >= startOfDay;
      });
    },
    enabled: !!parkId,
  });

  const filteredRides = useMemo(() => {
    let result = rides
      .filter(r => r.type && r.type !== "show" && !r.is_hidden) // Exclude shows, missing types, and hidden rides
      .filter(r => r.name?.toLowerCase().includes(search.toLowerCase()))
      .map(r => ({ ...r }));
    
    if (!showClosed) {
      result = result.filter(r => r.is_open !== false);
    }
    
    result.sort((a, b) => {
      if (sortBy === "closed") {
        const aClosed = a.is_open === false ? 1 : 0;
        const bClosed = b.is_open === false ? 1 : 0;
        if (aClosed !== bClosed) return bClosed - aClosed;
        const aWait = a.current_wait_minutes || a.avg_wait_minutes || 0;
        const bWait = b.current_wait_minutes || b.avg_wait_minutes || 0;
        return aWait - bWait;
      }
      if (sortBy === "area") {
        const landCompare = (a.land || "").localeCompare(b.land || "");
        if (landCompare !== 0) return landCompare;
        return (a.name || "").localeCompare(b.name || "");
      }
      const aWait = a.current_wait_minutes || a.avg_wait_minutes || 0;
      const bWait = b.current_wait_minutes || b.avg_wait_minutes || 0;
      if (sortBy === "wait_low") return aWait - bWait;
      if (sortBy === "wait_high") return bWait - aWait;
      return 0;
    });
    return result;
  }, [rides, search, sortBy, parkOpen, showClosed]);

  const groupedByArea = useMemo(() => {
    if (sortBy !== "area") return null;
    const groups = {};
    filteredRides.forEach(ride => {
      const area = ride.land || "Unknown";
      if (!groups[area]) groups[area] = [];
      groups[area].push(ride);
    });
    return groups;
  }, [filteredRides, sortBy]);

  if (parkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700">
        <div className="absolute top-6 left-6">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{park?.name}</h1>
          <div className="flex items-center gap-3 mt-3">
            {todayHours ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-sm text-white/70">
                  <Clock className="w-3.5 h-3.5" />
                  {todayHours.is_closed ? "Closed" : `${todayHours.open_time} - ${todayHours.close_time}`}
                </div>
                {(todayHours.early_entry_time || todayHours.extended_hours_close) && (
                  <div className="text-xs text-white/60 ml-5">
                    {todayHours.early_entry_time && `Early Entry: ${todayHours.early_entry_time}`}
                    {todayHours.early_entry_time && todayHours.extended_hours_close && " • "}
                    {todayHours.extended_hours_close && `Extended: ${todayHours.extended_hours_close}`}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-white/70">Hours loading...</div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Park Hours Calendar */}
        <div className="mb-8">
          <ParkHoursCalendar parkId={parkId} parkName={park?.name} />
        </div>

        {/* Quick Stats */}
        {(() => {
          const displayRides = rides.filter(r => r.type && r.type !== "show" && !r.is_hidden);
          const openRides = displayRides.filter(r => r.is_open !== false);
          
          // For live stats when park is open - use current wait times, matching Home page calculation
          const allWaits = displayRides.map(r => r.current_wait_minutes || r.avg_wait_minutes || 0);
          const currentWaits = displayRides
            .filter(r => r.is_open !== false && (r.current_wait_minutes > 0 || r.avg_wait_minutes > 0))
            .map(r => r.current_wait_minutes || r.avg_wait_minutes || 0);
          
          const shortestWait = currentWaits.length > 0 ? Math.min(...currentWaits) : 0;
          const longestWait = currentWaits.length > 0 ? Math.max(...currentWaits) : 0;
          const avgWait = displayRides.length > 0 ? Math.round(allWaits.reduce((a, b) => a + b, 0) / displayRides.length) : 0;
          const lastSyncTime = displayRides.length > 0 ? new Date(Math.max(...displayRides.map(r => new Date(r.last_updated || 0).getTime()))) : null;

         const formatLastSync = (date) => {
           if (!date) return "Never";
           const now = new Date();
           const diffMs = now - date;
           const diffMins = Math.floor(diffMs / 60000);
           if (diffMins < 1) return "Just now";
           if (diffMins < 60) return `${diffMins}m ago`;
           const diffHours = Math.floor(diffMins / 60);
           if (diffHours < 24) return `${diffHours}h ago`;
           return date.toLocaleDateString();
         };

         // Calculate today's stats from full today history
         const getTodayStats = () => {
           if (!todayHistory || todayHistory.length === 0) return null;
           
           const allWaits = todayHistory.map(h => h.wait_minutes || 0).filter(w => w > 0);
           if (allWaits.length === 0) return null;
           
           return {
             avgWait: Math.round(allWaits.reduce((a, b) => a + b, 0) / allWaits.length),
             longestWait: Math.max(...allWaits)
           };
         };

         const todayStats = !parkOpen ? getTodayStats() : null;

         return (
           <div className="space-y-4 mb-8">
             {parkOpen ? (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
                   <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{openRides.length}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Open Rides</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
                   <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{shortestWait}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Shortest Wait</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
                   <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{avgWait}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Average Wait</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
                   <p className="text-2xl font-bold text-red-500 dark:text-red-400">{longestWait}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Longest Wait</p>
                 </div>
               </div>
             ) : todayStats ? (
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
                   <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{todayStats.avgWait} min</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Today's Avg Wait</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
                   <p className="text-2xl font-bold text-red-500 dark:text-red-400">{todayStats.longestWait} min</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Today's Longest Wait</p>
                 </div>
               </div>
             ) : (
               <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-center">
                 <p className="text-sm text-slate-500 dark:text-slate-400">Park is closed - no data available yet</p>
               </div>
             )}
             <div className="bg-gradient-to-r from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-800 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 justify-center">
               <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
               <p className="text-xs text-slate-600 dark:text-slate-400">Last synced <span className="font-semibold text-slate-700 dark:text-slate-300">{formatLastSync(lastSyncTime)}</span></p>
             </div>
           </div>
          );
         })()}

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rides..."
              className="rounded-full pl-11 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {sortOptions.map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  sortBy === s.key
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-300"
                )}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setShowClosed(!showClosed)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                showClosed
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-300"
              )}
            >
              {showClosed ? "Showing Closed" : "Hide Closed"}
            </button>
          </div>
        </div>

        {/* Rides */}
        {ridesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-24 border border-slate-100" />
            ))}
          </div>
        ) : filteredRides.length > 0 ? (
          sortBy === "area" && groupedByArea ? (
            <div className="space-y-6">
              {Object.entries(groupedByArea).map(([area, areaRides]) => (
                <div key={area}>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 px-1">{area}</h3>
                  <div className="space-y-3">
                    {areaRides.map((ride, i) => (
                      <RideCard 
                        key={ride.id} 
                        ride={ride} 
                        index={i}
                        history={allHistory[ride.id] || []}
                        isPremium={isPremium}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRides.map((ride, i) => (
                <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  index={i}
                  history={allHistory[ride.id] || []}
                  isPremium={isPremium}
                />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-slate-400">No rides match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}