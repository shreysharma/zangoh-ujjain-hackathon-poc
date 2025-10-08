"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AdminChatMessage } from "@/types/api";
import { CaseDetailsCard } from "./case-details-card";
import { EmailDispatchStatus, EmailStatus } from "./email-dispatch-status";
import { OperationsBriefModal } from "./operations-brief-modal";
import { ProgressSteps } from "./progress-steps";
import { Button } from "@/components/ui/button";

interface MessageRendererProps {
  message: AdminChatMessage;
  onEmailToTeams?: (briefData: any) => void;
}

/**
 * Parses the message content to detect response type and extract data
 */
function parseMessageContent(content: string): {
  type: "text" | "brief" | "email" | "case" | "progress";
  data?: any;
  text?: string;
} {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);

    // Check for operations brief structure
    if (parsed.brief_id || parsed.sections || parsed.title?.includes("Brief")) {
      return { type: "brief", data: parsed };
    }

    // Check for email dispatch structure
    if (parsed.EmailList || parsed.recipients || parsed.dispatch_id) {
      return { type: "email", data: parsed };
    }

    // Check for case details structure
    if (parsed.case_id || parsed.missing_person || parsed.reporter) {
      return { type: "case", data: parsed };
    }

    // Check for progress steps
    if (parsed.steps && Array.isArray(parsed.steps)) {
      return { type: "progress", data: parsed };
    }

    // If JSON but no specific structure, treat as text
    return { type: "text", text: content };
  } catch (e) {
    // Not JSON, check for keywords in text
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes("brief") && lowerContent.includes("operations")) {
      return { type: "text", text: content };
    }

    if (lowerContent.includes("email") && lowerContent.includes("sent")) {
      return { type: "text", text: content };
    }

    return { type: "text", text: content };
  }
}

/**
 * Transforms API response to component format
 */
function transformBriefData(data: any) {
  return {
    title: data.title || "Operations Brief",
    date: data.date || new Date().toISOString().split("T")[0],
    time: data.time || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    from: data.metadata?.from || data.from || "Command Center",
    to: Array.isArray(data.metadata?.to) ? data.metadata.to.join(", ") : data.to || "All Zones",
    weather: data.metadata?.weather?.condition || data.weather || "Clear",
    sections: {
      crowdOutlook: data.sections?.crowd_outlook?.items || data.sections?.crowdOutlook,
      logisticsControl: data.sections?.logistics_control?.items || data.sections?.logisticsControl,
      lostFound: data.sections?.lost_found?.items || data.sections?.lostFound,
      safetyReadiness: data.sections?.safety_readiness?.items || data.sections?.safetyReadiness,
      teamTasks: data.sections?.team_tasks?.items || data.sections?.teamTasks,
    },
  };
}

function transformEmailData(data: any) {
  const recipients = data.EmailList || data.recipients || [];

  return recipients.map((r: any) => {
    // Determine status based on success field or status field
    let status: EmailStatus = "sending";
    if (r.success === true || r.status === "sent") {
      status = "sent";
    } else if (r.success === false || r.status === "failed") {
      status = "failed";
    }

    return {
      team: r.zone || r.team_name || r.team || "Unknown Team",
      email: r.email || r.email_address || "",
      status,
    };
  });
}

