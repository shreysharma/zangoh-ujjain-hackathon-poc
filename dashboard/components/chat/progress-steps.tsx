"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ProgressStep {
  text: string;
  completed?: boolean;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  currentStep?: number;
}

export function ProgressSteps({ steps, currentStep = 0 }: ProgressStepsProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = step.completed || index < currentStep;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-2 md:gap-3"
          >
            {/* Icon/Indicator */}
            <div className="flex-shrink-0 mt-0.5">
              {isActive && !isCompleted ? (
                <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white animate-spin" />
              ) : (
                <div
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 ${
                    isCompleted
                      ? "bg-green-500 border-green-500"
                      : "border-white/30"
                  }`}
                />
              )}
            </div>

            {/* Text */}
            <p
              className={`font-switzer text-sm md:text-base leading-relaxed ${
                isActive
                  ? "text-white"
                  : isCompleted
                  ? "text-white/60"
                  : "text-white/40"
              }`}
            >
              {step.text}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
