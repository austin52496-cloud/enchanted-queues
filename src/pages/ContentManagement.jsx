import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ContentManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedParkId, setSelectedParkId] = useState("");
  const [updates, setUpdates] = useState({});
  const [editingDialog, setEditingDialog] = useState(null); // null, 'park-desc', 'ride-desc-{rideId}'
  const [dialogValue, setDialogValue] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: parks = [] } = useQuery({
    queryKey: ["all-parks"],
    queryFn: () => base44.entities.Park.list(),
  });

  const { data: allRides = [] } = useQuery({
    queryKey: ["all-rides"],
    queryFn: () => base44.entities.Ride.list(),
  });

  const parkRides = selectedParkId 
    ? allRides.filter(r => r.park_id === selectedParkId)
    : [];

  const updateRideMutation = useMutation({
    mutationFn: async ({ rideId, rideData }) => {
      await base44.entities.Ride.update(rideId, rideData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-rides"]);
      setUpdates({});
      toast.success("Ride updated successfully");
    },
    onError: () => {
      toast.error("Failed to update ride");
    },
  });

  const updateParkMutation = useMutation({
    mutationFn: async ({ parkId, parkData }) => {
      await base44.entities.Park.update(parkId, parkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-parks"]);
      setEditingDialog(null);
      setDialogValue("");
      toast.success("Park updated successfully");
    },
    onError: () => {
      toast.error("Failed to update park");
    },
  });

  const updateRideDescriptionMutation = useMutation({
    mutationFn: async ({ rideId, description }) => {
      await base44.entities.Ride.update(rideId, { description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-rides"]);
      setEditingDialog(null);
      setDialogValue("");
      toast.success("Ride description updated");
    },
    onError: () => {
      toast.error("Failed to update ride description");
    },
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600">Please sign in</p>
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
            <p className="text-slate-600">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPark = parks.find(p => p.id === selectedParkId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to={createPageUrl("Admin")}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Edit ride wait times and height requirements</p>
        </div>

        {/* Park Selector and Description Editor */}
        <Card className="mb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Select Park</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedParkId} onValueChange={setSelectedParkId}>
              <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Choose a park..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                {parks.map((park) => (
                  <SelectItem key={park.id} value={park.id} className="text-slate-900 dark:text-slate-100">
                    {park.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPark && (
              <Dialog open={editingDialog === 'park-desc'} onOpenChange={(open) => {
                if (open) {
                  setEditingDialog('park-desc');
                  setDialogValue(selectedPark.description || "");
                } else {
                  setEditingDialog(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    Edit Park Description
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit {selectedPark.name} Description</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Textarea
                      value={dialogValue}
                      onChange={(e) => setDialogValue(e.target.value)}
                      placeholder="Enter park description..."
                      className="min-h-24"
                    />
                    <Button
                      onClick={() => updateParkMutation.mutate({ parkId: selectedPark.id, parkData: { description: dialogValue } })}
                      disabled={updateParkMutation.isPending}
                      className="w-full"
                    >
                      {updateParkMutation.isPending ? "Updating..." : "Save Description"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        {/* Rides Editor */}
        {selectedPark && parkRides.length > 0 && (
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">{selectedPark.name} Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {parkRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{ride.name}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {updates[`${ride.id}_synced`] ?? ride.is_synced ? "Synced" : "Manual"}
                        </span>
                        <Switch
                          checked={updates[`${ride.id}_synced`] ?? ride.is_synced ?? false}
                          onCheckedChange={(checked) => setUpdates({
                            ...updates,
                            [`${ride.id}_synced`]: checked
                          })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Wait (min)</label>
                        <Input
                          type="number"
                          min="0"
                          value={updates[`${ride.id}_wait`] ?? ride.current_wait_minutes ?? ""}
                          onChange={(e) => setUpdates({
                            ...updates,
                            [`${ride.id}_wait`]: e.target.value ? parseInt(e.target.value) : ""
                          })}
                          className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                          placeholder={ride.current_wait_minutes || "0"}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Height Requirement</label>
                        <Input
                          value={updates[`${ride.id}_height`] ?? ride.height_requirement ?? ""}
                          onChange={(e) => setUpdates({
                            ...updates,
                            [`${ride.id}_height`]: e.target.value
                          })}
                          className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                          placeholder={ride.height_requirement || "No restriction"}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const rideData = {};
                          if (updates[`${ride.id}_wait`] !== undefined && updates[`${ride.id}_wait`] !== "") {
                            rideData.current_wait_minutes = updates[`${ride.id}_wait`];
                          }
                          if (updates[`${ride.id}_height`] !== undefined) {
                            rideData.height_requirement = updates[`${ride.id}_height`] || null;
                          }
                          if (updates[`${ride.id}_synced`] !== undefined) {
                            rideData.is_synced = updates[`${ride.id}_synced`];
                          }
                          if (Object.keys(rideData).length > 0) {
                            updateRideMutation.mutate({ rideId: ride.id, rideData });
                          }
                        }}
                        disabled={updateRideMutation.isPending}
                      >
                        {updateRideMutation.isPending ? "Updating..." : "Save Changes"}
                      </Button>

                      <Dialog open={editingDialog === `ride-desc-${ride.id}`} onOpenChange={(open) => {
                        if (open) {
                          setEditingDialog(`ride-desc-${ride.id}`);
                          setDialogValue(ride.description || "");
                        } else {
                          setEditingDialog(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Edit Description
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit {ride.name} Description</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <Textarea
                              value={dialogValue}
                              onChange={(e) => setDialogValue(e.target.value)}
                              placeholder="Enter ride description..."
                              className="min-h-24"
                            />
                            <Button
                              onClick={() => updateRideDescriptionMutation.mutate({ rideId: ride.id, description: dialogValue })}
                              disabled={updateRideDescriptionMutation.isPending}
                              className="w-full"
                            >
                              {updateRideDescriptionMutation.isPending ? "Updating..." : "Save Description"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedParkId && parkRides.length === 0 && (
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6 text-center">
              <p className="text-slate-500 dark:text-slate-400">No rides found for this park</p>
            </CardContent>
          </Card>
        )}

        {!selectedParkId && (
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6 text-center">
              <p className="text-slate-500 dark:text-slate-400">Select a park to manage its rides</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}