function transformCaseData(data: any) {
  // Handle new simplified API format
  // New format: { id, reporter, person, mark, clothing, lastSeen, foundAt, summary, status, outcome, verifiedBy }

  // Check if it's the new format (has 'id' and 'mark' fields)
  const isNewFormat = data.id && data.mark !== undefined;

  if (isNewFormat) {
    return {
      caseId: data.id || "",
      title: "Lost & Found Case Summary",
      reporter: data.reporter || "Unknown",
      person: {
        name: data.person || "Unknown",
        age: "",
        height: "",
      },
      identificationMark: data.mark || "None",
      clothing: data.clothing || "Not specified",
      lastSeen: data.lastSeen || "Unknown",
      foundAt: data.foundAt || "Not found yet",
      investigationSummary: data.summary ? [data.summary] : [],
      currentStatus: data.status || "Active",
      outcome: data.outcome || "Pending",
      verifiedBy: data.verifiedBy || "Pending",
      closureNotes: "",
      timestamp: data.timestamp,
    };
  }

  // Handle old format (backward compatibility)
  const lastSeenText = data.last_seen?.location
    ? `${data.last_seen.location}${data.last_seen.time ? ` at ${data.last_seen.time}` : ''}`
    : data.lastSeen || "Unknown";

  const foundAtText = data.found_at?.location
    ? `${data.found_at.location}${data.found_at.time ? ` at ${data.found_at.time}` : ''}`
    : data.foundAt || "Not found yet";

  return {
    caseId: data.case_id || "",
    title: data.title || "Case Details",
    reporter: data.reporter?.name || data.reporter || "Unknown",
    person: {
      name: data.missing_person?.name || data.person?.name || "Unknown",
      age: data.missing_person?.age
        ? `${data.missing_person.age} ${data.missing_person.age_unit || "years"}`
        : data.person?.age || "Unknown",
      height: data.missing_person?.height_cm
        ? `${data.missing_person.height_cm} cm`
        : data.person?.height || "Unknown",
    },
    identificationMark: data.missing_person?.identification_marks || data.identificationMark || "None",
    clothing: data.clothing_description || data.clothing || "Not specified",
    lastSeen: lastSeenText,
    foundAt: foundAtText,
    investigationSummary: Array.isArray(data.investigation?.steps)
      ? data.investigation.steps
      : Array.isArray(data.investigationSummary)
      ? data.investigationSummary
      : [],
    currentStatus: (data.status || data.currentStatus || "Active").charAt(0).toUpperCase() + (data.status || data.currentStatus || "Active").slice(1),
    outcome: data.outcome || "Pending",
    verifiedBy: data.investigation?.verified_by || data.verifiedBy || "Pending",
    closureNotes: data.closure_notes || data.closureNotes || "Case ongoing",
    timestamp: data.updated_at || data.timestamp,
  };
}

/**
 * Check if case data has meaningful information (not all unknown/default values)
 */
function hasMeaningfulCaseData(caseData: any): boolean {
  const isValidValue = (value: string | undefined | null): boolean => {
    if (!value) return false;
    const normalized = value.toLowerCase().trim();
    return (
      normalized !== "" &&
      normalized !== "unknown" &&
      normalized !== "n/a" &&
      normalized !== "null" &&
      normalized !== "undefined" &&
      normalized !== "none" &&
      normalized !== "not specified" &&
      normalized !== "not found yet" &&
      normalized !== "pending" &&
      normalized !== "case ongoing"
    );
  };

  // Check if at least some fields have meaningful data
  return (
    isValidValue(caseData.reporter) ||
    isValidValue(caseData.person?.name) ||
    isValidValue(caseData.person?.age) ||
    isValidValue(caseData.person?.height) ||
    isValidValue(caseData.identificationMark) ||
    isValidValue(caseData.clothing) ||
    isValidValue(caseData.lastSeen) ||
    isValidValue(caseData.foundAt) ||
    (caseData.investigationSummary && caseData.investigationSummary.length > 0)
  );
}

