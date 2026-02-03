/**
 * useAdminChat Hook
 *
 * React hook for admin chat with RAG support and session management.
 * Handles message sending, session continuity, and error states.
 */

import { useState, useCallback, useEffect } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { AdminChatMessage } from "@/types/api";

interface UseAdminChatOptions {
  sessionId?: string | null;
  onMessageReceived?: (response: string, sessionId: string) => void;
  onError?: (error: string) => void;
}

interface UseAdminChatResult {
  messages: AdminChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  loadSessionHistory: (messages: AdminChatMessage[]) => void;
  addMessage: (message: AdminChatMessage) => void;
  sources: Array<{
    title: string;
    content: string;
    relevance_score?: number;
  }> | null;
}

export function useAdminChat(
  options: UseAdminChatOptions = {}
): UseAdminChatResult {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(
    options.sessionId || null
  );
  const [sources, setSources] = useState<
    Array<{
      title: string;
      content: string;
      relevance_score?: number;
    }> | null
  >(null);

  // Send a message to the admin chat
  const sendMessage = useCallback(
    async (message: string) => {
      setIsLoading(true);
      setError(null);
      setSources(null);

      // Add user message to local state immediately
      const userMessage: AdminChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await api.adminChat.sendMessage(message, sessionId);

        // Update session ID if this is a new session
        if (response.session_id && response.session_id !== sessionId) {
          setSessionId(response.session_id);
        }

        // Add assistant message to local state
        const assistantMessage: AdminChatMessage = {
          role: "assistant",
          content: response.response,
          timestamp: response.timestamp || new Date().toISOString(),
          graph_image: response.graph_image,
          graph_code: response.graph_code,
          message_type: (response as any).message_type,
          metadata: (response as any).metadata,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Store sources if provided
        if (response.sources && response.sources.length > 0) {
          setSources(response.sources);
        }

        // Call the callback if provided
        if (options.onMessageReceived) {
          options.onMessageReceived(response.response, response.session_id);
        }
      } catch (err) {
        const errorMsg =
          err instanceof ApiError
            ? err.message
            : "Failed to send message to admin chat";
        setError(errorMsg);
        console.error("Failed to send admin chat message:", err);

        // Remove the optimistically added user message on error
        setMessages((prev) => prev.slice(0, -1));

        if (options.onError) {
          options.onError(errorMsg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, options]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setSources(null);
    setError(null);
  }, []);

  // Load session history
  const loadSessionHistory = useCallback((historyMessages: AdminChatMessage[]) => {
    setMessages(historyMessages);
    setError(null);
  }, []);

  // Add a message programmatically (for email dispatch, etc.)
  const addMessage = useCallback((message: AdminChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Clear messages when sessionId from options changes (switching sessions)
  useEffect(() => {
    if (options.sessionId !== sessionId) {
      console.log(`[useAdminChat] Session changed from ${sessionId} to ${options.sessionId}, clearing messages`);
      setMessages([]);
      setSessionId(options.sessionId || null);
      setError(null);
      setSources(null);
    }
  }, [options.sessionId, sessionId]);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    clearMessages,
    loadSessionHistory,
    addMessage,
    sources,
  };
}
