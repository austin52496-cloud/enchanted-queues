import React from "react";
import { motion } from "framer-motion";

export default function SparkleIcon({ className = "w-5 h-5", color = "#7C3AED" }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
      />
    </motion.svg>
  );
}