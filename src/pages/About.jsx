import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Back Button */}
      <div className="sticky top-20 z-40 max-w-4xl mx-auto px-6 pt-8">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl">✨</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            About Enchanted Queues
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your unofficial companion for making the most of every moment at the Disney Parks
          </p>
        </motion.div>

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="bg-white/80 backdrop-blur-sm border border-violet-200/30 rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-lg text-slate-700 leading-relaxed">
              Welcome to Enchanted Queues — your unofficial companion for making the most of every moment at the Disney Parks. We're Disney fans at heart, and we built this app because we wanted better tools for our own trips.
            </p>
          </div>
        </motion.div>

        {/* Who We Are */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Who We Are</h2>
          <div className="bg-white/80 backdrop-blur-sm border border-purple-200/30 rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-lg text-slate-700 leading-relaxed">
              We're a small team of passionate Disney enthusiasts — DVC members and Annual Passholders who visit the parks as often as we can. We've spent countless days walking Main Street, waiting in lines, and dreaming up ways to spend more time enjoying the magic instead of standing in it.
            </p>
          </div>
        </motion.div>

        {/* Why We Built This */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Why We Built This App</h2>
          <div className="bg-white/80 backdrop-blur-sm border border-pink-200/30 rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-lg text-slate-700 leading-relaxed">
              Like many of you, we got tired of constantly refreshing the official app, dealing with inflated posted wait times, and missing out on short windows for our favorite rides. So we created Enchanted Queues: a simple, accurate, fan-first tool that shows real-time wait times, AI-powered forecasts for the rest of the day, and personalized notifications so you never miss a drop or a reopening. It's built for people who love Disney as much as we do.
            </p>
          </div>
        </motion.div>

        {/* Closing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-br from-violet-100/50 via-purple-100/50 to-pink-100/50 border border-violet-200/50 rounded-3xl p-8 md:p-10 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              This is an unofficial, fan-made app — not affiliated with, endorsed by, or sponsored by The Walt Disney Company. We're just fellow fans trying to help each other make every park day a little more enchanted. Thanks for using Enchanted Queues — we hope it adds some extra magic to your next trip!
            </p>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16 pt-8 border-t border-violet-200/30"
        >
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Have Questions or Feedback?</h3>
          <p className="text-slate-600 mb-6">We'd love to hear from you!</p>
          <a href="mailto:support@enchantedqueues.com" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all">
            <Mail className="w-4 h-4" />
            Contact Us
          </a>
        </motion.div>

        {/* Disclaimer Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 pt-8 border-t border-slate-200"
        >
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Enchanted Queues is an unofficial, fan-made application. It is not affiliated with, endorsed by, or sponsored by The Walt Disney Company or any Disney subsidiary. All Disney park-related references are used for informational and entertainment purposes only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}