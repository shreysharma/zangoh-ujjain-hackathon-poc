"use client";

import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { sanitizeInput, validateInput } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface PageParams {
  id: string;
  [key: string]: string;
}

export default function ChatPage() {
  const params = useParams<PageParams>();
  const chatId = params.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial message from localStorage or URL state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`chat-${chatId}`);
      if (stored) {
        const parsedMessages = JSON.parse(stored);
        // Sanitize loaded messages
        const sanitizedMessages = parsedMessages.map((msg: Message) => ({
          ...msg,
          text: sanitizeInput(msg.text),
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(sanitizedMessages);
      } else {
        // Get initial query from session storage
        const initialQuery = sessionStorage.getItem("initialQuery");
        if (initialQuery) {
          const sanitized = sanitizeInput(initialQuery);
          const userMessage: Message = {
            id: Date.now().toString(),
            text: sanitized,
            sender: "user",
            timestamp: new Date(),
          };
          setMessages([userMessage]);
          sessionStorage.removeItem("initialQuery");

          // Simulate AI response
          setTimeout(() => {
            handleAIResponse(sanitized);
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
      setError("Failed to load chat history");
    }
  }, [chatId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`chat-${chatId}`, JSON.stringify(messages));
      } catch (err) {
        console.error("Error saving chat messages:", err);
        setError("Failed to save chat");
      }
    }
  }, [messages, chatId]);

  const handleAIResponse = (query: string) => {
    setIsLoading(true);

    // Simulate AI response based on query
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: generateAIResponse(query),
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const generateAIResponse = (query: string): string => {
    // Simple response generator based on keywords
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("lost") || lowerQuery.includes("found") || lowerQuery.includes("case")) {
      return "Based on the records, pilgrim Rajesh Kumar reported a lost item case this morning at 8:30 AM near Gate 3. The item is a brown leather wallet containing identification documents. Current status: Under investigation. The item has been logged into the lost & found database with case ID #LF-2025-1007.";
    } else if (lowerQuery.includes("crowd") || lowerQuery.includes("flow")) {
      return "Current crowd density analysis:\n\n• Gate 1: High (85% capacity)\n• Gate 2: Moderate (62% capacity)\n• Gate 3: Low (34% capacity)\n\nRecommendation: Direct incoming pilgrims to Gate 3 for faster entry. Predicted wait times: Gate 1 (45 min), Gate 2 (25 min), Gate 3 (10 min).";
    } else if (lowerQuery.includes("briefing") || lowerQuery.includes("daily")) {
      return "Daily Briefing - October 7, 2025:\n\n📊 Total Pilgrims: 45,234\n🚨 Active Alerts: 3 (2 minor, 1 resolved)\n🏥 Medical Assistance: 12 cases (all attended)\n🔍 Lost & Found: 8 new cases, 5 resolved\n👮 Security Personnel: 156 on duty\n\nKey Updates: Increased crowd expected between 10 AM - 2 PM. Extra medical teams deployed at main darshan area.";
    } else {
      return "I'm Sanrakshak, your admin assistant. I can help you with:\n\n• Lost and found case details\n• Crowd flow insights and analytics\n• Daily briefings and reports\n• Security alerts and notifications\n• Pilgrim management information\n\nWhat would you like to know?";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = validateInput(input);
    if (!validation.isValid) {
      setError(validation.error || "Invalid input");
      return;
    }

    // Clear any previous errors
    setError(null);

    // Sanitize input before storing
    const sanitized = sanitizeInput(input);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitized,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    handleAIResponse(sanitized);
  };

  return (
    <DesktopLayout>
      <div className="flex flex-col h-screen pt-20 pb-6">
        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 mb-6">
          <div className="max-w-[900px] mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[700px] px-6 py-4 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-[#3A3939] text-white"
                      : "bg-transparent text-white"
                  }`}
                >
                  <p className="font-switzer text-[18px] leading-[29.85px] whitespace-pre-line">
                    {message.text}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[700px] space-y-3 text-white/60 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span>Scanning Lost & Found records for "Aarav Sharma"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full" />
                    <span>Matching child profile and description</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/40 rounded-full" />
                    <span>Checking last-seen data — Gate 1, Mahakaleshwar Temple</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Bar - Fixed at bottom */}
        <div className="px-6">
          <div className="max-w-[900px] mx-auto">
            {error && (
              <div className="mb-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-4 bg-[#3A3A3A] rounded-xl px-6 py-4 border border-white/10">
                <Plus className="w-5 h-5 text-white flex-shrink-0" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a follow up"
                  className="flex-1 bg-transparent border-none outline-none text-white font-switzer text-[18px] leading-[29.85px] placeholder:text-[#BDBDBD]"
                />
                <Button
                  type="submit"
                  className="bg-primary-orange hover:bg-primary-orange/90 text-white px-8 py-2.5 rounded-lg font-medium text-base flex-shrink-0"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DesktopLayout>
  );
}
