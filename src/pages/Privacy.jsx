import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          </div>

          <p className="text-sm text-slate-500 mb-8">Last Updated: February 8, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
              <p className="text-slate-600 leading-relaxed">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Account information (name, email address)</li>
                <li>Phone number (optional, for SMS notifications if you're a Premium subscriber)</li>
                <li>Favorite rides and notification preferences</li>
                <li>Payment information (processed securely through Stripe)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Your Information</h2>
              <p className="text-slate-600 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Send you notifications about your favorite rides (when enabled)</li>
                <li>Process your subscription payments</li>
                <li>Respond to your comments and questions</li>
                <li>Send you technical notices and support messages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. SMS Notifications</h2>
              <p className="text-slate-600 leading-relaxed">
                If you provide your phone number and consent to SMS notifications:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>We will only send ride alerts you've explicitly enabled</li>
                <li>Message and data rates may apply</li>
                <li>You can opt out at any time by updating your notification preferences</li>
                <li>We do not sell or share your phone number with third parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Information Sharing</h2>
              <p className="text-slate-600 leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>With service providers who assist in our operations (e.g., Stripe for payments, Twilio for SMS)</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Security</h2>
              <p className="text-slate-600 leading-relaxed">
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of notifications at any time</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Children's Privacy</h2>
              <p className="text-slate-600 leading-relaxed">
                Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Changes to This Policy</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our About Us page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}