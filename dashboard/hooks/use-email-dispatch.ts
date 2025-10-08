/**
 * useEmailDispatch Hook
 *
 * React hook for sending bulk emails using the new /sendemail endpoint.
 * No polling needed - response is immediate with all statuses.
 */

import { useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { transformSendEmailResponse } from "@/lib/api-transformers";
import type { SendEmailRequest } from "@/types/api";

interface EmailRecipient {
  email: string;
  zone: string;
}

interface UseEmailDispatchResult {
  dispatch: any | null;
  isLoading: boolean;
  error: string | null;
  successCount: number;
  totalCount: number;
  sendEmail: (params: {
    subject: string;
    body: string;
    recipients: EmailRecipient[];
  }) => Promise<void>;
  reset: () => void;
}

export function useEmailDispatch(): UseEmailDispatchResult {
  const [dispatch, setDispatch] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Send email using new /sendemail endpoint
  const sendEmail = useCallback(
    async (params: {
      subject: string;
      body: string;
      recipients: EmailRecipient[];
    }) => {
      setIsLoading(true);
      setError(null);
      setDispatch(null);

      try {
        const request: SendEmailRequest = {
          Subject: params.subject,
          Body: params.body,
          EmailList: params.recipients,
        };

        const response = await api.email.sendEmail(request);
        const transformedDispatch = transformSendEmailResponse(response);

        setDispatch(transformedDispatch);
        setSuccessCount(transformedDispatch.successCount);
        setTotalCount(transformedDispatch.totalCount);
      } catch (err) {
        const errorMsg =
          err instanceof ApiError ? err.message : "Failed to send emails";
        setError(errorMsg);
        console.error("Failed to send emails:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Reset state
  const reset = useCallback(() => {
    setDispatch(null);
    setIsLoading(false);
    setError(null);
    setSuccessCount(0);
    setTotalCount(0);
  }, []);

  return {
    dispatch,
    isLoading,
    error,
    successCount,
    totalCount,
    sendEmail,
    reset,
  };
}
