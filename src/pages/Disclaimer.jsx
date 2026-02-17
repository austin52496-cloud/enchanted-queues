import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Disclaimer() {
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
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Disclaimer</h1>
          </div>

          <p className="text-sm text-slate-500 mb-8">Last Updated: February 8, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Unofficial Fan Application</h2>
              <p className="text-slate-600 leading-relaxed">
                Enchanted Queues is an <strong>unofficial</strong> fan-created application and is <strong>not affiliated with, endorsed by, or connected to The Walt Disney Company, Disney Parks, or any of their subsidiaries or affiliates</strong>.
              </p>
              <p className="text-slate-600 leading-relaxed mt-3">
                All Disney park names, ride names, and related trademarks are the property of The Walt Disney Company. We use these names solely for the purpose of providing wait time information and park planning assistance to fans and visitors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Information Accuracy</h2>
              <p className="text-slate-600 leading-relaxed">
                While we strive to provide accurate and up-to-date wait time information, we cannot guarantee the accuracy, completeness, or timeliness of the data displayed. Wait times and park information are:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Sourced from third-party APIs and publicly available data</li>
                <li>Subject to change without notice</li>
                <li>Provided for informational purposes only</li>
                <li>Not a substitute for official Disney park information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">No Warranty</h2>
              <p className="text-slate-600 leading-relaxed">
                This service is provided "as is" without any warranties, express or implied. We do not warrant that:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>The service will be uninterrupted or error-free</li>
                <li>The information provided will always be accurate or current</li>
                <li>Any defects will be corrected</li>
                <li>The service is free from viruses or harmful components</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                To the fullest extent permitted by law, Enchanted Queues and its creators shall not be liable for any:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, revenue, data, or use</li>
                <li>Damages resulting from reliance on information provided</li>
                <li>Issues arising from park visit planning based on our data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Third-Party Services</h2>
              <p className="text-slate-600 leading-relaxed">
                Our service integrates with third-party services including:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Stripe for payment processing</li>
                <li>Twilio for SMS notifications</li>
                <li>Queue-Times.com for wait time data</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-3">
                We are not responsible for the content, privacy policies, or practices of these third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Official Information</h2>
              <p className="text-slate-600 leading-relaxed">
                For official park information, hours, tickets, and policies, please visit:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><a href="https://disneyworld.disney.go.com/" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Walt Disney World Official Site</a></li>
                <li><a href="https://disneyland.disney.go.com/" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Disneyland Resort Official Site</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">User Responsibility</h2>
              <p className="text-slate-600 leading-relaxed">
                Users are responsible for:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Verifying information with official Disney sources</li>
                <li>Making their own decisions about park visits and planning</li>
                <li>Following all park rules and regulations</li>
                <li>Ensuring they have proper park admission and reservations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Changes to This Disclaimer</h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to modify this disclaimer at any time. Continued use of the service constitutes acceptance of any changes.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}