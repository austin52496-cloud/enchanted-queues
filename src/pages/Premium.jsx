import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Check, Zap, Bell, History, Star, ArrowLeft, Moon, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Premium() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
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

  const { data: pricingConfig } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: async () => {
      const configs = await base44.entities.PricingConfig.list();
      return configs.find(c => c.is_active) || configs[0];
    },
  });

  const monthlyPrice = pricingConfig?.monthly_price || 4.99;
  const yearlyPrice = pricingConfig?.yearly_price || 48.00;

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";

  const handleUpgrade = async (billingCycle) => {
    // Check if app is running in an iframe (preview mode)
    if (window.self !== window.top) {
      toast.error("Please publish and open the app in a new tab to complete checkout");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', { 
        appUrl: window.location.origin + window.location.pathname,
        billingCycle: billingCycle 
      });
      
      // Check if user needs to login
      if (response.status === 401 && response.data?.requiresLogin) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error(response.data?.error || "Failed to start checkout session");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        base44.auth.redirectToLogin(window.location.href);
      } else {
        toast.error("Something went wrong. Please try again.");
        console.error("Checkout error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your premium subscription?")) {
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('cancelSubscription');
      queryClient.invalidateQueries(["subscription"]);
      toast.success("Subscription cancelled");
    } catch (error) {
      toast.error("Failed to cancel subscription. Please try again.");
      console.error("Cancel error:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Star, title: "Unlimited Favorites", desc: "Save all your favorite rides and parks" },
    { icon: Bell, title: "Real-time Notifications", desc: "Get alerts when rides go down or come back up" },
    { icon: History, title: "Historical Data", desc: "View wait times from any past date" },
    { icon: Zap, title: "Advanced Forecasting", desc: "See hourly predictions for any future date" },
    { icon: LayoutDashboard, title: "Customized Dashboard", desc: "Dashboard of your favorite rides with live waits" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        {isPremium ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">You're a Premium Member!</h1>
            <p className="text-lg text-slate-600">
              Enjoy unlimited access to all premium features
            </p>
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {features.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{feature.title}</p>
                          <p className="text-xs text-slate-500">{feature.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleCancel()}
                  disabled={loading}
                  className="w-full mt-6 text-red-600 border-red-200 hover:bg-red-50"
                >
                  {loading ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-amber-200 rounded-full px-4 py-1.5 mb-4">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700 tracking-wide">PREMIUM MEMBERSHIP</span>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 mb-4">
                Unlock the Full
                <br />
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Oracle Experience
                </span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Get advanced features and personalization for the ultimate Disney planning experience
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Billing Period Toggle */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium transition-all",
                    billingPeriod === "monthly"
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium transition-all",
                    billingPeriod === "yearly"
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  )}
                >
                  Yearly (Save 20%)
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Monthly Plan */}
                <Card className={cn("border-2 shadow-2xl transition-all", billingPeriod === "monthly" ? "border-amber-200" : "border-slate-200 opacity-60")}>
                  <CardHeader className="text-center bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-t-xl pb-8">
                    <CardTitle className="text-2xl mb-2">Monthly</CardTitle>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold">${monthlyPrice.toFixed(2)}</span>
                      <span className="text-xl text-amber-100">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    {features.map((feature, i) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex items-start gap-4"
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{feature.title}</p>
                            <p className="text-sm text-slate-600 mt-0.5">{feature.desc}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      By subscribing and enabling SMS alerts, you consent to receive text messages from Enchanted Queues about your favorited rides (e.g., when waits drop below your threshold or rides go down/up). Message & data rates may apply. Reply STOP to opt out.
                    </p>
                  </div>

                  <Button
                    onClick={() => handleUpgrade("monthly")}
                    disabled={loading || !user || billingPeriod !== "monthly"}
                    className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                  >
                    {loading ? (
                      "Processing..."
                    ) : !user ? (
                      "Sign In to Upgrade"
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Upgrade to Premium
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500">
                    Cancel anytime. No commitments.
                  </p>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className={cn("border-2 shadow-2xl transition-all", billingPeriod === "yearly" ? "border-amber-200" : "border-slate-200 opacity-60")}>
                <CardHeader className="text-center bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-t-xl pb-8 relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">Save 20%</Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">Yearly</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">${yearlyPrice.toFixed(0)}</span>
                    <span className="text-xl text-amber-100">/year</span>
                  </div>
                  <p className="text-sm text-amber-100 mt-2">Just ${(yearlyPrice / 12).toFixed(2)}/month</p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    {features.map((feature, i) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex items-start gap-4"
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{feature.title}</p>
                            <p className="text-sm text-slate-600 mt-0.5">{feature.desc}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      By subscribing and enabling SMS alerts, you consent to receive text messages from Enchanted Queues about your favorited rides (e.g., when waits drop below your threshold or rides go down/up). Message & data rates may apply. Reply STOP to opt out.
                    </p>
                  </div>

                  <Button
                    onClick={() => handleUpgrade("yearly")}
                    disabled={loading || !user || billingPeriod !== "yearly"}
                    className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                  >
                    {loading ? (
                      "Processing..."
                    ) : !user ? (
                      "Sign In to Upgrade"
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Get Yearly Plan
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500">
                    Cancel anytime. No commitments.
                  </p>
                </CardContent>
                </Card>
                </div>
                </motion.div>
                </>
                )}
      </div>
    </div>
  );
}