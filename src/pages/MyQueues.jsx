import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { base44 } from "@/api/base44Client";
import { Heart, Clock, TrendingUp, TrendingDown, Crown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MyQueues() {
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

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Favorites query error:', error);
        return [];
      }
      
      // Fetch current ride data for each favorite
      const favoritesWithRideData = await Promise.all(
        data.map(async (fav) => {
          const rides = await base44.entities.Ride.list();
          const ride = rides.find(r => r.id === fav.ride_id);
          return { ...fav, ride };
        })
      );
      
      return favoritesWithRideData.filter(f => f.ride); // Remove any with missing rides
    },
    enabled: !!user?.email,
  });

  const maxFavorites = isPremium ? Infinity : 1;
  const canAddMore = favorites.length < maxFavorites;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <Heart className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign in to view favorites</h2>
          <p className="text-slate-600 dark:text-slate-400">Save your favorite rides and get notified!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-white fill-white" />
            <h1 className="text-4xl font-bold text-white">My Enchanted-Queues</h1>
          </div>
          <p className="text-white/80">
            {favorites.length} ride{favorites.length !== 1 ? 's' : ''} saved
            {!isPremium && ` (${maxFavorites} max for free plan)`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Upgrade Banner for Free Users */}
        {!isPremium && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Upgrade to Premium for Unlimited Favorites
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  Free plan: 1 favorite • Premium: Unlimited favorites + SMS alerts
                </p>
                <Link to={createPageUrl("Subscription")}>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Favorites List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-xl h-32 border border-slate-200 dark:border-slate-700" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No favorites yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Add your favorite rides to track wait times and get notifications
            </p>
            <Link to={createPageUrl("Home")}>
              <Button>Browse Parks</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite, index) => {
              const ride = favorite.ride;
              const currentWait = ride.current_wait_minutes || 0;
              const isOpen = ride.is_open !== false;
              
              return (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={createPageUrl(`RideDetail?rideId=${ride.id}`)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-700 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{ride.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{ride.park_name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{ride.land}</p>
                        </div>
                        <div className="text-right">
                          {isOpen ? (
                            <>
                              <Badge variant="outline" className="border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs mb-1">
                                Open
                              </Badge>
                              <div className="text-2xl font-bold text-slate-900 dark:text-white">{currentWait}</div>
                              <div className="text-xs text-slate-500">min wait</div>
                            </>
                          ) : (
                            <Badge variant="outline" className="border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                              Closed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Wait Time Progress Bar */}
                      {isOpen && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Wait trend</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                currentWait === 0 ? "bg-blue-500" :
                                currentWait < 30 ? "bg-green-500" :
                                currentWait < 60 ? "bg-yellow-500" :
                                currentWait < 90 ? "bg-orange-500" :
                                "bg-red-500"
                              )}
                              style={{ width: `${Math.min((currentWait / 120) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Active Alerts */}
                      {(favorite.notify_on_wait_drop || favorite.notify_on_status_change || favorite.notify_on_ride_reopen) && (
                        <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-2 text-xs text-violet-700 dark:text-violet-300">
                          <strong className="block mb-1">Active Alerts:</strong>
                          {favorite.notify_on_wait_drop && <div>• Wait drops below {favorite.wait_time_threshold} min</div>}
                          {favorite.notify_on_status_change && <div>• Ride closure</div>}
                          {favorite.notify_on_ride_reopen && <div>• Ride reopen</div>}
                          {favorite.notify_methods && <div>• Via: {favorite.notify_methods.join(', ').toUpperCase()}</div>}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
