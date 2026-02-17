import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Shield, Sparkles, Crown, Mail, Calendar, Clock, Eye, EyeOff, ChevronDown, MessageSquare, RefreshCw, Settings, Trash2, Newspaper, Plus, Palette, MapPin, AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Admin() {
  const queryClient = useQueryClient();
  const [expandedParks, setExpandedParks] = useState({});
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [billingEnabled, setBillingEnabled] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [newsFormData, setNewsFormData] = useState({ name: "", rss_url: "", max_articles: 5 });
  const [pricingFormData, setPricingFormData] = useState({ monthlyPrice: 4.99, yearlyPrice: 48.00 });
  const [resortDialogOpen, setResortDialogOpen] = useState(false);
  const [editingResort, setEditingResort] = useState(null);
  const [resortFormData, setResortFormData] = useState({ name: "", value: "", order: 0 });
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [messageFormData, setMessageFormData] = useState({ title: "", message: "", type: "info" });

  const { data: currentUser } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === "admin",
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["all-subscriptions"],
    queryFn: () => base44.entities.Subscription.list(),
    enabled: currentUser?.role === "admin",
  });

  const { data: allRides = [] } = useQuery({
    queryKey: ["all-rides"],
    queryFn: () => base44.entities.Ride.list(),
    enabled: currentUser?.role === "admin",
  });

  const { data: allParks = [] } = useQuery({
    queryKey: ["all-parks"],
    queryFn: () => base44.entities.Park.list(),
    enabled: currentUser?.role === "admin",
  });

  const { data: newsSources = [] } = useQuery({
    queryKey: ["news-sources"],
    queryFn: () => base44.entities.NewsSource.list(),
    enabled: currentUser?.role === "admin",
  });

  const { data: homeTheme } = useQuery({
    queryKey: ["home-theme"],
    queryFn: async () => {
      const themes = await base44.entities.HomeTheme.list();
      return themes.find(t => t.is_active) || themes[0];
    },
    enabled: currentUser?.role === "admin",
  });

  const { data: pricingConfig } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: async () => {
      const configs = await base44.entities.PricingConfig.list();
      return configs.find(c => c.is_active) || configs[0];
    },
    enabled: currentUser?.role === "admin",
  });

  const { data: resorts = [] } = useQuery({
    queryKey: ["resorts"],
    queryFn: () => base44.entities.Resort.list(),
    enabled: currentUser?.role === "admin",
  });

  const { data: systemMessages = [] } = useQuery({
    queryKey: ["systemMessages"],
    queryFn: () => base44.entities.SystemMessage.list(),
    enabled: currentUser?.role === "admin",
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      await base44.functions.invoke("updateUserRole", { userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-users"]);
      toast.success("User role updated");
    },
    onError: () => {
      toast.error("Failed to update user role");
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userEmail, plan, status, hasBilling, expiresAt }) => {
      await base44.functions.invoke('adminUpdateSubscription', { 
        userEmail, 
        plan, 
        status,
        hasBilling,
        expiresAt
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-subscriptions"]);
      setSubscriptionDialogOpen(false);
      setSelectedUser(null);
      setBillingEnabled(false);
      setExpirationDate(null);
      toast.success("Subscription updated");
    },
    onError: (error) => {
      console.error('Subscription update error:', error);
      toast.error("Failed to update subscription");
    },
  });

  const toggleRideHiddenMutation = useMutation({
    mutationFn: async ({ rideId, isHidden }) => {
      await base44.entities.Ride.update(rideId, { is_hidden: isHidden });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-rides"]);
      toast.success("Ride visibility updated");
    },
    onError: () => {
      toast.error("Failed to update ride");
    },
  });

  const toggleRideDowntimeMutation = useMutation({
    mutationFn: async ({ rideId, hideDowntime }) => {
      await base44.entities.Ride.update(rideId, { 
        hide_downtime_metrics: hideDowntime
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-rides"]);
      toast.success("Downtime visibility toggled");
    },
    onError: () => {
      toast.error("Failed to update downtime visibility");
    },
  });

  const toggleParkHiddenMutation = useMutation({
    mutationFn: async ({ parkId, isHidden }) => {
      await base44.entities.Park.update(parkId, { is_hidden: isHidden });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-parks"]);
      toast.success("Park visibility updated");
    },
    onError: () => {
      toast.error("Failed to update park");
    },
  });

  const updateSubscriptionDetailsMutation = useMutation({
    mutationFn: async ({ subscriptionId, updates }) => {
      await base44.entities.Subscription.update(subscriptionId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-subscriptions"]);
      toast.success("Subscription updated");
    },
    onError: () => {
      toast.error("Failed to update subscription");
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async (phoneNumber) => {
      await base44.functions.invoke("sendSmsNotification", {
        phone_number: phoneNumber,
        message: "🎢 Enchanted Queues Test: This is a test notification. If you received this, SMS alerts are working!",
      });
    },
    onSuccess: () => {
      toast.success("Test SMS sent!");
    },
    onError: (error) => {
      console.error("SMS error:", error);
      toast.error("Failed to send test SMS. Check phone number format.");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, confirmationCode }) => {
      await base44.functions.invoke("deleteUser", { userId, confirmationCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-users"]);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      setDeleteConfirmation("");
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      console.error("Delete user error:", error);
      toast.error("Failed to delete user");
    },
  });

  const saveNewsSourceMutation = useMutation({
    mutationFn: async (sourceData) => {
      if (editingSource) {
        await base44.entities.NewsSource.update(editingSource.id, sourceData);
      } else {
        await base44.entities.NewsSource.create(sourceData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["news-sources"]);
      setNewsDialogOpen(false);
      setEditingSource(null);
      setNewsFormData({ name: "", rss_url: "", max_articles: 5 });
      toast.success(editingSource ? "News source updated" : "News source added");
    },
    onError: () => {
      toast.error("Failed to save news source");
    },
  });

  const toggleNewsSourceMutation = useMutation({
    mutationFn: async ({ sourceId, isActive }) => {
      await base44.entities.NewsSource.update(sourceId, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["news-sources"]);
      toast.success("News source updated");
    },
    onError: () => {
      toast.error("Failed to update news source");
    },
  });

  const deleteNewsSourceMutation = useMutation({
    mutationFn: async (sourceId) => {
      await base44.entities.NewsSource.delete(sourceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["news-sources"]);
      toast.success("News source deleted");
    },
    onError: () => {
      toast.error("Failed to delete news source");
    },
  });

  const updateHomeThemeMutation = useMutation({
    mutationFn: async (themeData) => {
      if (homeTheme?.id) {
        await base44.entities.HomeTheme.update(homeTheme.id, themeData);
      } else {
        await base44.entities.HomeTheme.create({ ...themeData, is_active: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["home-theme"]);
      toast.success("Theme updated");
    },
    onError: () => {
      toast.error("Failed to update theme");
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ monthlyPrice, yearlyPrice }) => {
      await base44.functions.invoke('updatePricing', {
        monthlyPrice,
        yearlyPrice,
        productId: 'prod_Tvt1W31gNXn9Ts',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["pricing-config"]);
      toast.success("Pricing updated and synced to Stripe");
    },
    onError: (error) => {
      console.error('Pricing update error:', error);
      toast.error("Failed to update pricing");
    },
  });

  const saveResortMutation = useMutation({
    mutationFn: async (resortData) => {
      if (editingResort) {
        await base44.entities.Resort.update(editingResort.id, resortData);
      } else {
        await base44.entities.Resort.create(resortData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["resorts"]);
      setResortDialogOpen(false);
      setEditingResort(null);
      setResortFormData({ name: "", value: "", order: 0 });
      toast.success(editingResort ? "Resort updated" : "Resort added");
    },
    onError: () => {
      toast.error("Failed to save resort");
    },
  });

  const deleteResortMutation = useMutation({
    mutationFn: async (resortId) => {
      await base44.entities.Resort.delete(resortId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["resorts"]);
      toast.success("Resort deleted");
    },
    onError: () => {
      toast.error("Failed to delete resort");
    },
  });

  const saveMessageMutation = useMutation({
    mutationFn: async (msgData) => {
      if (editingMessage) {
        await base44.entities.SystemMessage.update(editingMessage.id, msgData);
      } else {
        await base44.entities.SystemMessage.create(msgData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["systemMessages"]);
      setMessageDialogOpen(false);
      setEditingMessage(null);
      setMessageFormData({ title: "", message: "", type: "info" });
      toast.success(editingMessage ? "Message updated" : "Message created");
    },
    onError: () => {
      toast.error("Failed to save message");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (msgId) => {
      await base44.entities.SystemMessage.delete(msgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["systemMessages"]);
      toast.success("Message deleted");
    },
    onError: () => {
      toast.error("Failed to delete message");
    },
  });

  const toggleMessageMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.SystemMessage.update(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["systemMessages"]);
    },
    onError: () => {
      toast.error("Failed to update message");
    },
  });





  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600">Please sign in to access admin panel</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You need admin privileges to access this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUserSubscription = (userEmail) => {
    return subscriptions.find((s) => s.user_email === userEmail);
  };

  const toggleParkExpand = (parkName) => {
    setExpandedParks(prev => ({
      ...prev,
      [parkName]: !prev[parkName]
    }));
  };

  // Group rides by park
  const ridesByPark = allRides.reduce((acc, ride) => {
    const parkName = ride.park_name || "Unknown Park";
    if (!acc[parkName]) acc[parkName] = [];
    acc[parkName].push(ride);
    return acc;
  }, {});

  const sortedParks = Object.keys(ridesByPark).sort();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Manage users and permissions</p>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Sparkles className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="w-full text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                onClick={() => {
                  base44.functions.invoke("syncQueueTimes");
                  toast.success("Syncing wait times...");
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Sync Wait Times
              </Button>
              <Button
                variant="outline"
                className="w-full text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                onClick={() => {
                  base44.functions.invoke("fetchDisneyParkHours");
                  toast.success("Updating park hours...");
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Update Park Hours
              </Button>

              <Button
                variant="outline"
                className="w-full text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                onClick={() => {
                  base44.functions.invoke("getWeather");
                  toast.success("Weather data refreshed!");
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Weather
              </Button>
              <Button
                variant="outline"
                className="w-full text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                onClick={() => {
                  base44.functions.invoke("fetchParkNews");
                  queryClient.invalidateQueries(["parkNews"]);
                  toast.success("Syncing news feed...");
                }}
              >
                <Newspaper className="w-4 h-4 mr-2" />
                Sync News Feed
              </Button>
              <Button
                variant="outline"
                className="w-full text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                onClick={() => {
                  // Clear cache and reload
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name));
                    });
                  }
                  window.location.reload(true);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache & Reload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Premium Users</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                    {subscriptions.filter((s) => s.plan === "premium" && s.status === "active").length}
                  </p>
                </div>
                <Sparkles className="w-8 h-8 text-amber-300 dark:text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Admins</p>
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-500">
                    {users.filter((u) => u.role === "admin").length}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-violet-300 dark:text-violet-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Management Link */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Settings className="w-5 h-5" />
              Content Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Manage ride wait times, height requirements, and park images</p>
            <Link to={createPageUrl("ContentManagement")}>
              <Button className="w-full">
                Open Content Manager
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pricing Management */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Sparkles className="w-5 h-5" />
              Subscription Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Monthly Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="4.99"
                    value={pricingFormData.monthlyPrice}
                    onChange={(e) => setPricingFormData({ ...pricingFormData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                  />
                  {pricingConfig && (
                    <p className="text-xs text-slate-500 mt-1">Current: ${pricingConfig.monthly_price}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Yearly Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="48.00"
                    value={pricingFormData.yearlyPrice}
                    onChange={(e) => setPricingFormData({ ...pricingFormData, yearlyPrice: parseFloat(e.target.value) || 0 })}
                  />
                  {pricingConfig && (
                    <p className="text-xs text-slate-500 mt-1">Current: ${pricingConfig.yearly_price}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => updatePricingMutation.mutate(pricingFormData)}
                disabled={updatePricingMutation.isPending || !pricingFormData.monthlyPrice || !pricingFormData.yearlyPrice}
                className="w-full"
              >
                {updatePricingMutation.isPending ? "Updating & Syncing..." : "Update Pricing & Sync to Stripe"}
              </Button>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Note: This will create new Stripe price objects and update the checkout flow. Existing subscriptions will continue at their original price.
              </p>
            </div>
          </CardContent>
        </Card>



        {/* Home Theme Management */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Palette className="w-5 h-5" />
              Home Page Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Gradient From</label>
                <Input
                  type="text"
                  placeholder="e.g., violet-950"
                  value={homeTheme?.hero_gradient_from || ""}
                  onChange={(e) => updateHomeThemeMutation.mutate({
                    ...homeTheme,
                    hero_gradient_from: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Gradient Via</label>
                <Input
                  type="text"
                  placeholder="e.g., violet-900"
                  value={homeTheme?.hero_gradient_via || ""}
                  onChange={(e) => updateHomeThemeMutation.mutate({
                    ...homeTheme,
                    hero_gradient_via: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Gradient To</label>
                <Input
                  type="text"
                  placeholder="e.g., indigo-900"
                  value={homeTheme?.hero_gradient_to || ""}
                  onChange={(e) => updateHomeThemeMutation.mutate({
                    ...homeTheme,
                    hero_gradient_to: e.target.value
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Accent Color</label>
                <Input
                  type="text"
                  placeholder="e.g., violet"
                  value={homeTheme?.accent_color || ""}
                  onChange={(e) => updateHomeThemeMutation.mutate({
                    ...homeTheme,
                    accent_color: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Background Style</label>
                <Select
                  value={homeTheme?.background_style || "animated"}
                  onValueChange={(value) => updateHomeThemeMutation.mutate({
                    ...homeTheme,
                    background_style: value
                  })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="gradient" className="text-slate-900 dark:text-white">Gradient</SelectItem>
                    <SelectItem value="solid" className="text-slate-900 dark:text-white">Solid</SelectItem>
                    <SelectItem value="animated" className="text-slate-900 dark:text-white">Animated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Changes are saved automatically</p>
          </CardContent>
        </Card>

        {/* System Messages */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                System Notifications
              </div>
              <Dialog open={messageDialogOpen} onOpenChange={(open) => {
                setMessageDialogOpen(open);
                if (!open) {
                  setEditingMessage(null);
                  setMessageFormData({ title: "", message: "", type: "info" });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingMessage ? "Edit" : "Add"} System Message</DialogTitle>
                    <DialogDescription>
                      Create notifications to display on the home page
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title</label>
                      <Input
                        placeholder="e.g., Service Maintenance"
                        value={messageFormData.title}
                        onChange={(e) => setMessageFormData({ ...messageFormData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Message</label>
                      <textarea
                        placeholder="Enter your message here..."
                        value={messageFormData.message}
                        onChange={(e) => setMessageFormData({ ...messageFormData, message: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 h-24 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Type</label>
                      <Select value={messageFormData.type} onValueChange={(value) => setMessageFormData({ ...messageFormData, type: value })}>
                        <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => saveMessageMutation.mutate({ title: messageFormData.title, message: messageFormData.message, type: messageFormData.type })}
                      disabled={!messageFormData.title || !messageFormData.message || saveMessageMutation.isPending}
                      className="w-full"
                    >
                      {saveMessageMutation.isPending ? "Saving..." : (editingMessage ? "Update" : "Add") + " Message"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systemMessages.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No messages configured.</p>
            ) : (
              <div className="space-y-2">
                {systemMessages.map((msg) => {
                  const typeIcons = { error: AlertCircle, warning: AlertTriangle, success: CheckCircle, info: Info };
                  const TypeIcon = typeIcons[msg.type];
                  return (
                    <div key={msg.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-3 flex-1">
                        <TypeIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{msg.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{msg.message}</p>
                          <Badge variant="outline" className="mt-2 text-xs capitalize">{msg.type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={msg.is_active}
                          onCheckedChange={(checked) => toggleMessageMutation.mutate({ id: msg.id, is_active: checked })}
                        />
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingMessage(msg);
                          setMessageFormData({ title: msg.title, message: msg.message, type: msg.type });
                          setMessageDialogOpen(true);
                        }}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => deleteMessageMutation.mutate(msg.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resort Management */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Disney Resorts
              </div>
              <Dialog open={resortDialogOpen} onOpenChange={(open) => {
                setResortDialogOpen(open);
                if (!open) {
                  setEditingResort(null);
                  setResortFormData({ name: "", value: "", order: 0 });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Resort
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingResort ? "Edit" : "Add"} Resort</DialogTitle>
                    <DialogDescription>
                      Manage Disney resort options for trip planning
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Resort Name</label>
                      <Input
                        placeholder="e.g., Contemporary Resort"
                        value={resortFormData.name}
                        onChange={(e) => setResortFormData({ ...resortFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Resort Value (ID)</label>
                      <Input
                        placeholder="e.g., contemporary"
                        value={resortFormData.value}
                        onChange={(e) => setResortFormData({ ...resortFormData, value: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Display Order</label>
                      <Input
                        type="number"
                        value={resortFormData.order}
                        onChange={(e) => setResortFormData({ ...resortFormData, order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button
                      onClick={() => saveResortMutation.mutate({ name: resortFormData.name, value: resortFormData.value, order: resortFormData.order })}
                      disabled={!resortFormData.name || !resortFormData.value || saveResortMutation.isPending}
                      className="w-full"
                    >
                      {saveResortMutation.isPending ? "Saving..." : (editingResort ? "Update" : "Add") + " Resort"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resorts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No resorts configured. Add one to populate the resort selector.</p>
            ) : (
              <div className="space-y-2">
                {resorts.sort((a, b) => (a.order || 0) - (b.order || 0)).map((resort) => (
                  <div
                    key={resort.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{resort.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{resort.value}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingResort(resort);
                          setResortFormData({
                            name: resort.name,
                            value: resort.value,
                            order: resort.order || 0
                          });
                          setResortDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => deleteResortMutation.mutate(resort.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

         {/* News Sources Management */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                News Sources
              </div>
              <Dialog open={newsDialogOpen} onOpenChange={(open) => {
                setNewsDialogOpen(open);
                if (!open) {
                  setEditingSource(null);
                  setNewsFormData({ name: "", rss_url: "", max_articles: 5 });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Source
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSource ? "Edit" : "Add"} News Source</DialogTitle>
                    <DialogDescription>
                      Configure RSS feed for Disney Parks news
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Source Name</label>
                      <Input
                        placeholder="e.g., Disney Parks Blog"
                        value={newsFormData.name}
                        onChange={(e) => setNewsFormData({ ...newsFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">RSS Feed URL</label>
                      <Input
                        placeholder="https://..."
                        value={newsFormData.rss_url}
                        onChange={(e) => setNewsFormData({ ...newsFormData, rss_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Articles</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newsFormData.max_articles}
                        onChange={(e) => setNewsFormData({ ...newsFormData, max_articles: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <Button
                      onClick={() => saveNewsSourceMutation.mutate(newsFormData)}
                      disabled={!newsFormData.name || !newsFormData.rss_url || saveNewsSourceMutation.isPending}
                      className="w-full"
                    >
                      {saveNewsSourceMutation.isPending ? "Saving..." : (editingSource ? "Update" : "Add") + " Source"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newsSources.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No news sources configured. Add one to display news on the home page.</p>
            ) : (
              <div className="space-y-2">
                {newsSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{source.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{source.rss_url}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max articles: {source.max_articles || 5}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={source.is_active !== false}
                        onCheckedChange={(checked) =>
                          toggleNewsSourceMutation.mutate({ sourceId: source.id, isActive: checked })
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSource(source);
                          setNewsFormData({
                            name: source.name,
                            rss_url: source.rss_url,
                            max_articles: source.max_articles || 5
                          });
                          setNewsDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => deleteNewsSourceMutation.mutate(source.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parks Management */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Eye className="w-5 h-5" />
              Park Visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allParks.map((park) => (
                <div
                  key={park.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{park.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {park.is_hidden && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">Hidden</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-600"
                      onClick={() => toggleParkHiddenMutation.mutate({ parkId: park.id, isHidden: !park.is_hidden })}
                    >
                      {park.is_hidden ? (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Show
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rides Management */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Eye className="w-5 h-5" />
              Ride Visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedParks.map((parkName) => (
                <div key={parkName}>
                  <button
                    onClick={() => toggleParkExpand(parkName)}
                    className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-750 rounded-lg border border-slate-300 dark:border-slate-700 transition-all"
                  >
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{parkName}</span>
                    <ChevronDown 
                      className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${expandedParks[parkName] ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedParks[parkName] && (
                    <div className="space-y-2 mt-2 ml-2 pl-2 border-l-2 border-slate-300 dark:border-slate-700">
                      {ridesByPark[parkName].map((ride) => (
                        <div
                          key={ride.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{ride.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{ride.land}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {ride.is_hidden && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">Hidden</span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-600"
                              onClick={() => toggleRideHiddenMutation.mutate({ rideId: ride.id, isHidden: !ride.is_hidden })}
                            >
                              {ride.is_hidden ? (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Show
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Hide
                                </>
                              )}
                            </Button>
                            <Button
                              variant={ride.hide_downtime_metrics ? "default" : "outline"}
                              size="sm"
                              className={ride.hide_downtime_metrics ? "bg-orange-600 hover:bg-orange-700" : "text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-600"}
                              onClick={() => toggleRideDowntimeMutation.mutate({ rideId: ride.id, hideDowntime: !ride.hide_downtime_metrics })}
                              disabled={toggleRideDowntimeMutation.isPending}
                              title="Toggle downtime metrics visibility"
                            >
                              {ride.hide_downtime_metrics ? "Downtime Hidden" : "Show Downtime"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => {
                  const subscription = getUserSubscription(user.email);
                  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";

                  return (
                    <div
                      key={user.id}
                      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                    >
                       <div className="flex items-center gap-4 flex-1 min-w-0 lg:flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {user.full_name?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-slate-900 dark:text-slate-100">{user.full_name || "—"}</p>
                              {user.role === "admin" && (
                                <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs">Admin</Badge>
                              )}
                              {isPremium && (
                                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.last_login && (
                              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-1">
                                <Clock className="w-3 h-3" />
                                Last login: {new Date(user.last_login).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full lg:w-auto">
                          {subscription && isPremium && (
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Billing</div>
                                <div className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {subscription.billing_cycle ? subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1) : "—"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Auto-Renew</div>
                                <Switch
                                  checked={subscription.auto_renew !== false}
                                  onCheckedChange={(checked) =>
                                    updateSubscriptionDetailsMutation.mutate({
                                      subscriptionId: subscription.id,
                                      updates: { auto_renew: checked }
                                    })
                                  }
                                />
                              </div>
                              {subscription.expires_at && (
                                <div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Expires</div>
                                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                                    {new Date(subscription.expires_at).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Role</p>
                            <Select
                              value={user.role}
                              onValueChange={(role) =>
                                updateUserRoleMutation.mutate({ userId: user.id, role })
                              }
                            >
                              <SelectTrigger className="w-28 h-9 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                <SelectItem value="user" className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-700">User</SelectItem>
                                <SelectItem value="admin" className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-700">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-3">
                            <Dialog open={deleteDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                              setDeleteDialogOpen(open);
                              if (!open) {
                                setSelectedUser(null);
                                setDeleteConfirmation("");
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedUser(user)}
                                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Delete User</DialogTitle>
                                  <DialogDescription>
                                    This will permanently delete {user.email} and all associated data. This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                                    <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                                      To confirm deletion, enter the user's ID:
                                    </p>
                                    <code className="block mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded text-red-900 dark:text-red-300 font-mono">
                                      {user.id}
                                    </code>
                                  </div>
                                  <Input
                                    placeholder="Enter user ID to confirm"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    className="font-mono text-sm"
                                  />
                                  <Button
                                    onClick={() => {
                                      deleteUserMutation.mutate({
                                        userId: user.id,
                                        confirmationCode: deleteConfirmation
                                      });
                                    }}
                                    disabled={deleteConfirmation !== user.id || deleteUserMutation.isPending}
                                    variant="destructive"
                                    className="w-full"
                                  >
                                    {deleteUserMutation.isPending ? "Deleting..." : "Permanently Delete User"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={subscriptionDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                              setSubscriptionDialogOpen(open);
                              if (!open) {
                                setSelectedUser(null);
                                setBillingEnabled(false);
                                setExpirationDate(null);
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant={isPremium ? "default" : "outline"}
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setBillingEnabled(!!subscription?.stripe_subscription_id);
                                    setExpirationDate(subscription?.expires_at ? new Date(subscription.expires_at) : null);
                                  }}
                                  className="gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  {isPremium ? "Manage" : "Set Premium"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Manage Subscription</DialogTitle>
                                  <DialogDescription>
                                    Set premium access for {user.email}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex items-center justify-between">
                                     <div>
                                       <p className="font-medium">Premium Access</p>
                                       <p className="text-sm text-slate-500">Grant premium features</p>
                                     </div>
                                     <Switch
                                       checked={isPremium}
                                       onCheckedChange={(checked) => {
                                         if (checked) {
                                           updateSubscriptionMutation.mutate({
                                             userEmail: user.email,
                                             plan: "premium",
                                             status: "active",
                                             hasBilling: false,
                                             expiresAt: null
                                           });
                                         } else {
                                           updateSubscriptionMutation.mutate({
                                             userEmail: user.email,
                                             plan: "free",
                                             status: "active",
                                             hasBilling: false,
                                             expiresAt: null
                                           });
                                         }
                                       }}
                                     />
                                   </div>
                                  
                                  {isPremium && (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">With Billing</p>
                                          <p className="text-sm text-slate-500">Connect to Stripe subscription</p>
                                        </div>
                                        <Switch
                                          checked={billingEnabled}
                                          onCheckedChange={(checked) => {
                                            setBillingEnabled(checked);
                                          }}
                                        />
                                      </div>

                                      <div>
                                        <p className="font-medium mb-2">Expiration Date</p>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left">
                                              <Calendar className="mr-2 h-4 w-4" />
                                              {expirationDate ? format(expirationDate, 'MMM d, yyyy') : 'No expiration'}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                              mode="single"
                                              selected={expirationDate}
                                              onSelect={(date) => {
                                                setExpirationDate(date);
                                              }}
                                              disabled={(date) => date < new Date()}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                        {expirationDate && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setExpirationDate(null)}
                                            className="mt-2 w-full"
                                          >
                                            Clear Date
                                          </Button>
                                        )}
                                      </div>

                                      {(billingEnabled || expirationDate) && (
                                        <Button
                                          onClick={() => {
                                            updateSubscriptionMutation.mutate({
                                              userEmail: user.email,
                                              plan: "premium",
                                              status: "active",
                                              hasBilling: billingEnabled,
                                              expiresAt: expirationDate?.toISOString() || null
                                            });
                                            setBillingEnabled(false);
                                          }}
                                          disabled={updateSubscriptionMutation.isPending}
                                          className="w-full"
                                        >
                                          {updateSubscriptionMutation.isPending ? "Updating..." : "Update Billing Details"}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            {isPremium && user.phone_number && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => testSmsMutation.mutate(user.phone_number)}
                                disabled={testSmsMutation.isPending}
                                className="gap-1.5 mt-4 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-600"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Test SMS
                              </Button>
                            )}
                          </div>
                        </div>
                     </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}