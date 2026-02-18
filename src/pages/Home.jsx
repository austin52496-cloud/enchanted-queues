import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect as useEffectHook } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Clock, Sparkles, BarChart3, Bell, Heart, Newspaper, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";

function getGreeting(userLocation) {
  const now = new Date();
  const hour = userLocation ? new Date(now.toLocaleString('en-US', { timeZone: userLocation })).getHours() : now.getHours();
  
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good evening";
}
import { Input } from "@/components/ui/input";
import ParkCard from "@/components/ParkCard";
import SparkleIcon from "@/components/SparkleIcon";
import PullToRefresh from "@/components/PullToRefresh";
import AdBanner from "@/components/AdBanner";
import NewsCard from "@/components/NewsCard";
import TripCountdown from "@/components/TripCountdown";
import SystemMessageBanner from "@/components/SystemMessageBanner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";



export default function Home() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [timezone, setTimezone] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showRideModal, setShowRideModal] = useState(false);
  const newsScrollRef = React.useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => setUser(null));
    
    // Try to get user's timezone from their browser
    if (Intl && Intl.DateTimeFormat) {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(tz);
      } catch {
        setTimezone(null);
      }
    }
  }, []);

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

  const { data: parks = [], isLoading } = useQuery({
    queryKey: ["parks"],
    queryFn: async () => {
      const allParks = await base44.entities.Park.list();
      return allParks.filter(park => !park.is_hidden);
    },
  });

  const { data: weather } = useQuery({
    queryKey: ["weather"],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke("getWeather");
        return response.data;
      } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
      }
    },
    refetchInterval: 1800000, // Refresh every 30 minutes
  });

  const { data: rides = [] } = useQuery({
    queryKey: ["rides"],
    queryFn: () => base44.entities.Ride.list(),
  });

  const { data: parkHoursList = [] } = useQuery({
    queryKey: ["parkHours"],
    queryFn: async () => {
      return await base44.entities.ParkHours.list();
    },
  });

