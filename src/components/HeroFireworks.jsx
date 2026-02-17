import React, { useEffect } from "react";
import confetti from "canvas-confetti";

export default function HeroFireworks() {
  useEffect(() => {
    const createFireworks = () => {
      const x = 0.2 + Math.random() * 0.6;
      const y = 0.08 + Math.random() * 0.15;
      
      // Primary burst - blue and gold like Disney fireworks
      confetti({
        particleCount: 25,
        angle: 90,
        spread: 100,
        origin: { x, y },
        colors: ["#1e40af", "#3b82f6", "#fbbf24", "#f59e0b"],
        gravity: 0.9,
        scalar: 0.6,
        ticks: 450,
        velocity: 4 + Math.random() * 2,
        drift: (Math.random() - 0.5) * 0.3,
      });

      // Secondary burst - purple and pink sparkles (delayed)
      setTimeout(() => {
        confetti({
          particleCount: 18,
          angle: 90,
          spread: 80,
          origin: { x: x + 0.05, y: y - 0.02 },
          colors: ["#a855f7", "#ec4899", "#f472b6"],
          gravity: 1.1,
          scalar: 0.5,
          ticks: 380,
          velocity: 3 + Math.random() * 1.5,
          drift: (Math.random() - 0.5) * 0.25,
        });
      }, 80);

      // Tertiary burst - white/gold glow (delayed further)
      setTimeout(() => {
        confetti({
          particleCount: 12,
          angle: 90,
          spread: 60,
          origin: { x: x - 0.03, y: y - 0.03 },
          colors: ["#fef3c7", "#fde68a", "#fcd34d"],
          gravity: 1.3,
          scalar: 0.4,
          ticks: 350,
          velocity: 2 + Math.random() * 1,
          drift: (Math.random() - 0.5) * 0.2,
        });
      }, 150);
    };

    // Create fireworks every 4-5 seconds for natural rhythm
    const interval = setInterval(createFireworks, 4500 + Math.random() * 1000);
    
    // Start with one immediately
    createFireworks();

    return () => clearInterval(interval);
  }, []);

  return null;
}