export function MessageRenderer({ message, onEmailToTeams }: MessageRendererProps) {
  const [showBriefModal, setShowBriefModal] = useState(false);
  const { type, data, text } = parseMessageContent(message.content);

  // For assistant messages, check for metadata first
  if (message.role === "assistant" && message.metadata) {
    // Operations Brief - Display inline like Sanrakshak demo
    if (message.metadata.brief) {
      const briefData = transformBriefData(message.metadata.brief);

      // DEBUG: Log to verify data is from backend
      console.log("📋 [MessageRenderer] Brief Data from Backend:", message.metadata.brief);
      console.log("🎨 [MessageRenderer] Transformed Brief Data:", briefData);

      // Determine brief type from title or data
      const briefType = briefData.title?.toLowerCase().includes("evening")
        ? "Evening_Brief"
        : briefData.title?.toLowerCase().includes("morning")
        ? "Morning_Brief"
        : "Operations_Brief";

      // Check if this is a historical message (reconstructed from conversation history)
      const isHistorical = (briefData as any).isHistorical;

      // Clean up content by removing markdown formatting
      let cleanContent = message.content || '';

      // Remove all markdown bold markers (**text**)
      cleanContent = cleanContent.replace(/\*\*([^*]+)\*\*/g, '$1');

      // Remove bullet points (- or *) while keeping the content
      cleanContent = cleanContent.replace(/^[\s]*[-*]\s+/gm, '');

      // Remove "consolidated summary" header patterns
      cleanContent = cleanContent.replace(/(?:Certainly\.|Here is)\s+(?:the\s+)?(?:a\s+)?(?:evening|morning)?\s*operations\s+brief[^\n]+:\s*/gi, '');

      // Clean up extra whitespace and newlines
      cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();

      return (
        <div className="space-y-4 w-full">
          {/* Text response above the card - hide if it's just summary headers or too short */}
          {cleanContent && cleanContent.length > 50 && !cleanContent.match(/^[\s\n:*\-–—]+$/) && (
            <p className="font-switzer text-sm md:text-lg leading-relaxed whitespace-pre-line text-white">
              {cleanContent}
            </p>
          )}

          {/* Brief preview card - exact Sanrakshak demo styling */}
          {!isHistorical && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setShowBriefModal(true)}
                className="bg-[#4A4A4A] rounded-lg p-6 cursor-pointer hover:bg-[#525252] transition-colors border border-white/10 w-full"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-white/60 text-sm">{briefType}</span>
                    </div>
                    <h3 className="text-white text-xl font-medium">
                      {briefData.title}
                    </h3>
                    <div className="space-y-1 text-sm text-white/60">
                      <p>From: {briefData.from}</p>
                      <p>To: {briefData.to}</p>
                      <p>Time: {briefData.time}  |  Weather: {briefData.weather}</p>
                    </div>
                  </div>
                  <button className="text-white/60 hover:text-white ml-4 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
                  {onEmailToTeams && (
                    <Button
                      onClick={() => onEmailToTeams(message.metadata?.brief)}
                      className="bg-transparent border border-primary-orange text-primary-orange hover:bg-primary-orange/10 text-sm"
                    >
                      Email to Teams
                    </Button>
                  )}
                  <Button
                    className="bg-transparent border border-primary-orange text-primary-orange hover:bg-primary-orange/10 text-sm"
                  >
                    Download ↓
                  </Button>
                </div>
              </motion.div>

              <OperationsBriefModal
                isOpen={showBriefModal}
                onClose={() => setShowBriefModal(false)}
                brief={briefData}
                onEmailToTeams={onEmailToTeams ? () => onEmailToTeams(message.metadata?.brief) : undefined}
              />
            </>
          )}

          {/* Historical brief - show simplified card */}
          {isHistorical && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#4A4A4A] rounded-lg p-6 border border-white/10 w-full"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-white/60 text-sm">{briefType}</span>
                    <span className="text-white/40 text-xs ml-2">(Historical)</span>
                  </div>
                  <h3 className="text-white text-xl font-medium">
                    {briefData.title}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {briefData.date} · Full details not available in conversation history
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      );
    }

    // Email Dispatch - Display inline
    if (message.metadata.email_dispatch) {
      const recipients = transformEmailData(message.metadata.email_dispatch);

      // DEBUG: Log to verify data is from backend
      console.log("📧 [MessageRenderer] Email Data from Backend:", message.metadata.email_dispatch);
      console.log("👥 [MessageRenderer] Transformed Recipients:", recipients);

      return (
        <div className="w-full">
          <EmailDispatchStatus
            title="Email to Teams"
            subtitle={message.metadata.email_dispatch.response || "The morning brief has been dispatched to all zone leads and support units. The table below shows live email delivery status — updates will appear as each message is sent or confirmed delivered."}
            recipients={recipients}
          />
        </div>
      );
    }

    // Case Details - Display inline like Sanrakshak demo
    if (message.metadata.case) {
      const caseData = transformCaseData(message.metadata.case);

      // DEBUG: Log to verify data is from backend
      console.log("📁 [MessageRenderer] Case Data from Backend:", message.metadata.case);
      console.log("🎯 [MessageRenderer] Transformed Case Data:", caseData);

      // Clean up markdown formatting from case response
      let cleanCaseContent = message.content || '';

      // Remove all markdown bold markers (**text**)
      cleanCaseContent = cleanCaseContent.replace(/\*\*([^*]+)\*\*/g, '$1');

      // Remove bullet points (- or *) while keeping the content
      cleanCaseContent = cleanCaseContent.replace(/^[\s]*[-*]\s+/gm, '');

      // Remove intro lines
      cleanCaseContent = cleanCaseContent.replace(/^(?:The most recent case filed directly by a pilgrim is [A-Z]+-\d+\.|Certainly\.|The most recent case|Based on|I found case|Here are the details:|I can provide).*$/gim, '');

      // Clean up extra whitespace
      cleanCaseContent = cleanCaseContent.replace(/\n{3,}/g, '\n\n').trim();

      return (
        <div className="space-y-4 w-full">
          {/* Check temporarily disabled - always show card */}
          <div className="w-full">
            <CaseDetailsCard details={caseData} />
          </div>
        </div>
      );
    }
  }

  // Fallback: Parse content directly from message
  if (type === "brief" && data) {
    const briefData = transformBriefData(data);

    // DEBUG: Log fallback parsing
    console.log("📋 [MessageRenderer] Brief from content parsing:", data);
    console.log("🎨 [MessageRenderer] Transformed:", briefData);

    const briefType = briefData.title?.toLowerCase().includes("evening")
      ? "Evening_Brief"
      : briefData.title?.toLowerCase().includes("morning")
      ? "Morning_Brief"
      : "Operations_Brief";

    const isHistorical = (briefData as any).isHistorical;

    // Clean up text by removing markdown formatting
    let cleanText = text || '';

    // Remove all markdown bold markers (**text**)
    cleanText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1');

    // Remove bullet points (- or *) while keeping the content
    cleanText = cleanText.replace(/^[\s]*[-*]\s+/gm, '');

    // Remove "consolidated summary" header patterns
    cleanText = cleanText.replace(/(?:Certainly\.|Here is)\s+(?:the\s+)?(?:a\s+)?(?:evening|morning)?\s*operations\s+brief[^\n]+:\s*/gi, '');

    // Clean up extra whitespace and newlines
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();

    return (
      <div className="space-y-4 w-full">
        {cleanText && cleanText.length > 50 && !cleanText.match(/^[\s\n:*\-–—]+$/) && (
          <p className="font-switzer text-sm md:text-lg leading-relaxed whitespace-pre-line text-white">
            {cleanText}
          </p>
        )}

        {!isHistorical && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowBriefModal(true)}
              className="bg-[#4A4A4A] rounded-lg p-6 cursor-pointer hover:bg-[#525252] transition-colors border border-white/10 w-full"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-white/60 text-sm">{briefType}</span>
                  </div>
                  <h3 className="text-white text-xl font-medium">
                    {briefData.title}
                  </h3>
                  <div className="space-y-1 text-sm text-white/60">
                    <p>From: {briefData.from}</p>
                    <p>To: {briefData.to}</p>
                    <p>Time: {briefData.time}  |  Weather: {briefData.weather}</p>
                  </div>
                </div>
                <button className="text-white/60 hover:text-white ml-4 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
                {onEmailToTeams && (
                  <Button
                    onClick={() => onEmailToTeams(data)}
                    className="bg-transparent border border-primary-orange text-primary-orange hover:bg-primary-orange/10 text-sm"
                  >
                    Email to Teams
                  </Button>
                )}
                <Button
                  className="bg-transparent border border-primary-orange text-primary-orange hover:bg-primary-orange/10 text-sm"
                >
                  Download ↓
                </Button>
              </div>
            </motion.div>

            <OperationsBriefModal
              isOpen={showBriefModal}
              onClose={() => setShowBriefModal(false)}
              brief={briefData}
              onEmailToTeams={onEmailToTeams ? () => onEmailToTeams(data) : undefined}
            />
          </>
        )}

        {/* Historical brief - show simplified card */}
        {isHistorical && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#4A4A4A] rounded-lg p-6 border border-white/10 w-full"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-white/60 text-sm">{briefType}</span>
                  <span className="text-white/40 text-xs ml-2">(Historical)</span>
                </div>
                <h3 className="text-white text-xl font-medium">
                  {briefData.title}
                </h3>
                <p className="text-white/60 text-sm">
                  {briefData.date} · Full details not available in conversation history
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  if (type === "email" && data) {
    const recipients = transformEmailData(data);
    return (
      <div className="w-full">
        <EmailDispatchStatus
          title="Email to Teams"
          subtitle={data.response || "Emails have been dispatched to all teams."}
          recipients={recipients}
        />
      </div>
    );
  }

  if (type === "case" && data) {
    const caseData = transformCaseData(data);
    const isHistorical = (caseData as any).isHistorical;

    return (
      <div className="space-y-4 w-full">
        {/* Check temporarily disabled - always show card if not historical */}
        {!isHistorical && (
          <div className="w-full">
            <CaseDetailsCard details={caseData} />
          </div>
        )}
        {isHistorical && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#3A3A3A] rounded-lg p-6 border border-white/10 w-full"
          >
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-switzer text-[18px] font-medium text-white">
                  {caseData.title}
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  Case ID: {caseData.caseId} · Full details not available in history
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  if (type === "progress" && data) {
    return <ProgressSteps steps={data.steps} currentStep={data.currentStep} />;
  }

  // Default text rendering
  return (
    <div className="space-y-4">
      <p className="font-switzer text-sm md:text-lg leading-relaxed whitespace-pre-line">
        {text || message.content}
      </p>

      {/* Display graph image if present */}
      {message.graph_image && (
        <div className="mt-4">
          <img
            src={`data:image/png;base64,${message.graph_image}`}
            alt="Generated graph"
            className="max-w-full h-auto rounded-lg border border-white/10"
          />
        </div>
      )}
    </div>
  );
}
