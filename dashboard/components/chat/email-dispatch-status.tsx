"use client";

import { motion } from "framer-motion";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";

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
  onViewAll?: () => void;
}

export function EmailDispatchStatus({
  title = "Email to Teams",
  subtitle = "The morning brief has been dispatched to all zone leads and support units.",
  recipients,
  onViewAll,
}: EmailDispatchStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#2A2A2A] rounded-lg md:rounded-xl p-4 md:p-6 border border-white/10"
    >
      {/* Header */}
      <h3 className="font-general-sans text-base md:text-lg font-medium text-white mb-1 md:mb-2">
        {title}
      </h3>
      <p className="font-switzer text-xs md:text-sm text-white/60 mb-4 md:mb-6">{subtitle}</p>

      {/* Table */}
      <div className="space-y-2 md:space-y-3">
        {/* Table Header - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-[1fr,2fr,auto] gap-4 pb-3 border-b border-white/10">
          <span className="font-switzer text-xs text-white/40 uppercase tracking-wide">
            Team/Unit/Zone
          </span>
          <span className="font-switzer text-xs text-white/40 uppercase tracking-wide">
            Email ID
          </span>
          <span className="font-switzer text-xs text-white/40 uppercase tracking-wide">
            Status
          </span>
        </div>

        {/* Table Rows */}
        <div className="space-y-2 md:space-y-3">
          {recipients.map((recipient, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="md:grid md:grid-cols-[1fr,2fr,auto] gap-4 items-center border-b border-white/5 md:border-0 pb-3 md:pb-0"
            >
              {/* Mobile Layout */}
              <div className="flex flex-col gap-1.5 md:hidden">
                <div className="flex items-center justify-between">
                  <span className="font-switzer text-sm text-white font-medium">
                    {recipient.team}
                  </span>
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
                <span className="font-switzer text-xs text-white/60">
                  {recipient.email}
                </span>
              </div>

              {/* Desktop Layout */}
              <span className="hidden md:block font-switzer text-sm text-white">
                {recipient.team}
              </span>
              <span className="hidden md:block font-switzer text-sm text-white/60 truncate">
                {recipient.email}
              </span>
              <div className="hidden md:block">
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

      {/* View All Button */}
      {onViewAll && (
        <div className="mt-4 md:mt-6 flex justify-end">
          <Button
            onClick={onViewAll}
            className="bg-transparent border border-primary-orange text-primary-orange hover:bg-primary-orange/10 text-xs md:text-sm px-3 md:px-4 py-2"
          >
            View All Emails
          </Button>
        </div>
      )}

      {/* Footer Note */}
      <p className="font-switzer text-xs md:text-[13px] text-white/40 mt-4 md:mt-6 text-center">
        You&apos;ll be notified once all teams have received the briefing.
      </p>
    </motion.div>
  );
}
