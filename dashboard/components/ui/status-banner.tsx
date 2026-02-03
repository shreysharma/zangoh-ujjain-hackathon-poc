"use client";

import { motion } from "framer-motion";

interface StatusBannerProps {
  text: string;
  variant?: "info" | "success" | "processing";
}

export function StatusBanner({
  text,
  variant = "processing",
}: StatusBannerProps) {
  const bgColors = {
    info: "bg-[#3A3A3A]",
    success: "bg-green-500/10",
    processing: "bg-[#3A3A3A]",
  };

  const textColors = {
    info: "text-white/80",
    success: "text-green-400",
    processing: "text-[#D9D9D9]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${bgColors[variant]} rounded-lg px-4 py-3 border border-white/10`}
    >
      <p
        className={`font-switzer text-[16px] ${textColors[variant]} leading-relaxed`}
      >
        {text}
      </p>
    </motion.div>
  );
}
