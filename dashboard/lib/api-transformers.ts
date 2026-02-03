/**
 * API Data Transformers
 *
 * These functions transform backend API responses into the format
 * expected by frontend components.
 */

import type {
  LostFoundCaseApiResponse,
  OperationsBriefApiResponse,
  EmailDispatchApiResponse,
  EmailRecipientApiResponse,
  SendEmailResponse,
  ProcessingStep,
} from "@/types/api";

// ============================================================================
// CASE DETAILS TRANSFORMER
// ============================================================================

export function transformCaseDetails(apiResponse: LostFoundCaseApiResponse) {
  const { missing_person, reporter, last_seen, found_at, investigation } =
    apiResponse;

  return {
    caseId: apiResponse.case_id,
    title: apiResponse.title,
    reporter: reporter.relation
      ? `${reporter.name} (${reporter.relation})`
      : reporter.name,
    person: {
      name: missing_person.name,
      age: `${missing_person.age} y/o ${missing_person.gender === "male" ? "boy" : missing_person.gender === "female" ? "girl" : "child"}`,
      height: `${missing_person.height_cm}cm`,
    },
    identificationMark: missing_person.identification_marks,
    clothing: apiResponse.clothing_description,
    lastSeen: formatLocation(last_seen.location, last_seen.timestamp),
    foundAt: found_at
      ? formatLocation(found_at.location, found_at.timestamp)
      : "—",
    investigationSummary: investigation.steps,
    currentStatus: formatStatus(apiResponse.status),
    outcome: apiResponse.outcome || "—",
    verifiedBy: investigation.verified_by || "—",
    closureNotes: apiResponse.closure_notes || "—",
    timestamp: formatTimestamp(apiResponse.updated_at),
  };
}

// ============================================================================
// OPERATIONS BRIEF TRANSFORMER
// ============================================================================

export function transformOperationsBrief(
  apiResponse: OperationsBriefApiResponse
) {
  const { metadata, sections } = apiResponse;

  return {
    title: apiResponse.title,
    date: formatDate(apiResponse.date),
    time: apiResponse.time,
    from: metadata.from,
    to: metadata.to.join(", "),
    weather: `${metadata.weather.condition} · ${metadata.weather.temperature_c}°C`,
    sections: {
      crowdOutlook: sections.crowd_outlook?.items,
      logisticsControl: sections.logistics_control?.items,
      lostFound: sections.lost_found?.items,
      safetyReadiness: sections.safety_readiness?.items,
      teamTasks: sections.team_tasks?.items,
    },
  };
}

// ============================================================================
// EMAIL DISPATCH TRANSFORMER
// ============================================================================

/**
 * Transform new /sendemail API response
 */
export function transformSendEmailResponse(apiResponse: SendEmailResponse) {
  const successCount = apiResponse.EmailList.filter((r) => r.success).length;
  const totalCount = apiResponse.EmailList.length;

  return {
    title: "Email Dispatch",
    subtitle: apiResponse.response, // e.g., "Sent 2/2 emails successfully"
    successCount,
    totalCount,
    recipients: apiResponse.EmailList.map((recipient) => ({
      team: recipient.zone, // e.g., "Zone 1"
      email: recipient.email,
      status: recipient.success ? ("sent" as const) : ("failed" as const),
      messageId: recipient.message_id,
      messageUuid: recipient.message_uuid,
      error: recipient.error,
    })),
  };
}

/**
 * Transform legacy email dispatch response
 */
export function transformEmailDispatch(apiResponse: EmailDispatchApiResponse) {
  return {
    title: apiResponse.campaign_name,
    subtitle: `Dispatched to ${apiResponse.stats.total} teams`,
    recipients: apiResponse.recipients.map(transformEmailRecipient),
  };
}

export function transformEmailRecipient(
  recipient: EmailRecipientApiResponse
): { team: string; email: string; status: "sending" | "sent" | "failed" } {
  return {
    team: recipient.team_zone
      ? `${recipient.team_name} - ${recipient.team_zone}`
      : recipient.team_name,
    email: recipient.email_address,
    status: recipient.status as "sending" | "sent" | "failed",
  };
}

// ============================================================================
// PROCESSING STEPS TRANSFORMER
// ============================================================================

export function transformProcessingSteps(steps: ProcessingStep[]) {
  return steps.map((step) => ({
    text: step.description,
    completed: step.status === "completed",
  }));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatLocation(location: string, timestamp: string): string {
  const time = new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${location} — ${time}`;
}

function formatStatus(
  status: "active" | "found" | "closed" | "reunited"
): string {
  const statusMap = {
    active: "Active",
    found: "Found",
    closed: "Closed",
    reunited: "Reunited",
  };
  return statusMap[status] || status;
}

function formatTimestamp(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}min ago`;
  } else if (diffHours < 24) {
    return `${diffHours}hrs ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return then.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
