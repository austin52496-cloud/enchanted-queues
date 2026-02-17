import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, ArrowLeft, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RideCard from "@/components/RideCard";

export default function MyEnchantedQueues() {
  const [user, setUser] = useState(null);

  const { data: userData } = useQuery({
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
    queryKey: ["subscription", userData?.email],
    queryFn: async () => {
      if (!userData?.email) return null;
      const subs = await base44.entities.Subscription.filter({ user_email: userData.email });
      return subs[0];
    },
    enabled: !!userData?.email,
  });

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["my-favorites", userData?.email],
    queryFn: async () => {
      if (!userData?.email) return [];
      return await base44.entities.Favorite.filter({ user_email: userData.email, item_type: "ride" });
    },
    enabled: !!userData?.email && isPremium,
  });

  const { data: rides = [] } = useQuery({
    queryKey: ["rides"],
    queryFn: () => base44.entities.Ride.list(),
  });

  const { data: allHistory = {} } = useQuery({
    queryKey: ["all-ride-history"],
    queryFn: async () => {
      const history = await base44.entities.WaitTimeHistory.list("-recorded_at", 500);
      const grouped = {};
      history.forEach(h => {
        if (!grouped[h.ride_id]) grouped[h.ride_id] = [];
        grouped[h.ride_id].push(h);
      });
      Object.keys(grouped).forEach(rideId => {
        grouped[rideId] = grouped[rideId].slice(0, 10).reverse();
      });
      return grouped;
    },
  });

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Please sign in to view your favorites</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" size="icon" className="mb-6">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">My Enchanted-Queues</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">Upgrade to Premium to save and track your favorite rides</p>
            <Link to={createPageUrl("Premium")}>
              <Button className="bg-violet-600 hover:bg-violet-700">Upgrade to Premium</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const favoriteRides = favorites
    .map(fav => rides.find(r => r.id === fav.item_id))
    .filter(r => r && (r.current_wait_minutes != null || r.avg_wait_minutes != null));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="relative h-56 md:h-72 overflow-hidden bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600">
        <div className="absolute top-6 left-6">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">My Enchanted-Queues</h1>
          </div>
          <p className="text-white/80 text-sm">{favoriteRides.length} rides saved</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-24 border border-slate-100" />
            ))}
          </div>
        ) : favoriteRides.length > 0 ? (
          <div className="space-y-3">
            {favoriteRides.map((ride, i) => (
              <RideCard 
                key={ride.id} 
                ride={ride} 
                index={i}
                history={allHistory[ride.id] || []}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-rose-400 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No favorite rides yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Start adding rides to track their wait times</p>
            <Link to={createPageUrl("Home")}>
              <Button className="bg-violet-600 hover:bg-violet-700">Explore Parks</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}