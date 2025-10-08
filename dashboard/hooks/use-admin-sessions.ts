/**
 * useAdminSessions Hook
 *
 * React hook for managing admin chat sessions.
 * Handles fetching, loading, and deleting sessions.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { AdminSessionSummary, AdminSessionDetail } from "@/types/api";

interface UseAdminSessionsOptions {
  autoLoad?: boolean;
  onSessionDeleted?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

interface UseAdminSessionsResult {
  sessions: AdminSessionSummary[];
  isLoading: boolean;
  error: string | null;
  loadSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<AdminSessionDetail | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

export function useAdminSessions(
  options: UseAdminSessionsOptions = {}
): UseAdminSessionsResult {
  const [sessions, setSessions] = useState<AdminSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract callbacks to avoid recreating loadSessions
  const { onError, onSessionDeleted } = options;

  // Load all sessions
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.adminChat.getSessions();
      setSessions(response.sessions || []);
    } catch (err) {
      const errorMsg =
        err instanceof ApiError
          ? err.message
          : "Failed to load admin chat sessions";
      setError(errorMsg);
      console.error("Failed to load sessions:", err);

      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Load a specific session with full conversation history
  const loadSession = useCallback(
    async (sessionId: string): Promise<AdminSessionDetail | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const sessionDetail = await api.adminChat.getSession(sessionId);
        return sessionDetail;
      } catch (err) {
        const errorMsg =
          err instanceof ApiError
            ? err.message
            : `Failed to load session ${sessionId}`;
        setError(errorMsg);
        console.error(`Failed to load session ${sessionId}:`, err);

        if (onError) {
          onError(errorMsg);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onError]
  );

  // Delete a session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await api.adminChat.deleteSession(sessionId);

        // Remove the session from local state
        setSessions((prev) =>
          prev.filter((session) => session.session_id !== sessionId)
        );

        if (onSessionDeleted) {
          onSessionDeleted(sessionId);
        }
      } catch (err) {
        const errorMsg =
          err instanceof ApiError
            ? err.message
            : `Failed to delete session ${sessionId}`;
        setError(errorMsg);
        console.error(`Failed to delete session ${sessionId}:`, err);

        if (onError) {
          onError(errorMsg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [onError, onSessionDeleted]
  );

  // Refresh sessions (alias for loadSessions)
  const refreshSessions = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  // Auto-load sessions on mount if enabled
  // Use a ref to track if we've loaded to prevent re-runs
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (options.autoLoad && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadSessions();
    }
  }, [options.autoLoad, loadSessions]);

  return {
    sessions,
    isLoading,
    error,
    loadSessions,
    loadSession,
    deleteSession,
    refreshSessions,
  };
}
