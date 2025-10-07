"use client";

import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load initial message from localStorage or URL state
  useEffect(() => {
    const stored = localStorage.getItem(`chat-${chatId}`);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      // Get initial query from session storage
      const initialQuery = sessionStorage.getItem("initialQuery");
      if (initialQuery) {
        const userMessage: Message = {
          id: Date.now().toString(),
          text: initialQuery,
          sender: "user",
          timestamp: new Date(),
        };
        setMessages([userMessage]);
        sessionStorage.removeItem("initialQuery");

        // Simulate AI response
        setTimeout(() => {
          handleAIResponse(initialQuery);
        }, 1500);
      }
    }
  }, [chatId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat-${chatId}`, JSON.stringify(messages));
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
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    handleAIResponse(input);
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