const { data: newsData } = useQuery({
  queryKey: ["parkNews"],
  queryFn: async () => {
    try {
      const response = await fetch('https://sviblotdflujritawqem.supabase.co/functions/v1/fetchParkNews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('News data:', data); // Debug log
      return data;
    } catch (error) {
      console.error('News fetch error:', error);
      return { success: false, articles: [] };
    }
  },
  refetchInterval: 3600000, // Refresh every hour
});

  const { data: homeTheme } = useQuery({
    queryKey: ["home-theme"],
    queryFn: async () => {
      const themes = await base44.entities.HomeTheme.list();
      return themes.find(t => t.is_active) || themes[0];
    },
  });

  const { data: systemMessages = [] } = useQuery({
    queryKey: ["systemMessages"],
    queryFn: () => base44.entities.SystemMessage.list(),
  });

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const getTodayHours = (parkId) => {
    if (!parkHoursList) return null;
    const today = new Date();
    return parkHoursList.find(h => {
      if (!h.date || h.park_id !== parkId) return false;
      const hDate = new Date(h.date);
      return hDate.toDateString() === today.toDateString();
    });
  };

  const getParkHoursDisplay = (parkId) => {
    const hours = getTodayHours(parkId);
    if (!hours) return "Hours loading...";
    if (hours.is_closed) return "Closed";

    let timeString = `${hours.open_time} - ${hours.close_time}`;
    if (hours.early_entry_time) {
      timeString = `Early ${hours.early_entry_time} • ${timeString}`;
    }
    if (hours.extended_hours_close) {
      timeString += ` • Ext ${hours.extended_hours_close}`;
    }
    return timeString;
  };

  const parkOrder = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom"];

  const filteredParks = parks.sort((a, b) => {
    const aIndex = parkOrder.indexOf(a.name);
    const bIndex = parkOrder.indexOf(b.name);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Exclude all shows and hidden rides (they don't post wait times)
  const filterableRides = rides.filter(ride => ride.type !== "show" && !ride.is_hidden);

  // Check if park is currently open
  const isParkOpen = (parkId) => {
    const hours = getTodayHours(parkId);
    if (!hours || hours.is_closed) return false;
    
    const now = new Date();
    const currentTimeEST = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
    const [datePart, timePart] = currentTimeEST.split(', ');
    const [hour, minute] = timePart.split(':').map(Number);
    const currentMinutes = hour * 60 + minute;
    
    // Parse open time
    const openMatch = hours.open_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!openMatch) return true;
    let openHour = parseInt(openMatch[1]);
    const openMin = parseInt(openMatch[2]);
    if (openMatch[3].toUpperCase() === 'PM' && openHour !== 12) openHour += 12;
    if (openMatch[3].toUpperCase() === 'AM' && openHour === 12) openHour = 0;
    const openMinutes = openHour * 60 + openMin;
    
    // Parse close time
    const closeMatch = hours.close_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!closeMatch) return true;
    let closeHour = parseInt(closeMatch[1]);
    const closeMin = parseInt(closeMatch[2]);
    if (closeMatch[3].toUpperCase() === 'PM' && closeHour !== 12) closeHour += 12;
    if (closeMatch[3].toUpperCase() === 'AM' && closeHour === 12) closeHour = 0;
    const closeMinutes = closeHour * 60 + closeMin;
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  const parkAverageWaits = (() => {
     const waits = {};
     parks.forEach(park => {
       const parkRides = rides.filter(r => r.park_id === park.id && r.type !== "show" && !r.is_hidden);
       const avg = parkRides.length > 0 
         ? Math.round(parkRides.reduce((sum, r) => sum + (r.current_wait_minutes || r.avg_wait_minutes || 0), 0) / parkRides.length)
         : 0;
       waits[park.id] = avg;
     });
     return waits;
   })();

  const overallAverageWait = (() => {
     const fourParks = parks.filter(p => ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom"].includes(p.name));
     const allWaits = fourParks.flatMap(park => {
       const parkRides = rides.filter(r => r.park_id === park.id && r.type !== "show" && !r.is_hidden);
       return parkRides.map(r => r.current_wait_minutes || r.avg_wait_minutes || 0);
     });
     return allWaits.length > 0 ? Math.round(allWaits.reduce((a, b) => a + b, 0) / allWaits.length) : 0;
   })();

  const handleRefresh = async () => {
   await Promise.all([
     queryClient.refetchQueries({ queryKey: ["parks"] }),
     queryClient.refetchQueries({ queryKey: ["rides"] }),
     queryClient.refetchQueries({ queryKey: ["parkHours"] }),
   ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-white dark:bg-slate-950 dark:text-white text-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 px-6 pt-12 pb-20">
        <style>{`
          @keyframes heroGlow {
            0%, 100% { opacity: 0.1; transform: scale(1); }
            50% { opacity: 0.25; transform: scale(1.1); }
          }
          @keyframes heroShift {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .hero-glow-1 { animation: heroGlow 8s ease-in-out infinite; }
          .hero-glow-2 { animation: heroGlow 6s ease-in-out infinite 1s; }
          .hero-glow-3 { animation: heroGlow 10s ease-in-out infinite 2s; }
          .hero-shift { animation: heroShift 20s linear infinite; }
        `}</style>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl hero-glow-1" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl hero-glow-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl hero-glow-3 hero-shift" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl hero-glow-1" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <SparkleIcon className="w-4 h-4" color="#E879F9" />
              <span className="text-xs font-medium text-white tracking-wide">AI-POWERED FORECASTS</span>
            </div>

            {user && (
              <p className="text-white text-lg mb-4">{getGreeting(timezone)}, {user.full_name || user.email}! ✨</p>
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
              Disney Parks
              <br />
              <span className="bg-gradient-to-r from-white via-violet-100 to-pink-100 bg-clip-text text-transparent">
                Enchanted-Queues
              </span>
            </h1>

            <p className="text-white/90 text-lg mt-4 max-w-lg mx-auto leading-relaxed">
              Predict wait times, find the best moments, and make every minute magical.
            </p>

            {/* Premium Features Teaser */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full px-4 py-2">
                <Bell className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-medium text-amber-200">Real-time alerts</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 rounded-full px-4 py-2">
                <Heart className="w-4 h-4 text-rose-300" />
                <span className="text-sm font-medium text-rose-200">Save favorites</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full px-4 py-2">
                <TrendingUp className="w-4 h-4 text-cyan-300" />
                <span className="text-sm font-medium text-cyan-200">Advanced forecasts</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-sm font-medium text-purple-200">No ads</span>
              </div>
              {!isPremium && (
                <Link to={createPageUrl("Premium")} className="text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors underline">
                  ✨ Unlock Premium
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/70 font-medium whitespace-nowrap">Park Avg Wait</p>
                <p className="text-white font-bold">{overallAverageWait} min</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="text-xs text-white/70 font-medium">Parks Tracked</p>
                <p className="text-white font-bold">{parks.length}</p>
              </div>
            </div>
            {weather && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                  {weather.icon && (
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                      alt={weather.condition}
                      className="w-10 h-10"
                    />
                  )}
                </div>
                <div>
                  <p className="text-white font-bold text-xl">{weather.temp}°F</p>
                  <p className="text-xs text-violet-300/60 font-medium">{weather.condition}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-fuchsia-300" />
              </div>
              <div>
                <p className="text-xs text-white/70 font-medium">Forecast</p>
                <p className="text-white font-bold">Hourly</p>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-md mx-auto mt-8 relative z-40"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 z-10" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rides across all parks..."
              className="bg-white/10 border-white/10 text-white placeholder:text-white/40 rounded-full pl-11 h-12 backdrop-blur-sm focus-visible:ring-white/30 w-full"
            />

            {/* Rides Dropdown - Positioned below search */}
            {searchQuery && (
              <div className="fixed left-1/2 -translate-x-1/2 w-80 max-w-[90vw] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50"
                style={{
                  top: 'calc(env(safe-area-inset-top) + 392px)'
                }}
              >
                {(() => {
                  const filtered = rides.filter(r => r.name?.toLowerCase().startsWith(searchQuery.toLowerCase()) && r.type !== "show" && !r.is_hidden);
                  return filtered.length > 0 ? (
                    filtered.slice(0, 5).map(ride => (
                      <button
                        key={ride.id}
                        onClick={() => {
                          window.location.href = createPageUrl(`RideDetail`) + `?rideid=${ride.id}`;
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-slate-900 dark:text-white">{ride.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{ride.park_name}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                      <p className="text-sm">No rides found</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white dark:bg-slate-950 w-full">
      {/* System Messages */}
      {systemMessages.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <SystemMessageBanner messages={systemMessages} />
        </div>
      )}

      {/* Trip Countdown */}
      {user && (
        <div className="max-w-6xl mx-auto px-6 pt-8 bg-white dark:bg-slate-950">
          <TripCountdown checkInDate={user.trip_check_in_date} resort={user.preferences?.resort} />
        </div>
      )}

      {/* Ad Banner */}
      {!searchQuery && (
        <div className="max-w-4xl mx-auto px-6 py-8 bg-white dark:bg-slate-950">
          <AdBanner slot="1234567890" format="auto" />
        </div>
      )}

      {/* Parks Grid */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 pb-12 relative z-10 bg-white dark:bg-slate-950">
       <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">Walt Disney World Parks</h2>
       {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3].map((i) => (
             <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl h-80 border border-slate-100 dark:border-slate-700" />
           ))}
         </div>
       ) : filteredParks.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParks.map((park, i) => (
            <ParkCard 
              key={park.id} 
              park={park} 
              index={i} 
              averageWait={parkAverageWaits[park.id] || 0}
              isClosed={!isParkOpen(park.id)}
              hoursDisplay={getParkHoursDisplay(park.id)}
            />
          ))}
         </div>
       ) : (
         <div className="text-center py-20">
           <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
             <Search className="w-7 h-7 text-violet-400" />
           </div>
           <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No parks found</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try a different search term</p>
         </div>
       )}
       </div>

       {/* Disney Parks News Scroller */}
       <div className="max-w-6xl mx-auto px-6 pb-12 bg-white dark:bg-slate-950">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Disney Parks News</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Latest updates from official and fan sources</p>
        </div>

        {newsData?.success && newsData?.articles?.length > 0 ? (
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  if (newsScrollRef.current) {
                    newsScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                  }
                }}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <button
                onClick={() => {
                  if (newsScrollRef.current) {
                    newsScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                  }
                }}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <div className="relative overflow-hidden">
              <div className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide" ref={newsScrollRef}>
                {newsData.articles.map((article, i) => (
                  <a
                    key={i}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-80 bg-white rounded-xl p-4 border border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
                        <Newspaper className="w-4 h-4 text-violet-600" />
                      </div>
                      <Badge variant="outline" className={`${article.source === "Disney Parks Blog" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-purple-100 text-purple-700 border-purple-200"} text-xs`}>
                        {article.source}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-violet-600" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-4 bg-amber-50 rounded-2xl p-3 border border-amber-200">
              <p className="text-xs text-amber-800 text-center">
                <span className="font-semibold">News Disclaimer:</span> News from official and fan sources — always verify with Disney for the most accurate information.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-slate-600 dark:text-slate-400">Unable to load news at this time. Please check back later.</p>
          </div>
        )}
        </div>

        {/* Powered By & Disclaimer */}
        <div className="max-w-4xl mx-auto px-6 pb-12 space-y-4 bg-white dark:bg-slate-950">
       <div className="text-center">
         <p className="text-sm text-slate-500 dark:text-slate-400">
           Powered by <a href="https://queue-times.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 underline">Queue-Times.com</a>
         </p>
       </div>
       <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
         <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-center">
           <span className="font-semibold text-slate-700 dark:text-slate-300">Disclaimer:</span> This is an unofficial, fan-made application/website providing wait time information and forecasting for Disney parks. It is not affiliated with, endorsed by, sponsored by, or in any way officially connected to The Walt Disney Company, Walt Disney World, Disneyland, or any of their subsidiaries, affiliates, or partners. All trademarks, logos, names, and park-related intellectual property referenced or displayed (if any) are the property of their respective owners. This app is for informational and entertainment purposes only and is not intended to replace official Disney sources or services.
         </p>
       </div>
       </div>
      </div>
     </div>
    </PullToRefresh>
    );
  }