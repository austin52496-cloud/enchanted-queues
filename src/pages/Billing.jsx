import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Download, FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Billing() {
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

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["invoices", user?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('getInvoices');
      return response.data;
    },
    enabled: !!user?.email && subscription?.plan === "premium",
  });

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600">You need to be a premium member to view your billing information.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Billing</h1>
            <p className="text-slate-600">Manage your premium subscription and invoices</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Plan</span>
                <Badge className="bg-amber-100 text-amber-800">Premium - $4.99/month</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Status</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">Active</span>
                </div>
              </div>
              {subscription?.expires_at && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Next billing date</span>
                  <span className="font-medium">{new Date(subscription.expires_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">Loading invoices...</p>
                </div>
              ) : invoiceData?.invoices?.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600">No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceData?.invoices?.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">Invoice #{invoice.number}</p>
                          <p className="text-sm text-slate-600">{invoice.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">${invoice.amount}</p>
                          <Badge variant={invoice.paid ? "default" : "outline"} className={invoice.paid ? "bg-green-100 text-green-800" : ""}>
                            {invoice.paid ? "Paid" : "Pending"}
                          </Badge>
                        </div>
                        {invoice.invoice_pdf && (
                          <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="text-slate-600 hover:text-slate-900">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}