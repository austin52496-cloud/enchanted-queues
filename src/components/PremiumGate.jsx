import React from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PremiumGate({ feature = "this feature" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Premium Feature</CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Unlock {feature} with a Premium subscription
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {["Save favorite rides & parks", "Get instant status notifications", "View historical wait time data", "Access advanced forecasting"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <Link to={createPageUrl("Premium")}>
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Premium - $4.99/mo
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}