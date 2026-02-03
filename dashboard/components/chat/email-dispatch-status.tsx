"use client";

import { motion } from "framer-motion";
import { StatusChip } from "@/components/ui/status-chip";

export type EmailStatus = "sending" | "sent" | "failed";

interface EmailRecipient {
  team: string;
  email: string;
  status: EmailStatus;
}

interface EmailDispatchStatusProps {
  title?: string;
  subtitle?: string;
  recipients: EmailRecipient[];
}

export function EmailDispatchStatus({
  subtitle = "The morning brief has been dispatched to all zone leads and support units.",
  recipients,
}: EmailDispatchStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Subtitle text */}
      <p className="font-switzer text-sm text-white mb-4">{subtitle}</p>

      {/* Table */}
      <div className="w-full">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr,2fr,1fr] gap-4 pb-3 border-b border-white/10 mb-3">
          <span className="font-switzer text-xs text-white/60">
            Team/Individual
          </span>
          <span className="font-switzer text-xs text-white/60">
            Email ID
          </span>
          <span className="font-switzer text-xs text-white/60">
            Status
          </span>
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {recipients.map((recipient, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-[2fr,2fr,1fr] gap-4 items-center"
            >
              <span className="font-switzer text-sm text-white">
                {recipient.team}
              </span>
              <span className="font-switzer text-sm text-white truncate">
                {recipient.email}
              </span>
              <div>
                <StatusChip
                  text={
                    recipient.status === "sending"
                      ? "Sending"
                      : recipient.status === "sent"
                      ? "Sent"
                      : "Failed"
                  }
                  variant={
                    recipient.status === "sending"
                      ? "warning"
                      : recipient.status === "sent"
                      ? "success"
                      : "error"
                  }
                  size="sm"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
