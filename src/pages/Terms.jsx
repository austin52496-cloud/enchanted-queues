import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Terms and Conditions</h1>
          </div>

          <p className="text-sm text-slate-500 mb-8">Last Updated: February 8, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing and using Enchanted Queues, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed">
                Enchanted Queues provides wait time information and park planning tools for Disney theme parks. Our service includes:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Real-time wait time information</li>
                <li>Historical wait time data and forecasts</li>
                <li>Favorite ride tracking</li>
                <li>Premium features including SMS notifications (subscription required)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. User Accounts</h2>
              <p className="text-slate-600 leading-relaxed">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Premium Subscription</h2>
              <p className="text-slate-600 leading-relaxed">
                Premium subscriptions include:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Monthly ($4.99/month) or Annual ($48.00/year) billing options</li>
                <li>Access to premium features including SMS notifications</li>
                <li>Automatic renewal unless cancelled</li>
                <li>Cancellation available at any time from your profile</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-3">
                Payments are processed securely through Stripe. Refunds are not provided for partial subscription periods.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. SMS Notifications</h2>
              <p className="text-slate-600 leading-relaxed">
                By providing your phone number and enabling SMS notifications, you:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Consent to receive automated text messages</li>
                <li>Acknowledge that message and data rates may apply</li>
                <li>Can opt out at any time by updating your preferences</li>
                <li>Understand that we use Twilio to send SMS messages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Acceptable Use</h2>
              <p className="text-slate-600 leading-relaxed">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Use automated systems to scrape or download data</li>
                <li>Impersonate any person or entity</li>
                <li>Upload malicious code or viruses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Intellectual Property</h2>
              <p className="text-slate-600 leading-relaxed">
                All content on Enchanted Queues, except for Disney trademarks and copyrighted materials (which belong to The Walt Disney Company), is owned by or licensed to us. You may not reproduce, distribute, or create derivative works without our permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Disclaimer of Warranties</h2>
              <p className="text-slate-600 leading-relaxed">
                The service is provided "as is" without warranties of any kind. We do not guarantee the accuracy of wait times or other information provided.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Termination</h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Governing Law</h2>
              <p className="text-slate-600 leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">13. Contact Information</h2>
              <p className="text-slate-600 leading-relaxed">
                For questions about these Terms and Conditions, please contact us through our About Us page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}