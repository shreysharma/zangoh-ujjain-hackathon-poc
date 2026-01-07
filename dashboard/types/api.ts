/**
 * API Response Types
 *
 * These types match the expected backend API response structures.
 * Update these when the actual API schema is finalized.
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// LOST & FOUND API RESPONSES
// ============================================================================

export interface LostFoundCaseApiResponse {
  case_id: string;
  title: string;
  reporter: {
    name: string;
    relation: string;
    contact?: string;
  };
  missing_person: {
    name: string;
    age: number;
    age_unit: "years" | "months";
    gender: "male" | "female" | "other";
    height_cm: number;
    identification_marks: string;
  };
  clothing_description: string;
  last_seen: {
    location: string;
    timestamp: string; // ISO 8601 format
    gate?: string;
    zone?: string;
  };
  found_at?: {
    location: string;
    timestamp: string;
    gate?: string;
    zone?: string;
  };
  investigation: {
    steps: string[];
    logged_by: string;
    verified_by?: string;
  };
  status: "active" | "found" | "closed" | "reunited";
  outcome?: string;
  closure_notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// OPERATIONS BRIEF API RESPONSES
// ============================================================================

export interface OperationsBriefApiResponse {
  brief_id: string;
  title: string;
  date: string; // ISO 8601 date
  time: string; // HH:MM format
  metadata: {
    from: string;
    to: string[];
    weather: {
      condition: string;
      temperature_c: number;
    };
  };
  sections: {
    crowd_outlook?: {
      title: string;
      items: string[];
    };
    logistics_control?: {
      title: string;
      items: string[];
    };
    lost_found?: {
      title: string;
      items: string[];
      stats?: {
        total_cases: number;
        resolved: number;
        active: number;
      };
    };
    safety_readiness?: {
      title: string;
      items: string[];
    };
    team_tasks?: {
      title: string;
      items: string[];
    };
  };
  created_at: string;
  created_by: string;
}

// ============================================================================
// EMAIL DISPATCH API RESPONSES
// ============================================================================

// New email API format (using /sendemail endpoint)
export interface SendEmailRequest {
  Subject: string;
  Body: string; // HTML supported
  EmailList: Array<{
    email: string;
    zone: string;
  }>;
}

export interface SendEmailResponse {
  response: string; // e.g., "Sent 2/2 emails successfully"
  EmailList: Array<{
    email: string;
    zone: string;
    success: boolean;
    status: "sent" | "failed";
    message_id?: number;
    message_uuid?: string;
    error?: string;
  }>;
}

// Legacy format (kept for backward compatibility)
export interface EmailDispatchApiResponse {
  dispatch_id: string;
  campaign_name: string;
  subject: string;
  content_type: "operations_brief" | "alert" | "report";
  recipients: EmailRecipientApiResponse[];
  status: "pending" | "sending" | "completed" | "failed";
  stats: {
    total: number;
    sent: number;
    sending: number;
    failed: number;
  };
  created_at: string;
  completed_at?: string;
}

export interface EmailRecipientApiResponse {
  recipient_id: string;
  team_name: string;
  team_zone?: string;
  email_address: string;
  status: "pending" | "sending" | "sent" | "failed";
  sent_at?: string;
  error_message?: string;
}

// ============================================================================
// CHAT/AI QUERY API RESPONSES
// ============================================================================

export interface ChatQueryApiResponse {
  query_id: string;
  query_text: string;
  response_type:
    | "case_details"
    | "operations_brief"
    | "email_dispatch"
    | "statistics"
    | "general";
  status: "processing" | "completed" | "error";
  processing_steps?: ProcessingStep[];
  data?:
    | LostFoundCaseApiResponse
    | OperationsBriefApiResponse
    | EmailDispatchApiResponse
    | any;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface ProcessingStep {
  step_id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  details?: string;
}

// ============================================================================
// STREAMING RESPONSE (for real-time updates)
// ============================================================================

export interface StreamingMessage {
  type: "step_update" | "data" | "complete" | "error";
  payload:
    | ProcessingStep
    | LostFoundCaseApiResponse
    | OperationsBriefApiResponse
    | { message: string };
}

// ============================================================================
// STATISTICS API RESPONSES
// ============================================================================

export interface StatisticsApiResponse {
  metric_type: string;
  time_period: {
    start: string;
    end: string;
  };
  data: {
    total: number;
    breakdown?: Record<string, number>;
    trend?: Array<{
      timestamp: string;
      value: number;
    }>;
  };
}

// ============================================================================
// USER/AUTH API RESPONSES
// ============================================================================

export interface UserApiResponse {
  user_id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  zone?: string;
  permissions: string[];
}

export interface AuthApiResponse {
  token: string;
  refresh_token: string;
  expires_at: string;
  user: UserApiResponse;
}

// ============================================================================
// TICKETS API RESPONSES
// ============================================================================

export interface TicketEvent {
  type: string;
  title?: string;
  category?: string;
  ticket_id?: string;
  timestamp?: number;
  description?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  text?: string | null;
}

export interface TicketApiItem {
  ticket_id: string;
  title: string;
  description: string | null;
  category: string;
  conversation_id: string;
  location_lat: number | null;
  location_lng: number | null;
  severity: string;
  user_id: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  conversation_events: TicketEvent[];
}

export interface TicketListApiResponse {
  count: number;
  tickets: TicketApiItem[];
}

// ============================================================================
// NOTIFICATION API RESPONSES
// ============================================================================

export interface NotificationApiResponse {
  notification_id: string;
  type: "alert" | "info" | "warning" | "success";
  title: string;
  message: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

// ============================================================================
// ADMIN CHAT API (with RAG and session management)
// ============================================================================

export interface AdminChatRequest {
  message: string;
  session_id?: string | null;
}

export interface AdminChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  graph_image?: string; // Base64 encoded PNG
  graph_code?: string; // Python code for generating the graph
  message_type?: "text" | "operations_brief" | "email_dispatch" | "case_details";
  metadata?: {
    // For operations brief
    brief?: OperationsBriefApiResponse;
    // For email dispatch
    email_dispatch?: SendEmailResponse;
    // For case details
    case?: LostFoundCaseApiResponse;
    // Action triggers
    action?: "send_email" | "view_brief" | "view_case";
  };
}

export interface AdminChatResponse {
  success: boolean;
  session_id: string;
  message?: string;
  response: string;
  timestamp: string;
  graph_image?: string; // Base64 encoded PNG
  graph_code?: string; // Python code for generating the graph
  message_type?: "text" | "operations_brief" | "email_dispatch" | "case_details";
  metadata?: {
    // For operations brief
    brief?: OperationsBriefApiResponse;
    // For email dispatch
    email_dispatch?: SendEmailResponse;
    // For case details
    case?: LostFoundCaseApiResponse;
    // Action triggers
    action?: "send_email" | "view_brief" | "view_case";
  };
  search_results?: any;
  sources?: Array<{
    title: string;
    content: string;
    relevance_score?: number;
  }>;
}

export interface AdminSessionSummary {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  first_message?: string;
}

export interface AdminSessionDetail {
  session_id: string;
  created_at: string;
  updated_at: string;
  messages: AdminChatMessage[];
}

export interface AdminSessionsResponse {
  sessions: AdminSessionSummary[];
  total: number;
}

export interface DeleteSessionResponse {
  success: boolean;
  message: string;
  session_id: string;
}
