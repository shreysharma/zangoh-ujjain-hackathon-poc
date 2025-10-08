/**
 * API Client
 *
 * Centralized API client for making backend requests.
 * Handles authentication, error handling, and request formatting.
 */

import type {
  ApiResponse,
  ChatQueryApiResponse,
  LostFoundCaseApiResponse,
  OperationsBriefApiResponse,
  EmailDispatchApiResponse,
  SendEmailRequest,
  SendEmailResponse,
  StatisticsApiResponse,
  AdminChatResponse,
  AdminSessionsResponse,
  AdminSessionDetail,
  DeleteSessionResponse,
} from "@/types/api";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// Warn if API key is missing
if (typeof window !== "undefined" && !API_KEY) {
  console.warn(
    "[API Client] ⚠️  API key is missing! Set NEXT_PUBLIC_API_KEY in .env.local\n" +
    "See API_SETUP.md for configuration instructions."
  );
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============================================================================
// BASE FETCH WRAPPER
// ============================================================================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers = {
    ...DEFAULT_HEADERS,
    ...(API_KEY && { "x-api-key": API_KEY }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    console.log(`[API] ${options.method || "GET"} ${url}`);
    console.log("[API] Request headers:", headers);
    if (options.body) {
      console.log("[API] Request body:", JSON.parse(options.body as string));
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[API] Response status: ${response.status}`);

    // Handle non-200 responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[API] Error response:", errorData);

      let errorMessage = errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;

      // Add helpful hint for API key errors
      if (errorMessage.includes("API key required") || errorMessage.includes("x-api-key")) {
        errorMessage += "\n\nℹ️  Add your API key to .env.local:\nNEXT_PUBLIC_API_KEY=your_api_key_here\n\nSee API_SETUP.md for details.";
      }

      throw new ApiError(
        errorMessage,
        response.status,
        errorData
      );
    }

    // Parse JSON response
    const data = await response.json();
    console.log("[API] Response data:", data);

    // Handle backend error responses (200 but success: false)
    if (data.success === false) {
      throw new ApiError(data.error || "Request failed", response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or parsing errors
    console.error("[API] Network error:", error);
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0
    );
  }
}

// ============================================================================
// CHAT / AI QUERY API
// ============================================================================

export const chatApi = {
  /**
   * Send a query to the AI assistant
   */
  async sendQuery(
    query: string
  ): Promise<ApiResponse<ChatQueryApiResponse>> {
    return apiFetch("/chat/query", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },

  /**
   * Get query status (for polling)
   */
  async getQueryStatus(
    queryId: string
  ): Promise<ApiResponse<ChatQueryApiResponse>> {
    return apiFetch(`/chat/query/${queryId}`);
  },

  /**
   * Stream query responses (Server-Sent Events)
   */
  streamQuery(query: string, onMessage: (data: any) => void): () => void {
    const token = localStorage.getItem("auth_token");
    const eventSource = new EventSource(
      `${API_BASE_URL}/chat/query/stream?query=${encodeURIComponent(query)}&token=${token}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
    };

    // Return cleanup function
    return () => eventSource.close();
  },
};

// ============================================================================
// LOST & FOUND API
// ============================================================================

