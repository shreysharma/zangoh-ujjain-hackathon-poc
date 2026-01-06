"use client";

import { useState } from "react";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { TicketHeader } from "@/components/tickets/ticket-header";
import { ChevronDown, Send } from "lucide-react";

type ConversationMode = "Internal Notes" | "Outbound";

interface TicketDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    severity?: string;
    sla?: string;
    status?: string;
  };
}

interface Message {
  id: number;
  role: "agent" | "system" | "user";
  text: string;
  time: string;
  name?: string;
  duration?: string;
}

export default function TicketDetailPage({ params, searchParams }: TicketDetailPageProps) {
  const ticketId = decodeURIComponent(params.id);
  const severity = searchParams?.severity || "High";
  const sla = searchParams?.sla || "ACK Overdue";
  const status = searchParams?.status || "Open";

  const [mode, setMode] = useState<ConversationMode>("Internal Notes");
  const [inputValue, setInputValue] = useState("");
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const [outboundMessages, setOutboundMessages] = useState<Message[]>([]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const newMessage: Message =
      mode === "Internal Notes"
        ? { id: Date.now(), role: "agent", text, time: "Now" }
        : { id: Date.now(), role: "user", name: "You", text, time: "Now", duration: "" };

    if (mode === "Internal Notes") {
      setInternalMessages((prev) => [...prev, newMessage]);
    } else {
      setOutboundMessages((prev) => [...prev, newMessage]);
    }
    setInputValue("");
  };

  const renderInternalMessage = (msg: Message) => {
    const isAgent = msg.role === "agent";
    const bubbleClasses = isAgent
      ? "bg-[#4b6bff] border border-white/20 text-white rounded-2xl rounded-br-sm"
      : "bg-[#3f3f3f] border border-white/15 text-[#e9e8e8] rounded-2xl rounded-bl-sm";

    return (
      <div key={msg.id} className={`flex flex-col gap-1 ${isAgent ? "items-end" : "items-start"}`}>
        <div className={`${bubbleClasses} p-4 shadow-sm max-w-full`}>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
                <circle cx="13" cy="13" r="13" fill={isAgent ? "#6BA4FF" : "#E1E2F8"} />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-white font-medium mr-1">[{isAgent ? "Agent" : "System"}]</span>
              <span className="text-white/90">{msg.text}</span>
            </div>
          </div>
        </div>
        <span className="text-[#797979] text-xs">{msg.time}</span>
      </div>
    );
  };

  const renderOutboundMessage = (msg: Message) => {
    const isUser = msg.role === "user";
    return (
      <div key={msg.id} className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`${
            isUser ? "border border-[#d9d9d9] bg-transparent" : "bg-[#555] border border-[#818181]"
          } rounded-xl p-4 max-w-[492px] w-auto`}
        >
          <div className="flex items-start gap-2 justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full ${
                  isUser ? "bg-gradient-to-br from-orange-300 to-orange-500" : "bg-[#e1e2f8]"
                } flex items-center justify-center flex-shrink-0`}
              />
              <span className={`font-semibold text-sm ${isUser ? "text-[#56ba4f]" : "text-[#6ba4ff]"}`}>
                {msg.name || (isUser ? "User" : "Rakshak")}
              </span>
            </div>
            <span className="text-[#969696] text-sm whitespace-nowrap">{msg.duration || ""}</span>
          </div>
          <p className="text-white text-sm italic">{msg.text}</p>
        </div>
        <span className="text-[#797979] text-xs">{msg.time}</span>
      </div>
    );
  };

  return (
    <DesktopLayout showTopActions={false}>
      <div className="min-h-screen bg-[#262626] flex flex-col gap-2 px-3 md:px-4 pb-4 pt-0 overflow-hidden min-h-0">
        <TicketHeader title="Tickets" />

        <div className="flex-1 bg-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden flex flex-col text-white border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.35)] min-h-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/12">
            <div className="flex items-center gap-5">
              <span className="text-xl font-medium text-white">#{ticketId}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[#d2e8f7] text-[#101012] px-3 py-1 rounded-lg border border-white/30 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#0072E4]" />
                <span className="text-sm">{status}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#f7d2d2] text-[#101012] px-3 py-1 rounded-lg text-sm border border-white/30 shadow-sm">
                <span>Severity:</span>
                <span className="font-semibold">{severity}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#e1e2f8] text-[#3840eb] px-3 py-1 rounded-lg text-sm border border-white/30 shadow-sm">
                <span>SLA:</span>
                <span className="font-semibold">{sla}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left Sidebar */}
            <div className="w-80 flex flex-col gap-4 p-4 overflow-y-auto border-r border-white/10 min-h-0">
              <div className="bg-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-3 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-medium text-white">Case Summary</h3>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] w-20 shrink-0">Reporter:</span>
                    <span className="text-[#f7f7f7] flex-1">—</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] w-20 shrink-0">Person:</span>
                    <span className="text-[#f7f7f7] flex-1">—</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] w-20 shrink-0">Last seen:</span>
                    <span className="text-[#f7f7f7] flex-1">—</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] w-20 shrink-0">Beacon:</span>
                    <span className="text-[#f7f7f7] flex-1">—</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-[#e1e2f8] text-[#3840eb] px-2 py-0.5 rounded-lg text-xs">Lost and Found</div>
                  <div className="bg-[#e1e2f8] text-[#3840eb] px-2 py-0.5 rounded-lg text-xs">Priority</div>
                </div>
              </div>

              <div className="bg-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-3 max-h-60 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <h3 className="text-xl font-medium text-white">Activity Timeline</h3>
                <div className="flex flex-col gap-3 overflow-y-auto text-sm">
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">—</span>
                    <span className="text-[#f7f7f7]">No timeline entries yet.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 border-l border-r border-white/10 flex flex-col min-h-0">
              <div className="p-6 flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-medium text-white">Child Missing</h2>
                  <button
                    type="button"
                    onClick={() => setMode((prev) => (prev === "Internal Notes" ? "Outbound" : "Internal Notes"))}
                    className="bg-[#3a3a3a] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#4a4a4a] transition-colors"
                  >
                    <span className="text-[#e9e8e8] text-sm font-medium">{mode}</span>
                    <ChevronDown size={20} className="text-[#E9E8E8]" strokeWidth={0.833} />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-[#dff7d2] text-[#3840eb] px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 border border-white/30 shadow-sm">
                      <span>Created 19:10 IST</span>
                    </div>
                    <div className="bg-[#dff7d2] text-[#3840eb] px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 border border-white/30 shadow-sm">
                      <span>Portal</span>
                    </div>
                  </div>
                  <div className="text-[#74a9ff] text-xs px-2 py-0.5">Hi/En</div>
                </div>

                <div className="flex-1 flex flex-col overflow-y-auto gap-4 mb-6 min-h-0">
                  <div className="text-center text-[#939393] text-sm mb-2">Today</div>
                  {mode === "Internal Notes"
                    ? internalMessages.map((msg) => renderInternalMessage(msg))
                    : outboundMessages.map((msg) => renderOutboundMessage(msg))}
                </div>

                <div className="bg-[#4b4b4b] rounded-xl p-3 flex items-center gap-3 border border-white/10">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={mode === "Internal Notes" ? "Send internal note" : "Send outbound message"}
                    className="flex-1 bg-transparent border-none outline-none text-[#e9e8e8] placeholder:text-[#bfbfbf]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    className="flex items-center justify-center bg-[#3d5afe] hover:bg-[#3450f0] text-white rounded-lg h-10 w-10 border border-white/20"
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="w-[320px] flex flex-col gap-4 p-6">
              {/* Attachment */}
              <div className="bg-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-3 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <h3 className="text-xl font-medium text-white">Attachment</h3>
                <div className="w-12 h-12 bg-blue-200 rounded overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopLayout>
  );
}
