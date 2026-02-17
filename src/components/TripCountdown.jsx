import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Sparkles } from "lucide-react";

const resortNames = {
  "magic-kingdom": "Magic Kingdom",
  "contemporary": "Contemporary Resort",
  "polynesian": "Polynesian Villas & Resort",
  "grand-floridian": "Grand Floridian Resort",
  "wilderness-lodge": "Wilderness Lodge",
  "fort-wilderness": "Fort Wilderness",
  "yacht-beach": "Yacht Club Resort",
  "beach-club": "Beach Club Resort",
  "boardwalk-villas": "BoardWalk Inn",
  "caribbean-beach": "Caribbean Beach Resort",
  "hollywood-hotel": "Hollywood Hotel",
  "pop-century": "Pop Century Resort",
  "art-animation": "Art of Animation Resort",
  "animal-kingdom-lodge": "Animal Kingdom Lodge",
  "off-site": "Off-Site Hotel",
};

export default function TripCountdown({ checkInDate, resort }) {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [displayDays, setDisplayDays] = useState(0);

  useEffect(() => {
    if (!checkInDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tripDate = new Date(checkInDate);
    tripDate.setHours(0, 0, 0, 0);
    
    const diff = Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24));
    setDaysRemaining(Math.max(diff, 0));
    
    // Animate from a higher number down to the real number
    let current = diff + 3;
    setDisplayDays(current);
    
    const animationInterval = setInterval(() => {
      current--;
      setDisplayDays(current);
      if (current <= diff) {
        clearInterval(animationInterval);
        setDisplayDays(diff);
      }
    }, 150);

    return () => clearInterval(animationInterval);
  }, [checkInDate]);

  if (!checkInDate) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-8 overflow-hidden mb-8 shadow-lg"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-white font-semibold tracking-wide">MY DISNEY TRIP</h2>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="flex items-baseline gap-4">
            <motion.div
              key={displayDays}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ perspective: "1000px" }}
              className="text-6xl md:text-7xl font-bold text-white drop-shadow-lg"
            >
              {displayDays}
            </motion.div>
            <div>
              <p className="text-white/90 text-lg font-medium">
                {displayDays === 1 ? "Day" : "Days"}
              </p>
              <p className="text-white/70 text-sm">until check-in</p>
            </div>
          </div>

          {resort && (
            <div className="flex-1 flex flex-col items-end justify-center">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg leading-tight text-right"
              >
                {resortNames[resort] || resort}
              </motion.div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 text-white/80 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </motion.div>
  );
}