export const lostFoundApi = {
  /**
   * Get case details by ID
   */
  async getCaseById(
    caseId: string
  ): Promise<ApiResponse<LostFoundCaseApiResponse>> {
    return apiFetch(`/lost-found/cases/${caseId}`);
  },

  /**
   * Search cases
   */
  async searchCases(params: {
    query?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ cases: LostFoundCaseApiResponse[] }>> {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiFetch(`/lost-found/cases?${queryString}`);
  },

  /**
   * Get recent cases
   */
  async getRecentCases(
    limit = 10
  ): Promise<ApiResponse<LostFoundCaseApiResponse[]>> {
    return apiFetch(`/lost-found/cases/recent?limit=${limit}`);
  },
};

// ============================================================================
// OPERATIONS BRIEF API
// ============================================================================

export const operationsBriefApi = {
  /**
   * Get today's operations brief
   */
  async getTodaysBrief(): Promise<ApiResponse<OperationsBriefApiResponse>> {
    return apiFetch("/operations/brief/today");
  },

  /**
   * Get brief by ID
   */
  async getBriefById(
    briefId: string
  ): Promise<ApiResponse<OperationsBriefApiResponse>> {
    return apiFetch(`/operations/brief/${briefId}`);
  },

  /**
   * Generate new brief (admin only)
   */
  async generateBrief(
    date: string
  ): Promise<ApiResponse<OperationsBriefApiResponse>> {
    return apiFetch("/operations/brief/generate", {
      method: "POST",
      body: JSON.stringify({ date }),
    });
  },
};

// ============================================================================
// EMAIL DISPATCH API
// ============================================================================

export const emailApi = {
  /**
   * Send bulk emails using Mailjet (NEW ENDPOINT)
   * @param params - Email subject, body (HTML), and recipient list
   * @returns Response with status and detailed results for each recipient
   */
  async sendEmail(params: SendEmailRequest): Promise<SendEmailResponse> {
    return apiFetch("/sendemail", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /**
   * Send email to teams (LEGACY - for backward compatibility)
   */
  async sendToTeams(params: {
    briefId?: string;
    recipients: string[];
    subject: string;
  }): Promise<ApiResponse<EmailDispatchApiResponse>> {
    return apiFetch("/email/dispatch", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /**
   * Get dispatch status (LEGACY)
   */
  async getDispatchStatus(
    dispatchId: string
  ): Promise<ApiResponse<EmailDispatchApiResponse>> {
    return apiFetch(`/email/dispatch/${dispatchId}`);
  },

  /**
   * Get all dispatches (LEGACY)
   */
  async getDispatches(params?: {
    status?: string;
    limit?: number;
  }): Promise<ApiResponse<EmailDispatchApiResponse[]>> {
    const queryString = params
      ? new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return apiFetch(`/email/dispatches${queryString ? `?${queryString}` : ""}`);
  },
};

// ============================================================================
// STATISTICS API
// ============================================================================

export const statisticsApi = {
  /**
   * Get lost & found statistics
   */
  async getLostFoundStats(params: {
    period: "today" | "week" | "month";
  }): Promise<ApiResponse<StatisticsApiResponse>> {
    return apiFetch(`/statistics/lost-found?period=${params.period}`);
  },

  /**
   * Get crowd flow statistics
   */
  async getCrowdStats(params: {
    zone?: string;
    period: "hour" | "day";
  }): Promise<ApiResponse<StatisticsApiResponse>> {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiFetch(`/statistics/crowd?${queryString}`);
  },
};

// ============================================================================
// ADMIN CHAT HELPERS
// ============================================================================

/**
 * Extract operations brief data from search results content string
 */
function extractBriefFromSearchResult(content: string, metadata: any): any {
  // Parse the text content to extract structured brief data
  const titleMatch = content.match(/^([^.]+Operations Brief[^.]+)\./);
  const fromMatch = content.match(/From:\s*([^.]+)\./);
  const toMatch = content.match(/To:\s*([^.]+)\./);
  const timeMatch = content.match(/Time:\s*([^.]+?)\./);
  const weatherMatch = content.match(/Weather:\s*([^.]+?)\./);
  const dateMatch = content.match(/—\s*([^.]+day,\s*\d+\s+\w+\s+\d{4})/);

  // Extract sections - capture ALL content without aggressive filtering
  const sections: any = {};

  // Crowd Outlook / Crowd Summary
  const crowdMatch = content.match(/(?:Crowd Outlook|Crowd Summary):\s*(.+?)(?=\n\s*(?:Logistics & Control:|Logistics & Cleanup:|Lost & Found:|Safety & (?:Readiness|Medical):|Team Tasks:)|$)/is);
  if (crowdMatch) {
    sections.crowdOutlook = crowdMatch[1]
      .split(/\.(?:\s+|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 3 && !s.match(/^[\s\n]+$/));
  }

  // Logistics & Control / Logistics & Cleanup
  const logisticsMatch = content.match(/(?:Logistics & Control|Logistics & Cleanup):\s*(.+?)(?=\n\s*(?:Lost & Found:|Safety & (?:Readiness|Medical):|Team Tasks:)|$)/is);
  if (logisticsMatch) {
    sections.logisticsControl = logisticsMatch[1]
      .split(/\.(?:\s+|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 3 && !s.match(/^[\s\n]+$/));
  }

  // Lost & Found
  const lostFoundMatch = content.match(/Lost & Found:\s*(.+?)(?=\n\s*(?:Safety & (?:Readiness|Medical):|Logistics & (?:Control|Cleanup):|Team Tasks:|Focus:)|$)/is);
  if (lostFoundMatch) {
    sections.lostFound = lostFoundMatch[1]
      .split(/\.(?:\s+|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 3 && !s.match(/^[\s\n]+$/));
  }

  // Safety & Readiness / Safety & Medical
  const safetyMatch = content.match(/Safety & (?:Readiness|Medical):\s*(.+?)(?=\n\s*(?:Logistics & (?:Control|Cleanup):|Team Tasks:|Focus:)|$)/is);
  if (safetyMatch) {
    sections.safetyReadiness = safetyMatch[1]
      .split(/\.(?:\s+|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 3 && !s.match(/^[\s\n]+$/));
  }

  // Team Tasks / Team Tasks & Tomorrow's Prep
  const teamTasksMatch = content.match(/Team Tasks(?: & Tomorrow's Prep)?:\s*(.+?)(?=\n\s*(?:Focus:|Next Brief:)|$)/is);
  if (teamTasksMatch) {
    sections.teamTasks = teamTasksMatch[1]
      .split(/\.(?:\s+|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 3 && !s.match(/^[\s\n]+$/));
  }

  const briefData = {
    brief_id: `brief-${metadata?.date || new Date().toISOString().split('T')[0]}`,
    title: titleMatch?.[1]?.trim() || "Operations Brief",
    date: dateMatch?.[1]?.trim() || metadata?.date || "Today",
    time: timeMatch?.[1]?.trim() || metadata?.time || "06:00 AM",
    from: fromMatch?.[1]?.trim() || "Command Center",
    to: toMatch?.[1]?.trim() || "All Teams",
    weather: weatherMatch?.[1]?.trim() || metadata?.weather || "Clear",
    sections,
  };

  return briefData;
}

/**
 * Extract case data from search results content string
 */
function extractCaseFromSearchResult(content: string, metadata: any): any {
  // Parse the text content to extract structured case data
  const caseIdMatch = content.match(/Case ID:\s*([A-Z]+-\d+)/i);
  const nameMatch = content.match(/Lost Person:\s*([^,]+?)(?=,\s*(?:Male|Female))/i);
  const genderMatch = content.match(/,\s*(Male|Female),|Gender:\s*(Male|Female)/i);
  const ageMatch = content.match(/Age:\s*(\d+)\s*years?/i);
  const heightMatch = content.match(/Height:\s*(\d+)\s*cm/i);
  const identificationMatch = content.match(/Identification Mark:\s*([^.]+?)\.\s*(?:Clothing|$)/i);
  const clothingMatch = content.match(/Clothing:\s*([^.]+?)\.\s*(?:Reported|$)/i);
  const reportedByMatch = content.match(/Reported by:\s*([^.]+?)\.\s*(?:Last seen|$)/i);

  // Last seen pattern: "Last seen: [location] at [time]."
  const lastSeenMatch = content.match(/Last seen:\s*([^.]+?)\s+(?:at|around)\s+([^.]+?)\./i);

  // Found at pattern: "Found at: [location] at [time]."
  const foundAtMatch = content.match(/Found at:\s*([^.]+?)\s+at\s+([^.]+?)\./i);

  const statusMatch = content.match(/Status:\s*([^.]+?)\.\s*(?:Outcome|$)/i);
  const outcomeMatch = content.match(/Outcome:\s*([^.]+?)\.\s*(?:Verified|$)/i);
  const verifiedByMatch = content.match(/Verified by:\s*([^.]+?)\.\s*(?:Closure|$)/i);
  const closureNotesMatch = content.match(/Closure Notes:\s*([^.]+(?:\.[^.]+)*?)(?:\.\s*$|$)/i);

  // Extract investigation steps
  const investigationMatch = content.match(/Investigation:\s*([^.]+(?:\.[^.]+)*?)\.\s*Status:/i);
  const investigationSteps = investigationMatch
    ? investigationMatch[1].split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 3)
    : [];

  const caseData = {
    case_id: caseIdMatch?.[1] || metadata?.case_id || "Unknown",
    title: `Lost & Found Case Summary — ${caseIdMatch?.[1] || metadata?.case_id || "Unknown"}`,
    reporter: reportedByMatch?.[1] || metadata?.reporter || "Unknown",
    missing_person: {
      name: nameMatch?.[1]?.trim() || metadata?.name || "Unknown",
      age: ageMatch?.[1] ? parseInt(ageMatch[1]) : metadata?.age || 0,
      age_unit: "years",
      gender: (genderMatch?.[1] || genderMatch?.[2] || metadata?.gender || "unknown").toLowerCase(),
      height_cm: heightMatch?.[1] ? parseInt(heightMatch[1]) : 0,
      identification_marks: identificationMatch?.[1]?.trim() || "None specified",
    },
    clothing_description: clothingMatch?.[1]?.trim() || "Not specified",
    last_seen: {
      location: lastSeenMatch?.[1]?.trim() || metadata?.location || "Unknown",
      time: lastSeenMatch?.[2]?.trim() || "Unknown time",
      timestamp: new Date().toISOString(),
      zone: metadata?.zone || "Unknown",
    },
    found_at: foundAtMatch ? {
      location: foundAtMatch[1]?.trim() || "Not found yet",
      time: foundAtMatch[2]?.trim() || "Unknown time",
      timestamp: new Date().toISOString(),
      zone: metadata?.zone || "Unknown",
    } : null,
    investigation: {
      steps: investigationSteps,
      logged_by: "System",
      verified_by: verifiedByMatch?.[1]?.trim() || "Pending",
    },
    status: (statusMatch?.[1]?.trim().toLowerCase() || metadata?.status || "active").replace(/\s*[—-].*$/, ''),
    outcome: outcomeMatch?.[1]?.trim() || "Pending",
    closure_notes: closureNotesMatch?.[1]?.trim().replace(/;/g, '; ') || "Case ongoing",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return caseData;
}

/**
 * Parse AI response that may be wrapped in markdown code blocks
 * and/or contain JSON with a "response" field and metadata
 */
function parseAIResponse(content: string, searchResults?: any): {
  text: string;
  graphCode: string | null;
  messageType?: string;
  metadata?: any;
} {
  let text = content;
  let graphCode = null;
  let messageType = undefined;
  let metadata = undefined;

  if (!content || typeof content !== "string") {
    return { text: content || "", graphCode: null };
  }

  try {
    // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
    let cleanedContent = content.trim();

    // Check for markdown code blocks
    const codeBlockMatch = cleanedContent.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (codeBlockMatch) {
      cleanedContent = codeBlockMatch[1].trim();
    }

    // Try to parse as JSON
    const parsed = JSON.parse(cleanedContent);

    // If it has a "response" field, extract it and other metadata
    if (parsed && typeof parsed === "object" && "response" in parsed) {
      text = parsed.response;
      graphCode = parsed.graph_code || null;
      messageType = parsed.message_type || parsed.type;

      // Extract metadata based on message type
      if (parsed.brief || parsed.brief_data) {
        messageType = "operations_brief";
        metadata = { brief: parsed.brief || parsed.brief_data };
      } else if (parsed.email_dispatch || parsed.EmailList) {
        messageType = "email_dispatch";
        metadata = { email_dispatch: parsed.email_dispatch || parsed };
      } else if (parsed.case || parsed.case_details || parsed.case_id) {
        messageType = "case_details";
        metadata = { case: parsed.case || parsed.case_details || parsed };
      } else if (parsed.metadata) {
        metadata = parsed.metadata;
      }
    } else if (parsed && typeof parsed === "object") {
      // Check if the entire response is structured data
      if (parsed.brief_id || parsed.sections) {
        messageType = "operations_brief";
        metadata = { brief: parsed };
        text = parsed.summary || "Operations brief generated.";
      } else if (parsed.EmailList || parsed.recipients) {
        messageType = "email_dispatch";
        metadata = { email_dispatch: parsed };
        text = parsed.response || "Email dispatch status.";
      } else if (parsed.case_id || parsed.missing_person) {
        messageType = "case_details";
        metadata = { case: parsed };
        text = parsed.title || "Case details retrieved.";
      } else {
        // If JSON parsed but no specific structure, use original
        text = content;
      }
    }
  } catch (e) {
    // Not valid JSON or other error - use content as-is
    // This is fine, it means the response is plain text
    text = content;
  }

  // PRIORITY: Check search results for structured data FIRST
  // This ensures we use the full detailed content from RAG instead of consolidated summaries
  if (searchResults?.results?.length > 0) {
    const firstResult = searchResults.results[0];

    // Check if this is an operations brief
    if (firstResult.metadata?.type === "operations_brief" ||
        firstResult.content?.includes("Operations Brief")) {

      const briefData = extractBriefFromSearchResult(firstResult.content, firstResult.metadata);
      messageType = "operations_brief";
      metadata = { brief: briefData };
    }
    // Check if this is a case-related query
    else if (firstResult.metadata?.type === "lost_found_case" ||
             content.toLowerCase().includes("case") ||
             firstResult.content?.includes("Case ID:")) {

      const caseData = extractCaseFromSearchResult(firstResult.content, firstResult.metadata);
      messageType = "case_details";
      metadata = { case: caseData };
    }
  }

  // FALLBACK: Detect response type from text content even without search_results
  // This handles conversation history where search_results are not stored
  if (!metadata && text) {
    const lowerText = text.toLowerCase();

    // Check for operations brief keywords in the response text
    if (lowerText.includes("operations brief") ||
        lowerText.includes("morning brief") ||
        lowerText.includes("evening brief")) {

      // Try to reconstruct brief from the text response
      // Look for brief-related information in the text
      const briefMatch = text.match(/(Morning|Evening)\s+Operations\s+Brief/i);
      const dateMatch = text.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\w+\s+\d+/i);

      // Dynamic parser: Extract ALL markdown bullet points regardless of keyword
      const extractAllBulletPoints = (text: string): { [key: string]: string[] } => {
        const allSections: { [key: string]: string[] } = {};

        // Normalize newlines - handle both escaped and actual newlines, as well as \r\n
        let normalizedText = text;

        // If the text contains escaped newlines (\\n as a string), convert them to actual newlines
        if (text.includes('\\n') && !text.includes('\n')) {
          normalizedText = text.replace(/\\n/g, '\n');
        }

        // Normalize \r\n to \n
        normalizedText = normalizedText.replace(/\r\n/g, '\n');

        // FORMAT 1: Inline bullets - "- **Keyword**: content" or "* **Keyword**: content"
        const inlineBulletPattern = /(?:^|\n)[\s]*[-*]\s+\*\*([^*:]+)\*\*:\s*([^\n]+)/g;
        let match;

        while ((match = inlineBulletPattern.exec(normalizedText)) !== null) {
          const keyword = match[1].trim();
          const content = match[2].trim();

          // Skip section headers like "Morning Brief (06:00 AM)"
          if (keyword.includes('Brief (') || keyword.includes('Brief for')) {
            continue;
          }

          if (!allSections[keyword]) {
            allSections[keyword] = [];
          }

          // Add content as-is (it's already a complete sentence)
          if (content.length > 5) {
            allSections[keyword].push(content);
          }
        }

        // FORMAT 2: Section headers - "**Section Name:**" followed by regular bullets
        // Parse: **Crowd Summary:**\n- bullet1\n- bullet2\n\n**Next Section:**
        const sectionHeaderPattern = /\*\*([^*:]+):\*\*[\s]*\n((?:[\s]*[-*]\s+[^\n]+\n?)+)/g;

        while ((match = sectionHeaderPattern.exec(normalizedText)) !== null) {
          const sectionName = match[1].trim();
          const bulletBlock = match[2].trim();

          // Extract individual bullets from the block
          const bulletLines = bulletBlock.split('\n').filter(line => line.trim().match(/^[-*]\s+/));
          const bullets = bulletLines.map(line => line.replace(/^[\s]*[-*]\s+/, '').trim()).filter(b => b.length > 5);

          if (!allSections[sectionName]) {
            allSections[sectionName] = [];
          }
          allSections[sectionName].push(...bullets);
        }

        return allSections;
      };

      // Extract all bullet points dynamically
      const allBullets = extractAllBulletPoints(text);

      const sections: any = {};

      // Map extracted bullets to appropriate sections based on keywords
      Object.keys(allBullets).forEach(keyword => {
        const lowerKey = keyword.toLowerCase();
        const items = allBullets[keyword];

        // Crowd-related (includes "Crowd Outlook", "Crowd Summary", "Tomorrow's Outlook")
        if (lowerKey.includes('crowd') || (lowerKey.includes('outlook') && !lowerKey.includes('tomorrow')) || lowerKey.includes('turnout') || lowerKey.includes('summary')) {
          sections.crowdOutlook = [...(sections.crowdOutlook || []), ...items];
        }
        // Logistics/Staffing
        else if (lowerKey.includes('logistic') || lowerKey.includes('staffing') || lowerKey.includes('control')) {
          sections.logisticsControl = [...(sections.logisticsControl || []), ...items];
        }
        // Lost & Found (includes "Lost & Found Status")
        else if (lowerKey.includes('lost') || lowerKey.includes('found')) {
          sections.lostFound = [...(sections.lostFound || []), ...items];
        }
        // Safety/Medical
        else if (lowerKey.includes('safety') || lowerKey.includes('medical')) {
          sections.safetyReadiness = [...(sections.safetyReadiness || []), ...items];
        }
        // Team Tasks/Focus Areas/Tomorrow's Outlook
        else if (lowerKey.includes('task') || lowerKey.includes('focus') || lowerKey.includes('prep') || lowerKey.includes('tomorrow')) {
          sections.teamTasks = [...(sections.teamTasks || []), ...items];
        }
        // Default: add to team tasks as general information
        else {
          sections.teamTasks = [...(sections.teamTasks || []), ...items];
        }
      });

      if (briefMatch || lowerText.includes("tomorrow") || lowerText.includes("forecast") || Object.keys(sections).length > 0) {
        messageType = "operations_brief";
        const hasSections = Object.keys(sections).length > 0;
        // Create a brief object from the text with parsed sections
        metadata = {
          brief: {
            title: briefMatch ? briefMatch[0] : "Operations Brief",
            date: dateMatch ? dateMatch[0] : "Tomorrow",
            time: "06:00 AM",
            from: "Command Center",
            to: "All Teams",
            weather: "Forecast pending",
            sections,
            isHistorical: !hasSections, // false if we have sections, true if empty
            summary: text,
          }
        };
      }
    }

    // Check for case keywords
    else if (lowerText.includes("case lfc-") ||
             lowerText.includes("lost & found case") ||
             lowerText.includes("person:") ||
             lowerText.includes("reported by:") ||
             (lowerText.includes("case") && (lowerText.includes("found") || lowerText.includes("reunited")))) {

      // Normalize newlines - the text already has actual newlines from JSON parsing
      let normalizedText = text;

      // Try to extract case info from text - handle markdown bullets format with both * and -
      const caseIdMatch = normalizedText.match(/(?:case\s+)?([A-Z]+-\d+)/i);

      // Parse all case-related bullets
      const extractCaseBullet = (keyword: string): string | null => {
        const pattern = new RegExp(`(?:^|\\n)[\\s]*[-*]\\s+\\*\\*${keyword}\\*\\*:?\\s*([^\\n]+)`, 'i');
        const match = normalizedText.match(pattern);
        return match ? match[1].trim() : null;
      };

      // Try multiple formats:
      // Format 1: - **Person:** ...
      // Format 2: Lost Person: ...
      // Format 3: Person: ...

      const person =
        normalizedText.match(/[-*]\s*\*\*Person\*\*:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() ||
        normalizedText.match(/Lost Person:\s*(.+?)(?=\.?\n|\.?$)/i)?.[1]?.trim() ||
        normalizedText.match(/(?:^|\n)Person:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() ||
        extractCaseBullet('Person');

      const descriptionRaw =
        normalizedText.match(/[-*]\s*\*\*Description\*\*:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() ||
        normalizedText.match(/(?:^|\n)Description:\s*(.+?)(?=\.?\n|\.?$)/i)?.[1]?.trim() ||
        extractCaseBullet('Description');

      // Extract clothing and identification marks from description
      let description = descriptionRaw;
      let clothing = null;
      let identificationMarks = null;

      if (descriptionRaw) {
        // Extract clothing: "wearing a blue t-shirt with white stripes and dark blue jeans"
        const wearingMatch = descriptionRaw.match(/(?:wearing|dressed in)\s+(.+?)(?:\.\s+He|\.?\s+She|$)/i);
        if (wearingMatch) {
          clothing = wearingMatch[1].trim().replace(/\.$/, '');
        }

        // Extract identification marks: "has a small mole..." or "Small mole on..."
        const markMatch = descriptionRaw.match(/(?:has?\s+a\s+|with\s+a\s+)?([^.]*(?:mole|scar|birthmark|tattoo|mark)[^.]*)/i);
        if (markMatch) {
          identificationMarks = markMatch[1].trim();
        }
      }

      // Parse Timeline format: "Timeline: Last seen at Gate 1 of Mahakaleshwar Temple at 08:15 AM..."
      const timelineMatch = normalizedText.match(/Timeline:\s*Last seen at\s+(.+?)\s+at\s+([0-9:APM\s]+)(?:\s+and)?/i);
      let lastSeenLocation = null;
      let lastSeenTime = null;
      let foundTime = null;
      let foundLocation = null;

      if (timelineMatch) {
        lastSeenLocation = timelineMatch[1].trim();
        lastSeenTime = timelineMatch[2].trim();

        // Also extract found time from Timeline
        const foundTimeMatch = normalizedText.match(/found at\s+(?:the\s+)?(.+?)\s+at\s+([0-9:APM\s]+)/i);
        if (foundTimeMatch) {
          if (!foundLocation) {
            foundLocation = foundTimeMatch[1].trim();
          }
          foundTime = foundTimeMatch[2].trim();
        }
      }

      const lastSeen =
        normalizedText.match(/[-*]\s*\*\*Last Seen\*\*:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() ||
        normalizedText.match(/(?:^|\n)Last Seen:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() ||
        (lastSeenLocation && lastSeenTime ? `${lastSeenLocation} at ${lastSeenTime}` : null) ||
        extractCaseBullet('Last Seen');

      let reportedBy =
        normalizedText.match(/[-*]\s*\*\*Reported By\*\*:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() ||
        normalizedText.match(/Reported By:\s*(.+?)(?=\.?\n|\.?$)/i)?.[1]?.trim() ||
        extractCaseBullet('Reported By');

      // Clean up reportedBy - extract the actual reporter from verbose text
      if (reportedBy) {
        const reporterMatch = reportedBy.match(/(?:by|from)\s+(?:his|her|their|a)?\s*(.+?)(?:\s+using|\s+via|\.?$)/i);
        if (reporterMatch) {
          reportedBy = reporterMatch[1].trim();
        }
      }

      let outcomeRaw =
        normalizedText.match(/[-*]\s*\*\*Outcome\*\*:\s*(.+?)(?=\n|$)/i)?.[1]?.trim() ||
        normalizedText.match(/(?:^|\n)Status:\s*(.+?)(?=\.?\n|\.?$)/i)?.[1]?.trim() ||
        normalizedText.match(/Timeline:.*?Outcome:\s*(.+?)(?=\.?\n|\.?$)/is)?.[1]?.trim() ||
        extractCaseBullet('Outcome');

      // Parse outcome and found location from Status field
      let outcome = outcomeRaw;
      let isResolved = false;
      if (outcomeRaw) {
        isResolved = outcomeRaw.toLowerCase().includes('resolved') ||
                     outcomeRaw.toLowerCase().includes('reunited') ||
                     outcomeRaw.toLowerCase().includes('found');

        const foundMatch = outcomeRaw.match(/found at\s+(.+?)(?:\s+and|\.|\s+at\s+\d)/i);
        if (foundMatch) {
          foundLocation = foundMatch[1].trim();
        }
      }

      const reportedAt = extractCaseBullet('Reported At');
      const zone = extractCaseBullet('Zone');

      // Parse person info: "A male in the Senior (60+) age group" or "Saira Khan, a 19-year-old female"
      let personName = "Unknown";
      let personAge = 0;
      let personGender = "unknown";
      let heightCm = 0;

      if (person) {
        // Format 1: "A male in the Senior (60+) age group"
        const ageGroupMatch = person.match(/(?:A|An)\s+(male|female)\s+in\s+the\s+(\w+)\s+\((\d+)\+?\)\s+age\s+group/i);
        if (ageGroupMatch) {
          personGender = ageGroupMatch[1].toLowerCase();
          personAge = parseInt(ageGroupMatch[3]);
        }

        // Format 2: "Saira Khan, a 19-year-old female" or "Aarav Sharma, a 6-year-old male"
        const namedMatch = person.match(/([^,]+),\s*a\s+(\d+)(?:-year-old)?\s+(male|female)/i);
        if (namedMatch) {
          personName = namedMatch[1].trim();
          personAge = parseInt(namedMatch[2]);
          personGender = namedMatch[3].toLowerCase();
        }

        // Extract height if mentioned
        const heightMatch = person.match(/(\d+)\s*cm/i);
        if (heightMatch) {
          heightCm = parseInt(heightMatch[1]);
        }
      }

      if (caseIdMatch || person) {
        messageType = "case_details";

        // If we have structured markdown bullets, parse them
        if (person) {
          const caseId = caseIdMatch?.[1] || "Unknown";

          metadata = {
            case: {
              case_id: caseId,
              title: `Lost & Found Case Summary — ${caseId}`,
              reporter: reportedBy || "Friend/Family",
              missing_person: {
                name: personName,
                age: personAge,
                age_unit: "years",
                gender: personGender,
                height_cm: heightCm,
                identification_marks: identificationMarks || "See description",
              },
              clothing_description: clothing || "Not specified",
              last_seen: {
                location: lastSeenLocation || lastSeen || zone || "Unknown",
                time: lastSeenTime || reportedAt || "Unknown",
                timestamp: new Date().toISOString(),
                zone: zone || "Unknown",
              },
              found_at: isResolved ? {
                location: foundLocation || "Found",
                time: foundTime || "See outcome",
                timestamp: new Date().toISOString(),
                zone: zone || "Unknown",
              } : null,
              investigation: {
                steps: outcome ? [outcome] : [],
                logged_by: "System",
                verified_by: isResolved ? "Field Ops" : "Pending",
              },
              status: isResolved ? "found" : "active",
              outcome: outcome || "Pending",
              closure_notes: outcome || "Case details from conversation history",
              created_at: reportedAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              isHistorical: false, // Show the card with extracted data
            }
          };
        } else {
          // Simplified historical card
          metadata = {
            case: {
              case_id: caseIdMatch?.[1] || "Unknown",
              title: `Lost & Found Case Summary`,
              isHistorical: true,
              summary: text,
            }
          };
        }
      }
    }
  }

  return { text, graphCode, messageType, metadata };
}

// ============================================================================
// ADMIN CHAT API (with RAG and session management)
// ============================================================================

export const adminChatApi = {
  /**
   * Send a message to the admin chat with RAG support
   * @param message - The user's message
   * @param sessionId - Optional session ID to continue a conversation
   */
  async sendMessage(
    message: string,
    sessionId?: string | null
  ): Promise<AdminChatResponse> {
    const response = await apiFetch<any>("/admin/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    });

    // Parse response if it's wrapped in markdown code blocks
    if (typeof response.response === "string") {
      const parsed = parseAIResponse(response.response, response.search_results);
      response.response = parsed.text;
      if (parsed.graphCode) {
        response.graph_code = parsed.graphCode;
      }
      if (parsed.messageType) {
        response.message_type = parsed.messageType;
      }
      if (parsed.metadata) {
        response.metadata = parsed.metadata;
      }
    }

    return response;
  },

  /**
   * Get all admin chat sessions
   */
  async getSessions(): Promise<AdminSessionsResponse> {
    return apiFetch("/admin/sessions");
  },

  /**
   * Get conversation history for a specific session
   * @param sessionId - The session ID
   */
  async getSession(sessionId: string): Promise<AdminSessionDetail> {
    const response = await apiFetch<any>(`/admin/session/${sessionId}`);

    // Transform backend response to match frontend expectations
    // Backend returns: { conversation: [{role: "human"|"ai", ...}], ... }
    // Frontend expects: { messages: [{role: "user"|"assistant", ...}], ... }

    const messages = (response.conversation || []).map((msg: any) => {
      let content = msg.content;
      let graphImage = msg.graph_image;
      let graphCode = msg.graph_code;
      let messageType = msg.message_type;
      let metadata = msg.metadata;

      // Parse AI response if it's a JSON string containing response/graph_code/metadata
      if (msg.role === "ai" && typeof content === "string") {
        const parsed = parseAIResponse(content, msg.search_results);
        content = parsed.text;
        if (parsed.graphCode) {
          graphCode = parsed.graphCode;
        }
        if (parsed.messageType) {
          messageType = parsed.messageType;
        }
        if (parsed.metadata) {
          metadata = parsed.metadata;
        }
      }

      // Check for case_summary field at message level (from conversation history)
      // Backend returns case_summary directly on the conversation item
      if (msg.case_summary) {
        messageType = "case_details";
        metadata = { case: msg.case_summary };
      }

      // Check for other metadata fields at message level
      if (msg.brief_data) {
        messageType = "operations_brief";
        metadata = { brief: msg.brief_data };
      }

      if (msg.email_dispatch) {
        messageType = "email_dispatch";
        metadata = { email_dispatch: msg.email_dispatch };
      }

      return {
        role: msg.role === "human" ? "user" : msg.role === "ai" ? "assistant" : msg.role,
        content,
        timestamp: msg.timestamp || new Date().toISOString(),
        graph_image: graphImage,
        graph_code: graphCode,
        message_type: messageType,
        metadata: metadata,
      };
    });

    return {
      session_id: response.session_id,
      created_at: response.created_at || new Date().toISOString(),
      updated_at: response.updated_at || new Date().toISOString(),
      messages,
    };
  },

  /**
   * Delete/clear a session's conversation history
   * @param sessionId - The session ID to delete
   */
  async deleteSession(sessionId: string): Promise<DeleteSessionResponse> {
    return apiFetch(`/admin/session/${sessionId}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const api = {
  chat: chatApi,
  lostFound: lostFoundApi,
  operationsBrief: operationsBriefApi,
  email: emailApi,
  statistics: statisticsApi,
  adminChat: adminChatApi,
};

export default api;
