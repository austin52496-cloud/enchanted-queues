import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Success() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

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

  useEffect(() => {
    // Wait a moment to let the webhook process, then refresh subscription data
    const timer = setTimeout(() => {
      queryClient.invalidateQueries(["subscription"]);
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [queryClient]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-green-200 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
              <p className="text-slate-600">
                {loading ? "Processing your subscription..." : "You're now a premium member"}
              </p>
            </div>

            {!loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-green-50 rounded-lg p-4 text-left space-y-2"
              >
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">✓</span> Subscription activated
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">✓</span> Unlimited favorites unlocked
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">✓</span> Real-time alerts enabled
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">✓</span> Historical data access granted
                </p>
              </motion.div>
            )}

            {loading && (
              <div className="flex justify-center">
                <div className="animate-spin w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full" />
              </div>
            )}

            <Link to={createPageUrl("Home")}>
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-11">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>

            <p className="text-xs text-slate-500">
              Session ID: {sessionId?.substring(0, 20)}...
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}