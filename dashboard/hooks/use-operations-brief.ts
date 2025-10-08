/**
 * useOperationsBrief Hook
 *
 * React hook for fetching and managing operations brief data.
 */

import { useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { transformOperationsBrief } from "@/lib/api-transformers";

interface UseOperationsBriefResult {
  brief: any | null;
  isLoading: boolean;
  error: string | null;
  fetchTodaysBrief: () => Promise<void>;
  fetchBriefById: (briefId: string) => Promise<void>;
  generateBrief: (date: string) => Promise<void>;
}

export function useOperationsBrief(): UseOperationsBriefResult {
  const [brief, setBrief] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaysBrief = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.operationsBrief.getTodaysBrief();
      const transformedBrief = transformOperationsBrief(response.data);
      setBrief(transformedBrief);
    } catch (err) {
      const errorMsg =
        err instanceof ApiError ? err.message : "Failed to fetch brief";
      setError(errorMsg);
      console.error("Failed to fetch today's brief:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBriefById = useCallback(async (briefId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.operationsBrief.getBriefById(briefId);
      const transformedBrief = transformOperationsBrief(response.data);
      setBrief(transformedBrief);
    } catch (err) {
      const errorMsg =
        err instanceof ApiError ? err.message : "Failed to fetch brief";
      setError(errorMsg);
      console.error(`Failed to fetch brief ${briefId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateBrief = useCallback(async (date: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.operationsBrief.generateBrief(date);
      const transformedBrief = transformOperationsBrief(response.data);
      setBrief(transformedBrief);
    } catch (err) {
      const errorMsg =
        err instanceof ApiError ? err.message : "Failed to generate brief";
      setError(errorMsg);
      console.error(`Failed to generate brief for ${date}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    brief,
    isLoading,
    error,
    fetchTodaysBrief,
    fetchBriefById,
    generateBrief,
  };
}
