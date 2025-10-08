"use client";

import { motion } from "framer-motion";
import { FileText, Maximize2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";

interface CaseDetails {
  caseId: string;
  title: string;
  reporter: string;
  person: {
    name: string;
    age: string;
    height: string;
  };
  identificationMark: string;
  clothing: string;
  lastSeen: string;
  foundAt: string;
  investigationSummary: string[];
  currentStatus: string;
  outcome: string;
  verifiedBy: string;
  closureNotes: string;
  timestamp?: string;
}

interface CaseDetailsCardProps {
  details: CaseDetails;
  onExpand?: () => void;
}

export function CaseDetailsCard({ details, onExpand }: CaseDetailsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-[#3A3A3A] border-white/10 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <FileText className="w-4 h-4 md:w-5 md:h-5 text-white flex-shrink-0" />
            <div>
              <h3 className="font-switzer text-base md:text-lg font-medium text-white">
                {details.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {details.timestamp && (
              <div className="flex items-center gap-1.5">
                <p className="font-switzer text-xs md:text-[13px] text-white/40">
                  {details.timestamp}
                </p>
                <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5 text-white/40" />
              </div>
            )}
            {onExpand && (
              <button
                onClick={onExpand}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Expand details"
              >
                <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-4">
          {/* Reporter */}
          <DetailRow label="Reporter:" value={details.reporter} />

          {/* Person */}
          <DetailRow
            label="Person:"
            value={`${details.person.name} · ${details.person.age} · Height: ${details.person.height}`}
          />

          {/* Identification Mark */}
          <DetailRow
            label="Identification Mark:"
            value={details.identificationMark}
          />

          {/* Clothing */}
          <DetailRow label="Clothing:" value={details.clothing} />

          {/* Last seen */}
          <DetailRow label="Last seen:" value={details.lastSeen} />

          {/* Found At */}
          <DetailRow label="Found At:" value={details.foundAt} />

          {/* Investigation Summary */}
          <div className="pt-3 md:pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              <h4 className="font-switzer text-sm md:text-[15px] font-medium text-white">
                Investigation Summary
              </h4>
            </div>
            <ul className="space-y-1.5 md:space-y-2">
              {details.investigationSummary.map((item, index) => (
                <li
                  key={index}
                  className="font-switzer text-xs md:text-sm text-white/70 flex items-start gap-2"
                >
                  <span className="text-white/40 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Status Row */}
          <div className="pt-3 md:pt-4 border-t border-white/10 space-y-2 md:space-y-3">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <span className="font-switzer text-xs md:text-sm text-white/60 min-w-[100px] md:min-w-[120px]">
                Current Status:
              </span>
              <StatusChip
                text={details.currentStatus}
                variant="success"
                size="sm"
                showDot={true}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="font-switzer text-xs md:text-sm text-white/60 sm:min-w-[120px] md:min-w-[140px] flex-shrink-0">
                Outcome:
              </span>
              <StatusChip
                text={details.outcome}
                variant="info"
                size="sm"
                showDot={false}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="font-switzer text-xs md:text-sm text-white/60 sm:min-w-[120px] md:min-w-[140px] flex-shrink-0">
                Verified By:
              </span>
              <StatusChip
                text={details.verifiedBy}
                variant="info"
                size="sm"
                showDot={false}
              />
            </div>

            <div className="pt-2">
              <span className="font-switzer text-xs md:text-sm text-white/60 block mb-2">
                Closure Notes:
              </span>
              <p className="font-switzer text-xs md:text-sm text-white/70 leading-relaxed">
                {details.closureNotes}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
      <span className="font-switzer text-xs md:text-sm text-white/60 sm:min-w-[120px] md:min-w-[140px] flex-shrink-0">
        {label}
      </span>
      <span
        className={`font-switzer text-xs md:text-sm ${
          highlight ? "text-blue-400" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
