/* eslint-disable @typescript-eslint/no-explicit-any */
// API service for Gemini Live backend integration
// Handles all communication with the Python backend

import { config } from "../config/appConfig";
import { authUtils } from "../utils/auth";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getApiErrorMessage, getErrorMessage } from "../utils/errorMessages";
import { notificationService } from "./notificationService";
import { apiCounterService } from "./apiCounterService";

interface ConnectRequest {
  response_modalities: string[];
  system_instructions: string;
}

interface SendTextRequest {
  text: string;
}

interface SendAudioRequest {
  audio_data: string;
}

interface SendImageRequest {
  image_data: string;
}

interface UploadJsonRequest {
  filename: string;
  payload: {
    [key: string]: any;
  };
}

interface ProductLink {
  url: string;
  title: string;
  company?: string;
  companyName?: string; // Backend sends this field
  city?: string;
  rating?: string;
  supplier_rating?: number; // Backend sends this field
  source?: string;
  image_url?: string;
  product_url?: string; // Backend sends this field for product images
}

interface StreamResponse {
  type: string;
  text?: string;
  audio_data?: string;
  chunk_number?: number;
  chunk_size?: number;
  function_name?: string;
  links?: ProductLink[];
  has_text?: boolean;
  timestamp?: number;
}

class ApiService {
  private baseUrl: string;
  private eventSource: EventSource | null = null;
  private isConnected = false;
  private streamConnectionChecker: (() => boolean) | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
  }

  // Set stream connection checker function
  setStreamConnectionChecker(checker: () => boolean) {
    this.streamConnectionChecker = checker;
  }

  // Check if stream is connected
  private canMakeApiCalls(): boolean {
    if (!this.streamConnectionChecker) return true; // Default to true if no checker set
    return this.streamConnectionChecker();
  }

  // Get headers with JWT token and API key
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add API key if available
    if (process.env.NEXT_PUBLIC_API_KEY) {
      headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY;
    }

    const token = authUtils.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  // Health check for certificate validation
  async checkCertificateStatus(): Promise<boolean> {
    try {
      apiCounterService.trackHealthCheck();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(config.api.timeout),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Health check for API availability (uses frontend API route to avoid CORS)
  async checkHealth(): Promise<boolean> {
    try {
      apiCounterService.trackHealthCheck();
      const response = await fetch(`/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(config.api.timeout),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Connect to Gemini Live API
async connect(
  responseModality: "AUDIO" | "TEXT" = "AUDIO"
): Promise<boolean> {
  try {
    apiCounterService.trackConnectApi();
    const systemInstructions =
      this.getSystemInstructionsForModality(responseModality);

    const response = await fetch(`${this.baseUrl}/connect`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        response_modalities: [responseModality],
        system_instructions: systemInstructions,
      } as ConnectRequest),
    });

    if (response.status === 401) {
      const errorData = await response.json();

      if (errorData?.detail) {
        alert(`⚠️ ${errorData.detail}`);

        localStorage.removeItem("indiamart_login_token");
        localStorage.removeItem("indiamart_jwt_token");

        window.location.href = "/";
        return false; // Explicit return false here
      }
    }

    if (response.ok) {
      this.isConnected = true;
      return true;
    } else {
      apiCounterService.trackConnectionError();
      const friendlyError = getErrorMessage(response.status);
      notificationService.showError(friendlyError.message);
      return false;
    }
  } catch (error) {
    apiCounterService.trackConnectionError();
    // Convert to friendly error message and show notification
    if (error instanceof Error) {
      const friendlyMessage = getApiErrorMessage(error);
      notificationService.showError(friendlyMessage);
    } else {
      notificationService.showError("Connection failed. Please try again.");
    }
    return false;
  }
}


  // Disconnect from API
  // Disconnect from API
async disconnect(): Promise<void> {
  try {
    apiCounterService.trackDisconnectApi();
    const response = await fetch(`${this.baseUrl}/disconnect`, {
      method: "POST",
      headers: this.getHeaders(), // ✅ Add headers here
    });

    if (response.status === 401) {
      const errorData = await response.json();

      if (errorData?.detail) {
        alert(`⚠️ ${errorData.detail}`);

        localStorage.removeItem("indiamart_login_token");
        localStorage.removeItem("indiamart_jwt_token");

        window.location.href = "/";
        return; // Explicitly return here to stop further execution
      }
    }

    this.isConnected = false;

    // Close SSE connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Abort any ongoing fetch operations
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

  } catch (error) {
    console.error("❌ Disconnect error:", error);
  }
}

  // Send text message (like original frontend - no status checks)
  async sendText(text: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to API");
    }
    if (!this.canMakeApiCalls()) {
      throw new Error("Stream disconnected");
    }

    try {
      apiCounterService.trackSendText();
      const response = await fetch(`${this.baseUrl}/send_text`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ text } as SendTextRequest),
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            const errorData = JSON.parse(errorBody);
            errorDetail = errorData.detail || errorBody;
          }
        } catch {
          // Use status text if parsing fails
        }
        // Use friendly error message and show notification
        const friendlyError = getErrorMessage(response.status);
        notificationService.showError(friendlyError.message);
        return;
      }

    } catch (error) {
      // Convert to friendly error message and show notification
      if (error instanceof Error && !error.message.includes("temporarily")) {
        const friendlyMessage = getApiErrorMessage(error);
        notificationService.showError(friendlyMessage);
      } else {
        notificationService.showError("Failed to send message. Please try again.");
      }
    }
  }

  // Send audio chunk
  async sendAudio(pcmData: Int16Array): Promise<void> {
    if (!this.isConnected) return;
    if (!this.canMakeApiCalls()) {
      return;
    }

    try {
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(pcmData.buffer))
      );

      // Track the sendAudio call with data size
      apiCounterService.trackSendAudio(pcmData.buffer.byteLength);

      const response = await fetch(`${this.baseUrl}/send_audio`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ audio_data: base64Audio } as SendAudioRequest),
      });

      if (response.status === 401) {
        const errorData = await response.json();

        if (
          errorData?.detail ===
          "You have been logged in elsewhere; this session is now invalid"
        ) {
          // Show notification (replace with your UI logic)
          alert(
            "⚠️ You have been logged in elsewhere; this session is now invalid."
          );

          // Clear auth token
          localStorage.removeItem("indiamart_login_token");
          localStorage.removeItem("indiamart_jwt_token");

          // Redirect to login page
          window.location.href = "/";

          // Stop further processing
          return;
        }
      }

      if (!response.ok) {
        apiCounterService.trackAudioError();
        // Silently handle 500 errors for send_audio API - no notifications
        if (response.status === 500) {
          return; // Exit silently for 500 errors
        }
        
        // Show notifications only for other error types (401, 403, etc.)
        const errorText = await response.text();
        let errorMessage = "Audio transmission failed";
        try {
          const errorData = JSON.parse(errorText);
          if (errorData?.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Use default message if parsing fails
        }
        
        notificationService.showError(errorMessage, 3000);
        return;
      }
    } catch (error) {
      apiCounterService.trackAudioError();
      // Only log network/connection errors, not HTTP errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        notificationService.showError("Connection lost. Please check your network.", 3000);
      } else {
        notificationService.showError("Audio transmission failed. Please try again.", 3000);
      }
    }
  }


  // Send image frame (simplified to match original)
  async sendImage(base64Image: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      apiCounterService.trackSendImage();

      const response = await fetch(`${this.baseUrl}/send_image`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ image_data: base64Image } as SendImageRequest),
      });

      if (!response.ok) {
        // Don't show error notification, don't disconnect - just log and continue like video frames
        return;
      }

    } catch (error) {
      // Don't show error notification, don't disconnect - just log and continue like video frames
    }
  }

  // Upload JSON data to backend
  async uploadJson(filename: string, conversationData: any): Promise<void> {
    try {
      apiCounterService.trackUploadJson();

      const requestData: UploadJsonRequest = {
        filename: filename,
        payload: {
          conversationData: conversationData,
        },
      };

      const response = await fetch(`${this.baseUrl}/upload-json`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

    } catch (error) {
      notificationService.showError("Failed to upload conversation data", 3000);
    }
  }

  // Start Server-Sent Events stream
  startEventStream(onMessage: (data: StreamResponse) => void): void {
    // Close any existing stream first
    this.closeEventStream();
    
    // Create new abort controller for this stream
    this.abortController = new AbortController();
    
    const headers = this.getHeaders() as Record<string, string>;
    const token = authUtils.getToken();

    // Add token and API key as query parameters
    const url = new URL(`${this.baseUrl}/stream_responses`);
    if (token) {
      url.searchParams.append('token', token);
    }
    if (process.env.NEXT_PUBLIC_API_KEY) {
      url.searchParams.append('api_key', process.env.NEXT_PUBLIC_API_KEY);
    }

    // Store reference to this for callback context
    const self = this;

    fetchEventSource(url.toString(), {
      signal: this.abortController.signal,
      headers: {
        Authorization: `Bearer ${token}` || "",
      },
      method: "GET",
      async onopen(res) {
        if (
          res.ok &&
          res.headers.get("content-type")?.includes("text/event-stream")
        ) {
          apiCounterService.trackStreamConnection();
        } else {
          throw new Error(`❌ Unexpected response: ${res.status}`);
        }
      },
      onmessage(msg) {
        try {
          const data = JSON.parse(msg.data) as StreamResponse;
          onMessage(data);
        } catch (err) {
          console.error("❌ Failed to parse SSE message:", err);
        }
      },
      onclose() {
        apiCounterService.trackStreamDisconnection();
      },
      onerror(err) {
        console.error("❌ SSE connection error:", err);
        apiCounterService.trackStreamError();
        notificationService.showError("Connection lost. Reconnecting...", 2000);
        setTimeout(() => {
          apiCounterService.trackStreamReconnection();
          self.startEventStream(onMessage);
        }, 20);
      },
    });
  }

  // Close event stream
  closeEventStream(): void {
    // Abort fetch event source
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      // Decrement stream counter when manually closing
    }
    
    // Close traditional event source (if any)
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Get system instructions based on modality
  private getSystemInstructionsForModality(modality: "AUDIO" | "TEXT"): string {
    const baseInstructions = `You are an AI assistant for IndiaMART, a B2B marketplace platform. Your role is to help users with both product sourcing and general IndiaMART questions.

WORKFLOW:
1. Determine User Intent: First understand what the user wants:
   - If they ask about IndiaMART services, policies, account issues, or how things work → Use the FAQ search tool
   - If they want to buy/source products or show product images → Follow the product sourcing workflow

2. For FAQ Questions: Use the search_indiamart_faq tool to find relevant answers about:
   - Account creation and management
   - Payment methods and policies
   - Supplier verification processes
   - Platform features and services
   - Return/refund policies
   - Any how-to questions about IndiaMART

3. For Product Sourcing:
   - Analyze product images and identify the product (never make up products if you don't see them)
   - Call the product and seller search tool immediately after you identify the product with default values
   - After this Ask relevant questions based on what you see (ask questioins one by one to avoid overwhelming the user):
     • Budget range
     • Supplier type (Wholesaler, retailer, manufacturer, etc.)
     • Quantity needed
     • Delivery location
   - Call the tools again to Help users refine their requirements
   - IMPORTANT: When users want to source products, ALWAYS call BOTH search tools together:
     • search_indiamart_products_with_images (for product listings with images)
     • search_indiamart_suppliers (for direct supplier contacts)
   - This provides comprehensive results combining product listings AND supplier information
   - Connect them with suitable sellers from both search results

4. Image Analysis: When you see a product image, immediately identify it, search it and ask clarifying questions one by one to better understand the buyer's requirements.

Always respond in a friendly, professional manner suitable for B2B commerce. Be conversational and helpful, focusing on understanding the user's exact needs. Never mention the internal tools calls or processes to the user. 

CRITICAL LANGUAGE REQUIREMENTS - FOLLOW STRICTLY:
- You MUST respond ONLY in Hindi or English - NEVER use any other language
- If user speaks in Hindi → You MUST respond in Hindi ONLY
- If user speaks in English → You MUST respond in English ONLY
- NEVER mix languages or respond in a different language than the user
- If user speaks any other language → Politely ask them to communicate in Hindi or English only
- This is a strict requirement - NO EXCEPTIONS - Never respond in languages other than Hindi or English`;

    if (modality === "AUDIO") {
      return (
        baseInstructions +
        `

AUDIO RESPONSE GUIDELINES:
- Since your response will be spoken aloud, keep it conversational and natural
- Avoid special characters, bullet points, asterisks, or complex formatting
- Use simple punctuation only (periods, commas, question marks)
- Keep responses concise and to the point while being helpful
- Use natural speech patterns and transitions
- When listing items, use words like "first", "second", "also", "and" instead of symbols
- Speak numbers clearly (say "twenty dollars" not "$20")
- Avoid multiple questions in one response
- Be warm and professional in your tone as if speaking to a business partner
- IMPORTANT: Always provide clear, readable transcription with your audio responses for subtitle display`
      );
    } else {
      return baseInstructions;
    }
  }

  // Check if connected
  get connected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export type { StreamResponse, ProductLink };
