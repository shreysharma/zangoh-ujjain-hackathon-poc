"use client";

import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { sanitizeInput, validateInput } from "@/lib/utils";
import { useAdminChat } from "@/hooks/use-admin-chat";
import { useAdminSessions } from "@/hooks/use-admin-sessions";
import { MessageRenderer } from "@/components/chat/message-renderer";
import { api } from "@/lib/api-client";
import { TEAM_CONTACTS } from "@/lib/team-config";

interface PageParams {
  id: string;
  [key: string]: string;
}

export default function ChatPage() {
  const params = useParams<PageParams>();
  const router = useRouter();
  const chatId = params.id;
  const [input, setInput] = useState("");
  const hasLoadedSession = useRef(false);
  const hasProcessedInitialQuery = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the admin chat hook with session management
  const {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    loadSessionHistory,
    addMessage,
    sources,
  } = useAdminChat({
    sessionId: chatId,
    onMessageReceived: (response, newSessionId) => {
      console.log("Message received:", response);
      console.log("Session ID:", newSessionId);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Update URL when backend returns the real session ID
  useEffect(() => {
    if (sessionId && sessionId !== chatId) {
      // Replace the URL with the real session ID from backend
      router.replace(`/chat/${sessionId}`);
    }
  }, [sessionId, chatId, router]);

  // Session management hook for loading history
  const { loadSession } = useAdminSessions();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // Load existing session history if opening an existing chat
  useEffect(() => {
    const loadExistingSession = async () => {
      // Only load once per chatId
      if (hasLoadedSession.current) return;

      // Check if this is an existing session (UUID format or timestamp)
      if (chatId && chatId !== "new") {
        hasLoadedSession.current = true;
        setIsLoadingHistory(true);

        try {
          console.log(`[Chat] Loading session history for: ${chatId}`);
          const sessionDetail = await loadSession(chatId);

          if (sessionDetail && sessionDetail.messages && sessionDetail.messages.length > 0) {
            console.log(`[Chat] Loaded ${sessionDetail.messages.length} messages`);
            // Load the session history into the chat
            loadSessionHistory(sessionDetail.messages);
          } else {
            console.log("[Chat] No messages found in session");
          }
        } catch (error) {
          console.error("Failed to load session history:", error);
        } finally {
          setIsLoadingHistory(false);
        }
      }
    };

    loadExistingSession();
  }, [chatId, loadSession, loadSessionHistory]);

  // Reset state and clear messages when chatId changes
  useEffect(() => {
    console.log(`[Chat] ChatId changed to: ${chatId}`);
    hasLoadedSession.current = false;
    hasProcessedInitialQuery.current = false;
  }, [chatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load initial query from session storage and send it
  useEffect(() => {
    const processInitialQuery = async () => {
      // Only process once and only after loading history is complete
      if (hasProcessedInitialQuery.current || isLoadingHistory) return;

      const initialQuery = sessionStorage.getItem("initialQuery");
      if (initialQuery && messages.length === 0) {
        hasProcessedInitialQuery.current = true;
        const sanitized = sanitizeInput(initialQuery);
        sessionStorage.removeItem("initialQuery");

        console.log("[Chat] Sending initial query:", sanitized);
        // Send the initial query to the backend
        await sendMessage(sanitized);
      }
    };

    processInitialQuery();
  }, [messages.length, sendMessage, isLoadingHistory]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = validateInput(input);
    if (!validation.isValid) {
      return;
    }

    // Sanitize input before sending
    const sanitized = sanitizeInput(input);

    // Clear input
    setInput("");

    // Send message to backend
    await sendMessage(sanitized);
  };

  // Handle "Email to Teams" action
  const handleEmailToTeams = async (briefData: any) => {
    setEmailSending(true);
    try {
      // Transform brief data to email format
      const emailSubject = briefData.title || "Operations Brief";
      const emailBody = generateEmailBody(briefData);

      // Use the static team contacts configuration
      const response = await api.email.sendEmail({
        Subject: emailSubject,
        Body: emailBody,
        EmailList: TEAM_CONTACTS,
      });

      // Add the email dispatch response as a new message in the chat
      // This will be displayed by MessageRenderer using the email_dispatch metadata
      const emailMessage = {
        role: "assistant" as const,
        content: response.response || `Sent ${response.EmailList?.filter((r: any) => r.success).length || 0}/${response.EmailList?.length || 0} emails successfully`,
        timestamp: new Date().toISOString(),
        metadata: {
          email_dispatch: response,
        },
      };

      // Add message to chat using the hook method
      addMessage(emailMessage);
    } catch (error) {
      console.error("Failed to send email:", error);
      await sendMessage("Failed to send emails to teams. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  // Generate HTML email body from brief data
  const generateEmailBody = (briefData: any): string => {
    let html = `<h2>${briefData.title}</h2>`;
    html += `<p><strong>Date:</strong> ${briefData.date} | <strong>Time:</strong> ${briefData.time}</p>`;
    html += `<p><strong>From:</strong> ${briefData.from} | <strong>To:</strong> ${briefData.to}</p>`;
    html += `<p><strong>Weather:</strong> ${briefData.weather}</p><hr>`;

    if (briefData.sections.crowdOutlook) {
      html += `<h3>Crowd Outlook</h3><ul>`;
      briefData.sections.crowdOutlook.forEach((item: string) => {
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
    }

    if (briefData.sections.logisticsControl) {
      html += `<h3>Logistics & Control</h3><ul>`;
      briefData.sections.logisticsControl.forEach((item: string) => {
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
    }

    if (briefData.sections.lostFound) {
      html += `<h3>Lost & Found</h3><ul>`;
      briefData.sections.lostFound.forEach((item: string) => {
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
    }

    if (briefData.sections.safetyReadiness) {
      html += `<h3>Safety & Readiness</h3><ul>`;
      briefData.sections.safetyReadiness.forEach((item: string) => {
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
    }

    if (briefData.sections.teamTasks) {
      html += `<h3>Team Tasks</h3><ul>`;
      briefData.sections.teamTasks.forEach((item: string) => {
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
    }

    return html;
  };

  return (
    <DesktopLayout>
      <div className="flex flex-col h-screen pt-20 pb-6">
        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 mb-6">
          <div className="max-w-[900px] mx-auto space-y-4">
            {isLoadingHistory && (
              <div className="flex justify-center items-center py-8">
                <div className="text-white/60 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span>Loading conversation history...</span>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[700px] px-4 md:px-6 py-3 md:py-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-[#3A3939] text-white"
                      : "bg-transparent text-white"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="font-switzer text-sm md:text-lg leading-relaxed whitespace-pre-line">
                      {message.content}
                    </p>
                  ) : (
                    <MessageRenderer
                      message={message}
                      onEmailToTeams={handleEmailToTeams}
                    />
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[90%] md:max-w-[700px] space-y-2 md:space-y-3 text-white/60 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span>Processing your query...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                    <span>Searching through knowledge base...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                    <span>Generating response...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Show sources if available */}
            {sources && sources.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[90%] md:max-w-[700px] px-4 md:px-6 py-3 md:py-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-white/80 font-semibold text-xs md:text-sm mb-2">
                    Sources
                  </h4>
                  <div className="space-y-2">
                    {sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="text-white/60 text-xs md:text-sm"
                      >
                        <p className="font-medium">{source.title}</p>
                        <p className="text-white/40 text-xs line-clamp-2">
                          {source.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar - Fixed at bottom */}
        <div className="px-4 md:px-6">
          <div className="max-w-[900px] mx-auto">
            {error && (
              <div className="mb-3 px-3 md:px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs md:text-sm">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-[#3A3A3A] rounded-lg md:rounded-xl px-3 md:px-6 py-3 md:py-4 border border-white/10">
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                  <Plus className="w-4 h-4 md:w-5 md:h-5 text-white flex-shrink-0" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a follow up"
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-white font-switzer text-sm md:text-lg leading-relaxed placeholder:text-[#BDBDBD] disabled:opacity-50"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-primary-orange hover:bg-primary-orange/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 md:px-8 py-2.5 rounded-lg font-medium text-sm md:text-base flex-shrink-0 w-full sm:w-auto"
                >
                  {isLoading ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DesktopLayout>
  );
}
