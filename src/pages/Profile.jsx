import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Bell, AlertCircle, Clock, ArrowRight, Pencil, Check, X, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    await updateNameMutation.mutateAsync(newName.trim());
  };

  const handleSavePhone = async () => {
    if (newPhone && !/^\+[1-9]\d{1,14}$/.test(newPhone)) {
      toast.error("Invalid phone format. Use E.164 format (e.g., +12025551234)");
      return;
    }
    await updatePhoneMutation.mutateAsync(newPhone.trim() || null);
  };

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs[0];
    },
    enabled: !!user?.email,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const favs = await base44.entities.Favorite.filter({ user_email: user.email, item_type: "ride" });
      return favs;
    },
    enabled: !!user?.email,
  });

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";
  const queryClient = useQueryClient();

  const updateNameMutation = useMutation({
    mutationFn: async (fullName) => {
      await base44.functions.invoke('updateUserName', { full_name: fullName });
    },
    onMutate: async (fullName) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });
      const previous = queryClient.getQueryData(["user"]);
      queryClient.setQueryData(["user"], { ...user, full_name: fullName });
      return { previous };
    },
    onError: (err, fullName, context) => {
      queryClient.setQueryData(["user"], context.previous);
      toast.error("Failed to update name");
    },
    onSuccess: () => {
      setEditingName(false);
      toast.success("Name updated successfully");
    },
  });

  const updatePhoneMutation = useMutation({
    mutationFn: async (phone) => {
      await base44.functions.invoke('updateUserPhone', { phone_number: phone || null });
    },
    onMutate: async (phone) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });
      const previous = queryClient.getQueryData(["user"]);
      queryClient.setQueryData(["user"], { ...user, phone_number: phone });
      return { previous };
    },
    onError: (err, phone, context) => {
      queryClient.setQueryData(["user"], context.previous);
      toast.error("Failed to update phone");
    },
    onSuccess: () => {
      setEditingPhone(false);
      toast.success("Phone number updated");
    },
  });

  const handleDeleteAccount = async () => {
    try {
      await base44.auth.deleteAccount();
      toast.success("Account deleted successfully");
      base44.auth.logout();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Button onClick={() => base44.auth.redirectToLogin()}>
          Sign in to view profile
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
         {/* Header */}
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
           <div className="flex items-center justify-between">
             {editingName ? (
               <div className="flex items-center gap-2">
                 <Input
                   value={newName}
                   onChange={(e) => setNewName(e.target.value)}
                   placeholder="Enter your name"
                   className="text-xl font-bold"
                   autoFocus
                 />
                 <Button size="sm" onClick={handleSaveName} disabled={updateNameMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                   <Check className="w-4 h-4" />
                 </Button>
                 <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>
                   <X className="w-4 h-4" />
                 </Button>
               </div>
             ) : (
               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{user.full_name || user.email}</h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewName(user.full_name || "");
                      setEditingName(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="text-sm">
              {user.role === "admin" ? "Admin" : "User"}
            </Badge>
            {isPremium && (
              <Badge className="bg-amber-500 text-white text-sm">
                Premium Member
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Account Info Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm dark:bg-slate-900 mb-8">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Email</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Member Since</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">
                  {new Date(user.created_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {isPremium && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Subscription Status</p>
                      <p className="text-slate-900 font-medium">
                        Active {subscription?.expires_at && ` • Expires ${new Date(subscription.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  )}
                  {isPremium && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-500">Phone Number (for SMS alerts)</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewPhone(user.phone_number || "");
                            setEditingPhone(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </div>
                      {editingPhone ? (
                        <div className="flex gap-2">
                          <Input
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="+12025551234"
                            className="text-sm"
                          />
                          <Button size="sm" onClick={handleSavePhone} disabled={updatePhoneMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                           <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingPhone(false)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-slate-900 dark:text-slate-100 font-medium">
                          {user.phone_number || <span className="text-slate-400 dark:text-slate-500">Not added</span>}
                        </p>
                      )}
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          By entering your phone number and enabling SMS alerts, you consent to receive text messages from Enchanted Queues about your favorited rides (e.g., when waits drop below your threshold or rides go down/up). Message & data rates may apply. Reply STOP to opt out. View our Privacy Policy and Terms of Service.
                        </p>
                      </div>
                    </div>
                  )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Favorite Rides Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-slate-200/60 dark:border-slate-700/60 dark:bg-slate-900 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg dark:text-white">Favorited Rides</CardTitle>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{favorites.length} ride{favorites.length !== 1 ? 's' : ''} saved</p>
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No favorited rides yet</p>
                  <Link to={createPageUrl("Home")}>
                    <Button variant="outline" size="sm">
                      Explore Rides
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav, idx) => (
                    <motion.div
                      key={fav.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{fav.item_name}</h4>

                          <div className="flex flex-wrap gap-3 text-sm">
                            {fav.notify_on_wait_drop && (
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                <Bell className="w-4 h-4 text-violet-500" />
                                <span>Alert when below <strong>{fav.wait_time_threshold} min</strong></span>
                              </div>
                            )}
                            {fav.notify_on_status_change && (
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span>Status change alerts</span>
                              </div>
                            )}
                            {!fav.notify_on_wait_drop && !fav.notify_on_status_change && (
                              <span className="text-slate-400">No alerts configured</span>
                            )}
                          </div>
                        </div>
                        
                        <Link to={`${createPageUrl("RideDetail")}?rideId=${fav.item_id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            View <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Upgrade CTA */}
         {!isPremium && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
             <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl p-6 border border-violet-200/60">
               <h3 className="font-semibold text-violet-900 mb-2">Unlock Premium Features</h3>
               <p className="text-sm text-violet-800/80 mb-4">
                 Upgrade to Premium to save unlimited favorites, set custom wait time alerts, and access historical wait time data.
               </p>
               <Link to={createPageUrl("Premium")}>
                 <Button className="bg-violet-600 hover:bg-violet-700">
                   Upgrade to Premium
                 </Button>
               </Link>
             </div>
           </motion.div>
         )}

        {/* Delete Account */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-8">
          <Card className="border-red-200/60 dark:border-red-900/30 dark:bg-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-red-600 dark:text-red-500">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and all your data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="bg-red-50 rounded-lg p-3 mb-4 border border-red-200">
                    <p className="text-sm text-red-800 font-medium">⚠️ This is permanent</p>
                  </div>
                  <div className="flex gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>
        </div>
        </div>
        );
        }