"use client";

import { motion } from "framer-motion";
import { FileText, Maximize2, RefreshCw } from "lucide-react";
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
      <div className="w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white flex-shrink-0" />
            <h3 className="font-switzer text-base font-medium text-white">
              {details.title}{details.caseId && ` — ${details.caseId}`}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {details.timestamp && (
              <div className="flex items-center gap-1.5">
                <p className="font-switzer text-base text-white/40">
                  {details.timestamp}
                </p>
                <RefreshCw className="w-4 h-4 text-white/40" />
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3">
          {/* Reporter */}
          <DetailRow label="Reporter:" value={details.reporter} />

          {/* Person */}
          <DetailRow
            label="Person:"
            value={
              details.person.age || details.person.height
                ? `${details.person.name} · ${details.person.age} · Height: ${details.person.height}`
                : details.person.name
            }
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
          {details.investigationSummary && details.investigationSummary.length > 0 && (
            <div className="pt-3 border-t border-white/10 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-white" />
                <h4 className="font-switzer text-base font-medium text-white">
                  Investigation Summary
                </h4>
              </div>
              <ul className="space-y-1.5">
                {details.investigationSummary.map((item, index) => (
                  <li
                    key={index}
                    className="font-switzer text-base text-white/70 flex items-start gap-2"
                  >
                    <span className="text-white/40">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Row */}
          <div className="pt-3 border-t border-white/10 mt-3 space-y-3">
            <div className="flex items-start gap-3">
              <span className="font-switzer text-base text-white/60 min-w-[140px] flex-shrink-0">
                Current Status:
              </span>
              <StatusChip
                text={details.currentStatus}
                variant="success"
                size="sm"
                showDot={true}
              />
            </div>

            <div className="flex items-start gap-3">
              <span className="font-switzer text-base text-white/60 min-w-[140px] flex-shrink-0">
                Outcome:
              </span>
              <StatusChip
                text={details.outcome}
                variant="info"
                size="sm"
                showDot={false}
              />
            </div>

            <div className="flex items-start gap-3">
              <span className="font-switzer text-base text-white/60 min-w-[140px] flex-shrink-0">
                Verified By:
              </span>
              <StatusChip
                text={details.verifiedBy}
                variant="info"
                size="sm"
                showDot={false}
              />
            </div>

            {details.closureNotes && (
              <div className="flex items-start gap-3">
                <span className="font-switzer text-base text-white/60 min-w-[140px] flex-shrink-0">
                  Closure Notes:
                </span>
                <p className="font-switzer text-base text-white/70 leading-relaxed flex-1">
                  {details.closureNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
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
    <div className="flex items-start gap-3">
      <span className="font-switzer text-base text-white/60 min-w-[140px] flex-shrink-0">
        {label}
      </span>
      <span className="font-switzer text-base text-white flex-1">
        {value}
      </span>
    </div>
  );
}
