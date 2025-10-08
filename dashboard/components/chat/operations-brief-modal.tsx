"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Download, Mail, Calendar, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OperationsBrief {
  title: string;
  date: string;
  time: string;
  from: string;
  to: string;
  weather: string;
  sections: {
    crowdOutlook?: string[];
    logisticsControl?: string[];
    lostFound?: string[];
    safetyReadiness?: string[];
    teamTasks?: string[];
  };
}

interface OperationsBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: OperationsBrief;
  onEmailToTeams?: () => void;
  onDownload?: () => void;
}

export function OperationsBriefModal({
  isOpen,
  onClose,
  brief,
  onEmailToTeams,
  onDownload,
}: OperationsBriefModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4"
          >
            <div className="bg-[#3A3A3A] rounded-lg md:rounded-xl border border-white/10 w-full max-w-3xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between p-4 md:p-6 border-b border-white/10">
                <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-general-sans text-base md:text-xl font-medium text-white">
                      {brief.title}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                      <p className="font-switzer text-xs md:text-[13px] text-white/60">
                        From: {brief.from}
                      </p>
                      <p className="font-switzer text-xs md:text-[13px] text-white/60">
                        To: {brief.to}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                      <p className="font-switzer text-xs md:text-[13px] text-white/60">
                        Time: {brief.time}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Cloud className="w-3 h-3 md:w-3.5 md:h-3.5 text-white/60" />
                        <p className="font-switzer text-xs md:text-[13px] text-white/60">
                          Weather: {brief.weather}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white transition-colors hidden sm:block"
                    aria-label="Maximize"
                  >
                    <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 px-4 md:px-6 pt-3 md:pt-4">
                <Button
                  onClick={onEmailToTeams}
                  className="bg-transparent border border-primary-orange text-primary-orange hover:bg-primary-orange/10 flex items-center justify-center gap-1.5 md:gap-2 text-sm"
                >
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Email to Teams</span>
                </Button>
                <Button
                  onClick={onDownload}
                  className="bg-transparent border border-primary-orange text-primary-orange hover:bg-primary-orange/10 flex items-center justify-center gap-1.5 md:gap-2 text-sm"
                >
                  <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Download</span>
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Crowd Outlook */}
                {brief.sections.crowdOutlook && (
                  <BriefSection
                    title="Crowd Outlook"
                    items={brief.sections.crowdOutlook}
                  />
                )}

                {/* Logistics & Control */}
                {brief.sections.logisticsControl && (
                  <BriefSection
                    title="Logistics & Control"
                    items={brief.sections.logisticsControl}
                  />
                )}

                {/* Lost & Found */}
                {brief.sections.lostFound && (
                  <BriefSection
                    title="Lost & Found"
                    items={brief.sections.lostFound}
                  />
                )}

                {/* Safety & Readiness */}
                {brief.sections.safetyReadiness && (
                  <BriefSection
                    title="Safety & Readiness"
                    items={brief.sections.safetyReadiness}
                  />
                )}

                {/* Team Tasks */}
                {brief.sections.teamTasks && (
                  <BriefSection
                    title="Team Tasks"
                    items={brief.sections.teamTasks}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function BriefSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-switzer text-sm md:text-base font-semibold text-white mb-2 md:mb-3">
        {title}
      </h3>
      <ul className="space-y-1.5 md:space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="font-switzer text-xs md:text-sm text-white/70 flex items-start gap-2"
          >
            <span className="text-white/40 mt-0.5 md:mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
