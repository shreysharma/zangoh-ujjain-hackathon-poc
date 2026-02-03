/**
 * useChatQuery Hook
 *
 * React hook for sending queries to the AI assistant and handling responses.
 * Supports both polling and streaming modes.
 */

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import {
  transformCaseDetails,
  transformOperationsBrief,
  transformEmailDispatch,
  transformProcessingSteps,
} from "@/lib/api-transformers";
import type { ChatQueryApiResponse, ProcessingStep } from "@/types/api";

interface UseChatQueryResult {
  // State
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  processingSteps: Array<{ text: string; completed: boolean }>;
  data: any | null;
  responseType: ChatQueryApiResponse["response_type"] | null;

  // Actions
  sendQuery: (query: string) => Promise<void>;
  reset: () => void;
}

interface UseChatQueryOptions {
  mode?: "polling" | "streaming";
  pollingInterval?: number; // milliseconds
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useChatQuery(
  options: UseChatQueryOptions = {}
): UseChatQueryResult {
  const {
    mode = "polling",
    pollingInterval = 1000,
    onComplete,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingSteps, setProcessingSteps] = useState<
    Array<{ text: string; completed: boolean }>
  >([]);
  const [data, setData] = useState<any | null>(null);
  const [responseType, setResponseType] =
    useState<ChatQueryApiResponse["response_type"] | null>(null);
  const [queryId, setQueryId] = useState<string | null>(null);

  // ============================================================================
  // POLLING MODE
  // ============================================================================

  const pollQueryStatus = useCallback(async (qId: string) => {
    try {
      const response = await api.chat.getQueryStatus(qId);
      const queryData = response.data;

      // Update processing steps
      if (queryData.processing_steps) {
        setProcessingSteps(transformProcessingSteps(queryData.processing_steps));
      }

      // Check if completed
      if (queryData.status === "completed") {
        setIsProcessing(false);
        setResponseType(queryData.response_type);

        // Transform data based on response type
        const transformedData = transformResponseData(
          queryData.response_type,
          queryData.data
        );
        setData(transformedData);
        onComplete?.(transformedData);
        return true; // Stop polling
      }

      // Check if error
      if (queryData.status === "error") {
        setIsProcessing(false);
        const errorMsg = queryData.error || "Query processing failed";
        setError(errorMsg);
        onError?.(errorMsg);
        return true; // Stop polling
      }

      return false; // Continue polling
    } catch (err) {
      const errorMsg =
        err instanceof ApiError ? err.message : "Failed to fetch query status";
      setError(errorMsg);
      setIsProcessing(false);
      onError?.(errorMsg);
      return true; // Stop polling on error
    }
  }, [onComplete, onError]);

  // Polling effect
  useEffect(() => {
    if (!queryId || !isProcessing || mode !== "polling") return;

    const interval = setInterval(async () => {
      const shouldStop = await pollQueryStatus(queryId);
      if (shouldStop) {
        clearInterval(interval);
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [queryId, isProcessing, mode, pollingInterval, pollQueryStatus]);

  // ============================================================================
  // STREAMING MODE
  // ============================================================================

  const handleStreamingQuery = useCallback((query: string) => {
    setIsProcessing(true);
    setError(null);
    setData(null);
    setProcessingSteps([]);

    const cleanup = api.chat.streamQuery(query, (message) => {
      switch (message.type) {
        case "step_update":
          setProcessingSteps((prev) => {
            const stepIndex = prev.findIndex(
              (s) => s.text === message.payload.description
            );
            if (stepIndex >= 0) {
              // Update existing step
              const newSteps = [...prev];
              newSteps[stepIndex] = {
                text: message.payload.description,
                completed: message.payload.status === "completed",
              };
              return newSteps;
            } else {
              // Add new step
              return [
                ...prev,
                {
                  text: message.payload.description,
                  completed: message.payload.status === "completed",
                },
              ];
            }
          });
          break;

        case "data":
          setResponseType(message.payload.response_type);
          const transformedData = transformResponseData(
            message.payload.response_type,
            message.payload.data
          );
          setData(transformedData);
          break;

        case "complete":
          setIsProcessing(false);
          onComplete?.(data);
          break;

        case "error":
          setIsProcessing(false);
          const errorMsg = message.payload.message || "Query processing failed";
          setError(errorMsg);
          onError?.(errorMsg);
          break;
      }
    });

    return cleanup;
  }, [onComplete, onError, data]);

  // ============================================================================
  // SEND QUERY
  // ============================================================================

  const sendQuery = useCallback(async (query: string) => {
    setIsLoading(true);
    setIsProcessing(true);
    setError(null);
    setData(null);
    setProcessingSteps([]);
    setResponseType(null);

    try {
      if (mode === "streaming") {
        handleStreamingQuery(query);
        setIsLoading(false);
      } else {
        // Polling mode
        const response = await api.chat.sendQuery(query);
        setQueryId(response.data.query_id);
        setIsLoading(false);

        // If already completed (fast response)
        if (response.data.status === "completed") {
          setIsProcessing(false);
          setResponseType(response.data.response_type);
          const transformedData = transformResponseData(
            response.data.response_type,
            response.data.data
          );
          setData(transformedData);
          onComplete?.(transformedData);
        }
      }
    } catch (err) {
      const errorMsg =
        err instanceof ApiError ? err.message : "Failed to send query";
      setError(errorMsg);
      setIsLoading(false);
      setIsProcessing(false);
      onError?.(errorMsg);
    }
  }, [mode, handleStreamingQuery, onComplete, onError]);

  // ============================================================================
  // RESET
  // ============================================================================

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsProcessing(false);
    setError(null);
    setProcessingSteps([]);
    setData(null);
    setResponseType(null);
    setQueryId(null);
  }, []);

  return {
    isLoading,
    isProcessing,
    error,
    processingSteps,
    data,
    responseType,
    sendQuery,
    reset,
  };
}

// ============================================================================
// HELPER: TRANSFORM RESPONSE DATA
// ============================================================================

function transformResponseData(
  responseType: ChatQueryApiResponse["response_type"],
  rawData: any
) {
  switch (responseType) {
    case "case_details":
      return transformCaseDetails(rawData);
    case "operations_brief":
      return transformOperationsBrief(rawData);
    case "email_dispatch":
      return transformEmailDispatch(rawData);
    case "statistics":
    case "general":
    default:
      return rawData;
  }
}
