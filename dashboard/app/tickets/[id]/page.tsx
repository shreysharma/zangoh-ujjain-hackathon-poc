"use client";

import { DesktopLayout } from "@/components/layout/desktop-layout";
import { TicketHeader } from "@/components/tickets/ticket-header";
import { RefreshCcw, ChevronDown, Send, Frown } from "lucide-react";

interface TicketDetailPageProps {
  params: {
    id: string;
  };
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const idParam = decodeURIComponent(params.id);
  const ticketId = idParam.startsWith("#") ? idParam : `#${idParam}`;

  return (
    <DesktopLayout showTopActions={false}>
      <div className="min-h-screen bg-[#262626] flex flex-col gap-2 px-3 md:px-4 pb-4 pt-0 overflow-hidden min-h-0">
        <TicketHeader title="Tickets" />

        <div className="flex-1 bg-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden flex flex-col text-white border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.35)] min-h-0">
          {/* Ticket Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/12">
            <div className="flex items-center gap-5">
              <span className="text-xl font-medium text-white">{ticketId}</span>
              <div className="flex items-center gap-1 bg-[#d2e8f7] text-[#101012] px-3 py-0.5 rounded-lg border border-white/30 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#0072E4]" />
                <span className="text-sm">Open</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">Severity:</span>
                  <div className="bg-[#f7d2d2] text-[#101012] px-3 py-0.5 rounded-lg text-sm border border-white/30 shadow-sm">High</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">SLA:</span>
                  <div className="bg-[#e1e2f8] text-[#3840eb] px-2 py-0.5 rounded-lg text-sm border border-white/30 shadow-sm">ACK Overdue</div>
                </div>
              </div>
            </div>
            <button className="bg-[#f7f7f7] text-[#151518] px-3 py-1 rounded-lg border border-[#151518] flex items-center gap-2 text-sm font-medium">
              Actions
              <span className="text-xs">+</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left Sidebar */}
            <div className="w-80 flex flex-col gap-4 p-4 overflow-y-auto border-r border-white/10 min-h-0">
              {/* Case Summary */}
              <div className="bg-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-3 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-medium text-white">Case Summary</h3>
                  <div className="flex items-center gap-2 text-xs text-[#939393]">
                    <span>45s ago</span>
                    <RefreshCcw size={20} className="text-white/60" />
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] w-20 shrink-0">Reporter:</span>
                    <span className="text-[#f7f7f7] flex-1">Savitri Devi</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] w-20 shrink-0">Person:</span>
                    <span className="text-[#f7f7f7] flex-1">6 y/o boy · blue t-shirt</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] w-20 shrink-0">Last seen:</span>
                    <span className="text-[#f7f7f7] flex-1">Gate 2 – Water Point, ~19:05</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] w-20 shrink-0">Beacon:</span>
                    <span className="text-[#f7f7f7] flex-1">Meet-up beacon available (not set)</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-[#e1e2f8] text-[#3840eb] px-2 py-0.5 rounded-lg text-xs">Lost and Found</div>
                  <div className="bg-[#e1e2f8] text-[#3840eb] px-2 py-0.5 rounded-lg text-xs">High Priority</div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-3 max-h-60 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <h3 className="text-xl font-medium text-white">Activity Timeline</h3>
                <div className="flex flex-col gap-3 overflow-y-auto text-sm">
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:05-</span>
                    <span className="text-[#f7f7f7]">Case {ticketId} created (Hi); profile confirmed.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:05-</span>
                    <span className="text-[#f7f7f7]">LPC DB check: no match.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:06-</span>
                    <span className="text-[#f7f7f7]">Desk A notified (ACK SLA 02:00)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:07-</span>
                    <span className="text-[#f7f7f7]">ACK missed → nudge #1</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:09-</span>
                    <span className="text-[#f7f7f7]">Nudge #2 (WA + radio)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:10-</span>
                    <span className="text-[#f7f7f7]">Agent→Reporter: case active; wait at safe spot; beacon optional.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:11-</span>
                    <span className="text-[#f7f7f7]">Found-stream scan: no match (&lt;0.4)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:12-</span>
                    <span className="text-[#f7f7f7]">Auto-suggest: escalate in 2 min if no ACK.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#74a9ff] whitespace-nowrap">19:13-</span>
                    <span className="text-[#f7f7f7]">ACK overdue +06:12 → Review Needed (Ops)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Content - Chat */}
            <div className="flex-1 border-l border-r border-white/10 flex flex-col min-h-0">
              <div className="p-6 flex flex-col h-full min-h-0">
                {/* Title */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-medium text-white">Child Missing</h2>
                  <div className="bg-[#3a3a3a] px-4 py-2 rounded-xl flex items-center gap-2">
                    <span className="text-[#e9e8e8] text-sm font-medium">Internal Notes</span>
                    <ChevronDown size={20} className="text-[#E9E8E8]" strokeWidth={0.833} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-[#dff7d2] text-[#3840eb] px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 border border-white/30 shadow-sm">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 3V6L8 7M11 6C11 8.76142 8.76142 11 6 11C3.23858 11 1 8.76142 1 6C1 3.23858 3.23858 1 6 1C8.76142 1 11 3.23858 11 6Z" stroke="#3840EB" strokeWidth="0.583333" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Created 19:10 IST</span>
                    </div>
                    <div className="bg-[#dff7d2] text-[#3840eb] px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 border border-white/30 shadow-sm">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.75 10H4M8.5 4.5H8.505M4 3H2.6C2.03995 3 1.75992 3 1.54601 3.10899C1.35785 3.20487 1.20487 3.35785 1.10899 3.54601C1 3.75992 1 4.03995 1 4.6V6.4C1 6.96005 1 7.24008 1.10899 7.45399C1.20487 7.64215 1.35785 7.79513 1.54601 7.89101C1.75992 8 2.03995 8 2.6 8H4M7.6 10H9.4C9.96005 10 10.2401 10 10.454 9.89101C10.6422 9.79513 10.7951 9.64215 10.891 9.45399C11 9.24008 11 8.96005 11 8.4V3.6C11 3.03995 11 2.75992 10.891 2.54601C10.7951 2.35785 10.6422 2.20487 10.454 2.10899C10.2401 2 9.96005 2 9.4 2H7.6C7.03995 2 6.75992 2 6.54601 2.10899C6.35785 2.20487 6.20487 2.35785 6.10899 2.54601C6 2.75992 6 3.03995 6 3.6V8.4C6 8.96005 6 9.24008 6.10899 9.45399C6.20487 9.64215 6.35785 9.79513 6.54601 9.89101C6.75992 10 7.03995 10 7.6 10ZM9 7.5C9 7.77614 8.77614 8 8.5 8C8.22386 8 8 7.77614 8 7.5C8 7.22386 8.22386 7 8.5 7C8.77614 7 9 7.22386 9 7.5Z" stroke="#3840EB" strokeWidth="0.583333" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Portal</span>
                    </div>
                  </div>
                  <div className="text-[#74a9ff] text-xs px-2 py-0.5">Hi/En</div>
                </div>

                {/* Messages */}
                <div className="flex-1 flex flex-col justify-end overflow-y-auto gap-4 mb-6 min-h-0">
                  <div className="text-center text-[#939393] text-sm mb-2">Today</div>
                  
                  {/* Message 1 */}
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#555] border border-white/20 rounded-xl p-4 flex items-start gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#e1e2f8] flex items-center justify-center flex-shrink-0">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <circle cx="13" cy="13" r="13" fill="#E1E2F8"/>
                          <path d="M12.6755 7.24317L13.7685 10.0849C13.9217 10.4832 13.9983 10.6824 14.1174 10.8499C14.223 10.9984 14.3527 11.1281 14.5012 11.2337C14.6687 11.3528 14.8679 11.4294 15.2662 11.5826L18.1079 12.6755L15.2662 13.7685C14.8679 13.9217 14.6687 13.9983 14.5012 14.1174C14.3527 14.223 14.223 14.3527 14.1174 14.5012C13.9983 14.6687 13.9217 14.8679 13.7685 15.2662L12.6755 18.1079L11.5826 15.2662C11.4294 14.8679 11.3528 14.6687 11.2337 14.5012C11.1281 14.3527 10.9984 14.223 10.8499 14.1174C10.6824 13.9983 10.4832 13.9217 10.0849 13.7685L7.24317 12.6755L10.0849 11.5826C10.4832 11.4294 10.6824 11.3528 10.8499 11.2337C10.9984 11.1281 11.1281 10.9984 11.2337 10.8499C11.3528 10.6824 11.4294 10.4832 11.5826 10.0849L12.6755 7.24317Z" fill="#74A9FF"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#6ba4ff] font-medium">[Agent] </span>
                        <span className="text-white">Intake parsed; {ticketId} created; profile confirmed.</span>
                      </div>
                    </div>
                    <span className="text-[#797979] text-xs">19:05</span>
                  </div>

                  {/* Message 2 */}
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#555] border border-white/20 rounded-xl p-4 flex items-start gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#6ba4ff] flex items-center justify-center flex-shrink-0">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <circle cx="13" cy="13" r="13" fill="#6BA4FF"/>
                          <path d="M12.6755 7.24317L13.7685 10.0849C13.9217 10.4832 13.9983 10.6824 14.1174 10.8499C14.223 10.9984 14.3527 11.1281 14.5012 11.2337C14.6687 11.3528 14.8679 11.4294 15.2662 11.5826L18.1079 12.6755L15.2662 13.7685C14.8679 13.9217 14.6687 13.9983 14.5012 14.1174C14.3527 14.223 14.223 14.3527 14.1174 14.5012C13.9983 14.6687 13.9217 14.8679 13.7685 15.2662L12.6755 18.1079L11.5826 15.2662C11.4294 14.8679 11.3528 14.6687 11.2337 14.5012C11.1281 14.3527 10.9984 14.223 10.8499 14.1174C10.6824 13.9983 10.4832 13.9217 10.0849 13.7685L7.24317 12.6755L10.0849 11.5826C10.4832 11.4294 10.6824 11.3528 10.8499 11.2337C10.9984 11.1281 11.1281 10.9984 11.2337 10.8499C11.3528 10.6824 11.4294 10.4832 11.5826 10.0849L12.6755 7.24317Z" fill="#E1E2F8"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#6ba4ff] font-medium">[System] </span>
                        <span className="text-white">LPC DB check → no match.</span>
                      </div>
                    </div>
                    <span className="text-[#797979] text-xs">19:05</span>
                  </div>

                  {/* Message 3 */}
                  <div className="flex flex-col gap-1">
                    <div className="border border-white/25 rounded-xl p-4 flex items-start gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#e5e5e5] flex items-center justify-center flex-shrink-0">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <circle cx="13" cy="13" r="13" fill="#E5E5E5"/>
                          <path d="M12.6755 7.24317L13.7685 10.0849C13.9217 10.4832 13.9983 10.6824 14.1174 10.8499C14.223 10.9984 14.3527 11.1281 14.5012 11.2337C14.6687 11.3528 14.8679 11.4294 15.2662 11.5826L18.1079 12.6755L15.2662 13.7685C14.8679 13.9217 14.6687 13.9983 14.5012 14.1174C14.3527 14.223 14.223 14.3527 14.1174 14.5012C13.9983 14.6687 13.9217 14.8679 13.7685 15.2662L12.6755 18.1079L11.5826 15.2662C11.4294 14.8679 11.3528 14.6687 11.2337 14.5012C11.1281 14.3527 10.9984 14.223 10.8499 14.1174C10.6824 13.9983 10.4832 13.9217 10.0849 13.7685L7.24317 12.6755L10.0849 11.5826C10.4832 11.4294 10.6824 11.3528 10.8499 11.2337C10.9984 11.1281 11.1281 10.9984 11.2337 10.8499C11.3528 10.6824 11.4294 10.4832 11.5826 10.0849L12.6755 7.24317Z" fill="#74A9FF"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#6ba4ff] font-medium">[Agent] </span>
                        <span className="text-[#d5d5d5]">Notifed Lost People Centre – Desk A (ACK SLA 02:00) + photo.</span>
                      </div>
                    </div>
                    <span className="text-[#797979] text-xs">19:06</span>
                  </div>

                  {/* Message 4 */}
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#555] border border-white/20 rounded-xl p-4 flex items-start gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#6ba4ff] flex items-center justify-center flex-shrink-0">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <circle cx="13" cy="13" r="13" fill="#6BA4FF"/>
                          <path d="M12.6755 7.24317L13.7685 10.0849C13.9217 10.4832 13.9983 10.6824 14.1174 10.8499C14.223 10.9984 14.3527 11.1281 14.5012 11.2337C14.6687 11.3528 14.8679 11.4294 15.2662 11.5826L18.1079 12.6755L15.2662 13.7685C14.8679 13.9217 14.6687 13.9983 14.5012 14.1174C14.3527 14.223 14.223 14.3527 14.1174 14.5012C13.9983 14.6687 13.9217 14.8679 13.7685 15.2662L12.6755 18.1079L11.5826 15.2662C11.4294 14.8679 11.3528 14.6687 11.2337 14.5012C11.1281 14.3527 10.9984 14.223 10.8499 14.1174C10.6824 13.9983 10.4832 13.9217 10.0849 13.7685L7.24317 12.6755L10.0849 11.5826C10.4832 11.4294 10.6824 11.3528 10.8499 11.2337C10.9984 11.1281 11.1281 10.9984 11.2337 10.8499C11.3528 10.6824 11.4294 10.4832 11.5826 10.0849L12.6755 7.24317Z" fill="#E1E2F8"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#6ba4ff] font-medium">[System] </span>
                        <span className="text-white">ACK missed → nudge #1; 19:09:32 nudge #2 (WA + radio).</span>
                      </div>
                    </div>
                    <span className="text-[#797979] text-xs">19:08</span>
                  </div>

                  {/* Message 5 */}
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#555] border border-white/20 rounded-xl p-4 flex items-start gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#6ba4ff] flex items-center justify-center flex-shrink-0">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <circle cx="13" cy="13" r="13" fill="#6BA4FF"/>
                          <path d="M12.6755 7.24317L13.7685 10.0849C13.9217 10.4832 13.9983 10.6824 14.1174 10.8499C14.223 10.9984 14.3527 11.1281 14.5012 11.2337C14.6687 11.3528 14.8679 11.4294 15.2662 11.5826L18.1079 12.6755L15.2662 13.7685C14.8679 13.9217 14.6687 13.9983 14.5012 14.1174C14.3527 14.223 14.223 14.3527 14.1174 14.5012C13.9983 14.6687 13.9217 14.8679 13.7685 15.2662L12.6755 18.1079L11.5826 15.2662C11.4294 14.8679 11.3528 14.6687 11.2337 14.5012C11.1281 14.3527 10.9984 14.223 10.8499 14.1174C10.6824 13.9983 10.4832 13.9217 10.0849 13.7685L7.24317 12.6755L10.0849 11.5826C10.4832 11.4294 10.6824 11.3528 10.8499 11.2337C10.9984 11.1281 11.1281 10.9984 11.2337 10.8499C11.3528 10.6824 11.4294 10.4832 11.5826 10.0849L12.6755 7.24317Z" fill="#E1E2F8"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#6ba4ff] font-medium">[System] </span>
                        <span className="text-white">Found-stream scan → no plausible match.</span>
                      </div>
                    </div>
                    <span className="text-[#797979] text-xs">19:11</span>
                  </div>

                  {/* Message 6 */}
                  <div className="flex flex-col gap-1">
                    <div className="border border-white/25 rounded-xl p-4 flex items-start gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#e5e5e5] flex items-center justify-center flex-shrink-0">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <circle cx="13" cy="13" r="13" fill="#E5E5E5"/>
                          <path d="M12.6755 7.24317L13.7685 10.0849C13.9217 10.4832 13.9983 10.6824 14.1174 10.8499C14.223 10.9984 14.3527 11.1281 14.5012 11.2337C14.6687 11.3528 14.8679 11.4294 15.2662 11.5826L18.1079 12.6755L15.2662 13.7685C14.8679 13.9217 14.6687 13.9983 14.5012 14.1174C14.3527 14.223 14.223 14.3527 14.1174 14.5012C13.9983 14.6687 13.9217 14.8679 13.7685 15.2662L12.6755 18.1079L11.5826 15.2662C11.4294 14.8679 11.3528 14.6687 11.2337 14.5012C11.1281 14.3527 10.9984 14.223 10.8499 14.1174C10.6824 13.9983 10.4832 13.9217 10.0849 13.7685L7.24317 12.6755L10.0849 11.5826C10.4832 11.4294 10.6824 11.3528 10.8499 11.2337C10.9984 11.1281 11.1281 10.9984 11.2337 10.8499C11.3528 10.6824 11.4294 10.4832 11.5826 10.0849L12.6755 7.24317Z" fill="#74A9FF"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#6ba4ff] font-medium">[Agent] </span>
                        <span className="text-[#d5d5d5]">Auto-suggest: escalate in 2 min if no ACK.</span>
                      </div>
                    </div>
                    <span className="text-[#797979] text-xs">19:12</span>
                  </div>

                  {/* Message 7 */}
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#555] border border-white/20 rounded-xl p-4 flex items-start gap-2 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#6ba4ff] flex items-center justify-center flex-shrink-0">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                          <circle cx="13" cy="13" r="13" fill="#6BA4FF"/>
                          <path d="M12.6755 7.24317L13.7685 10.0849C13.9217 10.4832 13.9983 10.6824 14.1174 10.8499C14.223 10.9984 14.3527 11.1281 14.5012 11.2337C14.6687 11.3528 14.8679 11.4294 15.2662 11.5826L18.1079 12.6755L15.2662 13.7685C14.8679 13.9217 14.6687 13.9983 14.5012 14.1174C14.3527 14.223 14.223 14.3527 14.1174 14.5012C13.9983 14.6687 13.9217 14.8679 13.7685 15.2662L12.6755 18.1079L11.5826 15.2662C11.4294 14.8679 11.3528 14.6687 11.2337 14.5012C11.1281 14.3527 10.9984 14.223 10.8499 14.1174C10.6824 13.9983 10.4832 13.9217 10.0849 13.7685L7.24317 12.6755L10.0849 11.5826C10.4832 11.4294 10.6824 11.3528 10.8499 11.2337C10.9984 11.1281 11.1281 10.9984 11.2337 10.8499C11.3528 10.6824 11.4294 10.4832 11.5826 10.0849L12.6755 7.24317Z" fill="#E1E2F8"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[#6ba4ff] font-medium">[System] </span>
                        <span className="text-white">ACK overdue +06:12 → Review Needed (Ops)</span>
                      </div>
                    </div>
                    <span className="text-[#797979] text-xs">19:13</span>
                  </div>
                </div>

                {/* Input */}
                <div className="bg-[#555] rounded-xl p-4 flex items-center gap-2">
                  <span className="flex-1 text-[#e9e8e8]">Send internal note</span>
                  <Send size={24} className="text-[#E9E8E8]" />
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-[320px] flex flex-col gap-4 p-6">
              {/* Map/Chart removed */}
              {/* CSAT removed */}
              {/* Attachment */}
              <div className="bg-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-3">
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
