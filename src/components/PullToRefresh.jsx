import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const scrollableRef = useRef(null);

  useEffect(() => {
    const element = scrollableRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      if (element.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
        setPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling || element.scrollTop !== 0) {
        setPulling(false);
        return;
      }

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startYRef.current);
      setPullDistance(distance);

      if (distance > 100) {
        setPulling(true);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 100) {
        await onRefresh();
      }
      setPullDistance(0);
      setPulling(false);
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pulling, pullDistance, onRefresh]);

  return (
    <div ref={scrollableRef} className="relative w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: pullDistance > 50 ? 1 : 0, scale: pullDistance > 50 ? 1 : 0.8 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center justify-center w-10 h-10 rounded-full bg-violet-600 text-white z-10"
      >
        <motion.div animate={{ rotate: pullDistance > 100 ? 360 : 0 }} transition={{ duration: 0.5 }}>
          <RefreshCw className="w-5 h-5" />
        </motion.div>
      </motion.div>

      <motion.div style={{ transform: `translateY(${pullDistance * 0.5}px)` }}>
        {children}
      </motion.div>
    </div>
  );
}