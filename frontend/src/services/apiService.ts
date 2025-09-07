/* eslint-disable @typescript-eslint/no-explicit-any */
// API service for Gemini Live backend integration
// Handles all communication with the Python backend

import { config } from "../config/appConfig";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getApiErrorMessage, getErrorMessage } from "../utils/errorMessages";
import { notificationService } from "./notificationService";

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
  private isStreamActive = false;
  private isConnecting = false;
  private streamController: AbortController | null = null;
  private lastEventTime = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastActivityTime = Date.now();
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private lastResponseTime = Date.now();
  private silenceTimeout: NodeJS.Timeout | null = null;
  private sseMessageCallback: ((data: StreamResponse) => void) | null = null;
  private sseRestartTimeout: NodeJS.Timeout | null = null;
  private sseRotationInterval: NodeJS.Timeout | null = null;
  private sseStartTime = Date.now();

  constructor() {
    this.baseUrl = config.api.baseUrl;
  }

  // Get headers with API key authentication
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add API key if available
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    
    return headers;
  }

  // Health check for certificate validation
  async checkCertificateStatus(): Promise<boolean> {
    try {
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
  // Don't connect if already connected or currently connecting
  if (this.isConnected) {
    console.log("🔌 Already connected to API");
    return true;
  }
  
  if (this.isConnecting) {
    console.log("🔌 Connection already in progress");
    return true;
  }

  this.isConnecting = true;

  try {
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

    if (response.ok) {
      this.isConnected = true;
      this.isConnecting = false;
      this.lastActivityTime = Date.now();
      this.lastResponseTime = Date.now();
      console.log("🔌 Connected to API");
      
      // Start heartbeat to keep connection alive
      this.startHeartbeat();
      
      return true;
    } else {
      this.isConnecting = false;
      const friendlyError = getErrorMessage(response.status);
      notificationService.showError(friendlyError.message);
      return false;
    }
  } catch (error) {
    this.isConnecting = false;
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
    // Stop heartbeat and monitors
    this.stopHeartbeat();
    this.stopSilenceMonitor();
    
    const response = await fetch(`${this.baseUrl}/disconnect`, {
      method: "POST",
      headers: this.getHeaders(),
    });

    this.isConnected = false;
    this.isConnecting = false;

    // Close SSE connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isStreamActive = false;

    console.log("🔌 Disconnected from API.");
  } catch (error) {
    console.error("❌ Disconnect error:", error);
  }
}

  // Send text message (like original frontend - no status checks)
  async sendText(text: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to API");
    }
    
    // Always check SSE stream health before sending
    const timeSinceLastResponse = Date.now() - this.lastResponseTime;
    const sseAge = Date.now() - this.sseStartTime;
    
    // If stream is old (>4 min) or no recent responses (>3 min), restart it
    if ((sseAge > 240000 || timeSinceLastResponse > 180000) && this.isStreamActive) {
      console.log(`⚠️ Refreshing SSE stream (age: ${Math.floor(sseAge/1000)}s, last response: ${Math.floor(timeSinceLastResponse/1000)}s ago)`);
      this.restartSSEStream();
      // Short wait for stream to restart
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    try {
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
        
        // Handle specific Live API WebSocket closure error
        if (typeof errorDetail === 'string' && errorDetail.includes('Failed to send message to Live API') && errorDetail.includes('1000 (OK)')) {
          // Mark as disconnected so UI can handle reconnection
          this.isConnected = false;
          // Don't show notification - let the UI show the error message in chat
          throw new Error("API_NOT_CONNECTED");
        }
        
        // Use friendly error message and show notification
        const friendlyError = getErrorMessage(response.status);
        notificationService.showError(friendlyError.message);
        return;
      }

      console.log(`📨 Text sent: "${text.substring(0, 50)}..."`);
      this.lastActivityTime = Date.now();
      
      // Monitor if we get a response within 15 seconds
      setTimeout(() => {
        const currentTime = Date.now();
        if (this.lastResponseTime < this.lastActivityTime && this.isConnected) {
          console.log("⚠️ No SSE response received after sending text, restarting stream...");
          this.restartSSEStream();
        }
      }, 15000);
    } catch (error) {
      // Handle specific Live API WebSocket closure error
      if (error instanceof Error && error.message.includes('Failed to send message to Live API') && error.message.includes('1000 (OK)')) {
        this.isConnected = false;
        // Trigger reconnection after a brief delay
        setTimeout(async () => {
          try {
            await this.connect();
          } catch (reconnectError) {
            console.error("Reconnection failed:", reconnectError);
          }
        }, 10);
        throw new Error("API_NOT_CONNECTED");
      }
      
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

    try {
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(pcmData.buffer))
      );

      const response = await fetch(`${this.baseUrl}/send_audio`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ audio_data: base64Audio } as SendAudioRequest),
      });

      // Update activity time on successful send
      if (response.ok) {
        this.lastActivityTime = Date.now();
      }

      if (!response.ok) {
        // Handle 400 errors - session expired, need to reconnect
        if (response.status === 400) {
          console.log("⚠️ Session expired (400 error) - marking disconnected for reconnection");
          this.isConnected = false;
          
          // Trigger reconnection after a brief delay
          setTimeout(async () => {
            console.log("🔄 Attempting to reconnect after 400 error...");
            try {
              await this.connect("AUDIO");
              console.log("✅ Reconnected successfully after 400 error");
            } catch (reconnectError) {
              console.error("❌ Reconnection failed after 400 error:", reconnectError);
              notificationService.showError("Connection lost. Please refresh the page.", 5000);
            }
          }, 1000);
          return;
        }
        
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
      // Only log network/connection errors, not HTTP errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        notificationService.showError("Connection lost. Please check your network.", 3000);
      } else {
        notificationService.showError("Audio transmission failed. Please try again.", 3000);
      }
    }
  }

  // Send interruption signal to stop bot from speaking
  async sendInterruption(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const response = await fetch(`${this.baseUrl}/interrupt`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ action: "interrupt" }),
      });

      if (!response.ok) {
        notificationService.showError("Failed to send interruption signal", 2000);
      } else {
        console.log("🛑 Interruption signal sent to backend");
      }
    } catch (error) {
      notificationService.showError("Failed to send interruption signal", 2000);
    }
  }

  // Send image frame (simplified to match original)
  async sendImage(base64Image: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      console.log(
        "Sending image to backend, base64 length:",
        base64Image.length
      );

      await fetch(`${this.baseUrl}/send_image`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ image_data: base64Image } as SendImageRequest),
      });

      console.log("Image sent to backend");
    } catch (error) {
      notificationService.showError("Failed to send image. Please try again.", 3000);
    }
  }

  // Upload JSON data to backend
  async uploadJson(filename: string, conversationData: any): Promise<void> {
    try {
      console.log("📤 Uploading conversation JSON to backend:", filename);

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

      console.log("✅ Conversation JSON uploaded successfully:", filename);
    } catch (error) {
      notificationService.showError("Failed to upload conversation data", 3000);
    }
  }

  // Start Server-Sent Events stream
  startEventStream(onMessage: (data: StreamResponse) => void): void {
    // Store the callback for later use
    this.sseMessageCallback = onMessage;
    
    // ALWAYS force close any existing stream to prevent duplicates
    if (this.streamController || this.isStreamActive) {
      console.log("📡 Force closing any existing streams...");
      
      // Kill the old controller immediately
      if (this.streamController) {
        try {
          this.streamController.abort();
        } catch (e) {
          // Ignore errors
        }
        this.streamController = null;
      }
      
      // Mark inactive
      this.isStreamActive = false;
      
      // Small delay then restart
      setTimeout(() => this.startEventStream(onMessage), 100);
      return;
    }

    this.isStreamActive = true;
    this.reconnectAttempts = 0;
    this.sseStartTime = Date.now();
    
    // Start SSE rotation timer - force new connection every 4 minutes
    this.startSSERotation();

    // Create new abort controller for this stream
    this.streamController = new AbortController();

    const headers = this.getHeaders() as Record<string, string>;

    // Setup SSE endpoint URL with API key as query parameter
    const url = new URL(`${this.baseUrl}/stream_responses`);
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) {
      url.searchParams.append('api_key', apiKey);
    }
    
    fetchEventSource(url.toString(), {
      headers: headers,
      method: "GET",
      signal: this.streamController.signal,
      onopen: async (res) => {
        if (
          res.ok &&
          res.headers.get("content-type")?.includes("text/event-stream")
        ) {
          console.log("🔌 SSE connection opened");
        } else {
          throw new Error(`❌ Unexpected response: ${res.status}`);
        }
      },
      onmessage: (msg) => {
        try {
          const data = JSON.parse(msg.data) as StreamResponse;
          // Update last response time when we receive any message
          this.lastResponseTime = Date.now();
          this.lastActivityTime = Date.now();
          
          // Simple, clear logging
          if (data.type === 'text') {
            console.log(`📡 Text event: ${data.text ? 'Has content' : 'EMPTY'}`);
          } else if (data.type === 'audio') {
            console.log(`🔊 Audio event: ${data.audio_data ? 'Has audio' : 'EMPTY'}`);
          } else if (data.type === 'turn_complete') {
            console.log(`✅ Turn complete`);
          } else if (data.type === 'interrupted') {
            console.log(`🛑 Interrupted`);
          }
          
          onMessage(data);
        } catch (err) {
          console.error("❌ Failed to parse SSE message:", err, "Raw message:", msg);
        }
      },
      onclose: () => {
        console.log("🔌 SSE connection closed");
        this.isStreamActive = false;
      },
      onerror: (err) => {
        console.error("SSE error:", err);
        this.isStreamActive = false;
        
        // Retry SSE connection after a short delay
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Retrying SSE connection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            if (this.isConnected) {
              this.startEventStream(onMessage);
            }
          }, 2000);
        } else {
          notificationService.showError("Stream connection lost. Refreshing connection...", 3000);
          this.restartSSEStream();
        }
      },
    });
  }

  // Close event stream
  closeEventStream(): void {
    console.log('🔌 Closing event stream...')
    
    // Stop SSE rotation
    this.stopSSERotation();
    
    // Abort the fetch request
    if (this.streamController) {
      this.streamController.abort();
      this.streamController = null;
    }
    
    // Close event source if exists
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isStreamActive = false;
    this.reconnectAttempts = 0;
    console.log('✅ Event stream closed')
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    // Clear any existing heartbeat
    this.stopHeartbeat();
    
    // Use a proper keepalive endpoint instead of sending empty text
    this.heartbeatInterval = setInterval(async () => {
      if (this.isConnected) {
        try {
          // Use health check as keepalive
          const response = await fetch(`${this.baseUrl}/health`, {
            method: "GET",
            headers: this.getHeaders(),
            signal: AbortSignal.timeout(5000),
          });
          
          if (!response.ok) {
            console.log("⚠️ Health check failed, reconnecting...");
            await this.handleConnectionLoss();
          } else {
            this.lastActivityTime = Date.now();
          }
        } catch (error) {
          console.error("❌ Heartbeat failed:", error);
          await this.handleConnectionLoss();
        }
      }
    }, 30000); // Check every 30 seconds
    
    // Monitor for silence (no responses for 4 minutes)
    this.startSilenceMonitor();
  }
  
  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.stopSilenceMonitor();
  }
  
  // Start monitoring for silence (no responses)
  private startSilenceMonitor(): void {
    this.stopSilenceMonitor();
    
    // Check every 20 seconds if we've received any responses
    this.connectionCheckInterval = setInterval(() => {
      const timeSinceLastResponse = Date.now() - this.lastResponseTime;
      const sseAge = Date.now() - this.sseStartTime;
      
      console.log(`🔍 SSE Monitor - Last response: ${Math.floor(timeSinceLastResponse/1000)}s ago, Stream age: ${Math.floor(sseAge/1000)}s, Active: ${this.isStreamActive}`);
      console.log(`🔍 Connection states - Backend: ${this.isConnected}, SSE: ${this.isStreamActive}, Callback exists: ${!!this.sseMessageCallback}`);
      
      // If no response for 2 minutes, force restart SSE
      if (timeSinceLastResponse > 120000 && this.isConnected) {
        console.log("⚠️ No SSE responses for 2 minutes, forcing stream restart...");
        this.restartSSEStream();
      }
    }, 20000); // Check every 20 seconds
  }
  
  // Stop silence monitor
  private stopSilenceMonitor(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }
  
  // Handle connection loss and reconnect
  private async handleConnectionLoss(): Promise<void> {
    console.log("🔄 Handling connection loss...");
    this.isConnected = false;
    this.stopHeartbeat();
    
    // Clear any pending responses
    this.clearPendingResponses();
    
    // Try to reconnect
    setTimeout(async () => {
      try {
        console.log("🔄 Attempting reconnection...");
        await this.connect("AUDIO");
        console.log("✅ Reconnected successfully");
      } catch (error) {
        console.error("❌ Reconnection failed:", error);
        notificationService.showError("Connection lost. Please refresh the page.", 5000);
      }
    }, 2000);
  }
  
  // Clear any pending responses to avoid stale data
  private clearPendingResponses(): void {
    // Close the current stream
    this.closeEventStream();
    
    // Reset state
    this.lastResponseTime = Date.now();
    this.lastActivityTime = Date.now();
  }
  
  // Restart SSE stream without disconnecting backend
  private restartSSEStream(): void {
    if (this.sseRestartTimeout) {
      clearTimeout(this.sseRestartTimeout);
    }
    
    console.log("🔄 Force killing old SSE and starting fresh...");
    
    // FORCE KILL everything related to the old stream
    if (this.streamController) {
      try {
        this.streamController.abort();
      } catch (e) {
        console.log("⚠️ Error aborting controller:", e);
      }
      this.streamController = null;
    }
    
    // Close any existing event source
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (e) {
        console.log("⚠️ Error closing event source:", e);
      }
      this.eventSource = null;
    }
    
    // Mark as completely inactive
    this.isStreamActive = false;
    this.reconnectAttempts = 0;
    
    // Immediately restart with new stream
    if (this.isConnected && this.sseMessageCallback) {
      console.log("📡 Starting completely fresh SSE stream...");
      // Small delay to ensure cleanup
      setTimeout(() => {
        this.startEventStream(this.sseMessageCallback);
      }, 100);
    }
  }
  
  // Start SSE rotation timer
  private startSSERotation(): void {
    this.stopSSERotation();
    
    // Rotate SSE connection every 3 minutes to prevent timeout
    this.sseRotationInterval = setInterval(() => {
      const sseAge = Date.now() - this.sseStartTime;
      console.log(`⏰ SSE stream age: ${Math.floor(sseAge/1000)}s, rotating to prevent timeout...`);
      
      if (this.isConnected && this.isStreamActive) {
        this.restartSSEStream();
      }
    }, 180000); // 3 minutes
  }
  
  // Stop SSE rotation
  private stopSSERotation(): void {
    if (this.sseRotationInterval) {
      clearInterval(this.sseRotationInterval);
      this.sseRotationInterval = null;
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
