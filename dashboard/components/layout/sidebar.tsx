"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  LogOut,
  PenSquare,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminSessions } from "@/hooks/use-admin-sessions";

interface ChatLog {
  id: string;
  title: string;
  href: string;
}

const TicketsIcon = () => (
  <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[17px] h-[14px]">
    <path
      d="M15.7002 6.53353L5.7002 6.53353M15.7002 1.53353L5.7002 1.53353M15.7002 11.5335L5.7002 11.5335M2.36686 6.53353C2.36686 6.99377 1.99377 7.36686 1.53353 7.36686C1.07329 7.36686 0.700195 6.99377 0.700195 6.53353C0.700195 6.07329 1.07329 5.7002 1.53353 5.7002C1.99377 5.7002 2.36686 6.07329 2.36686 6.53353ZM2.36686 1.53353C2.36686 1.99377 1.99377 2.36686 1.53353 2.36686C1.07329 2.36686 0.700195 1.99377 0.700195 1.53353C0.700195 1.07329 1.07329 0.700195 1.53353 0.700195C1.99377 0.700195 2.36686 1.07329 2.36686 1.53353ZM2.36686 11.5335C2.36686 11.9938 1.99377 12.3669 1.53353 12.3669C1.07329 12.3669 0.700195 11.9938 0.700195 11.5335C0.700195 11.0733 1.07329 10.7002 1.53353 10.7002C1.99377 10.7002 2.36686 11.0733 2.36686 11.5335Z"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopilotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path
      d="M6.31017 17.5C7.4225 16.9665 8.6753 16.6667 10.0003 16.6667C11.3254 16.6667 12.5782 16.9665 13.6905 17.5M5.66699 14.1667H14.3337C15.7338 14.1667 16.4339 14.1667 16.9686 13.8942C17.439 13.6545 17.8215 13.272 18.0612 12.8016C18.3337 12.2669 18.3337 11.5668 18.3337 10.1667V6.5C18.3337 5.09987 18.3337 4.3998 18.0612 3.86502C17.8215 3.39462 17.439 3.01217 16.9686 2.77248C16.4339 2.5 15.7338 2.5 14.3337 2.5H5.66699C4.26686 2.5 3.5668 2.5 3.03202 2.77248C2.56161 3.01217 2.17916 3.39462 1.93948 3.86502C1.66699 4.3998 1.66699 5.09987 1.66699 6.5V10.1667C1.66699 11.5668 1.66699 12.2669 1.93948 12.8016C2.17916 13.272 2.56161 13.6545 3.03202 13.8942C3.5668 14.1667 4.26686 14.1667 5.66699 14.1667Z"
      stroke="#FFFAF4"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BrandSquareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path
      d="M6.7002 0.700195V18.7002M5.5002 0.700195H13.9002C15.5804 0.700195 16.4204 0.700195 17.0622 1.02718C17.6267 1.3148 18.0856 1.77374 18.3732 2.33822C18.7002 2.97996 18.7002 3.82004 18.7002 5.5002V13.9002C18.7002 15.5804 18.7002 16.4204 18.3732 17.0622C18.0856 17.6267 17.6267 18.0856 17.0622 18.3732C16.4204 18.7002 15.5804 18.7002 13.9002 18.7002H5.5002C3.82004 18.7002 2.97996 18.7002 2.33822 18.3732C1.77374 18.0856 1.3148 17.6267 1.02718 17.0622C0.700195 16.4204 0.700195 15.5804 0.700195 13.9002V5.5002C0.700195 3.82004 0.700195 2.97996 1.02718 2.33822C1.3148 1.77374 1.77374 1.3148 2.33822 1.02718C2.97996 0.700195 3.82004 0.700195 5.5002 0.700195Z"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const bottomItems = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Log Out",
    href: "/logout",
    icon: LogOut,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [chatLogs, setChatLogs] = React.useState<ChatLog[]>([]);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = React.useState(() => pathname.startsWith("/chat"));
  const isTicketsActive = pathname.startsWith("/tickets");
  const isCopilotActive = pathname.startsWith("/chat");
  const isCopilotHighlighted = isCopilotActive || isCopilotOpen;

  // Fetch sessions from backend (memoize options to prevent re-renders)
  const sessionsOptions = React.useMemo(() => ({ autoLoad: true }), []);
  const { sessions, loadSessions, deleteSession } = useAdminSessions(sessionsOptions);

  // Handle delete session
  const handleDeleteSession = React.useCallback(async (sessionId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteSession(sessionId);

      // If we're currently viewing this session, redirect to home
      if (pathname === `/chat/${sessionId}`) {
        router.push('/');
      }

      // Close the menu
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  }, [deleteSession, pathname, router]);

  // Convert backend sessions to chat logs format
  React.useEffect(() => {
    if (sessions && sessions.length > 0) {
      // Sort by updated_at (most recent first)
      const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = new Date(a.updated_at || 0).getTime();
        const dateB = new Date(b.updated_at || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      const logs: ChatLog[] = sortedSessions.map((session) => ({
        id: session.session_id,
        title: session.first_message || session.session_id,
        href: `/chat/${session.session_id}`,
      }));
      setChatLogs(logs.slice(0, 10)); // Show only last 10 chats
    } else {
      setChatLogs([]);
    }
  }, [sessions]);

  // Refresh sessions when navigating back to home or when manually triggered
  // Removed automatic polling to reduce unnecessary API calls

  // Close menu when pathname changes
  React.useEffect(() => {
    setOpenMenuId(null);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white/[0.03] backdrop-blur-sm rounded-lg p-3 text-white hover:bg-white/5 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-4 bottom-4 z-40",
          // Desktop
          "lg:left-4",
          isCollapsed ? "lg:w-[80px]" : "lg:w-[224px] lg:min-w-[224px] lg:max-w-[280px]",
          // Mobile/Tablet
          "left-4 right-4",
          "lg:right-auto",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-[calc(100%+1rem)] lg:translate-x-0"
        )}
      >
        <div className="p-[1.5px] rounded-2xl bg-gradient-to-b from-white/40 to-white/10 h-full">
          <div className="h-full rounded-[18px] bg-[#2d2d2d] px-4 py-6 flex flex-col gap-10 transition-all duration-300">
            <div className="flex-1 flex flex-col gap-10 mx-auto w-full max-w-[192px]">
              {/* Logo/Brand */}
              <div className="flex items-center justify-between gap-[46px]">
                {!isCollapsed && (
                  <h2 className="text-primary-orange font-medium text-[22px] leading-[150%] tracking-[-0.011em]">
                    Sanrakshak
                  </h2>
                )}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-white/60 hover:text-white transition-colors ml-auto hidden lg:block"
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <BrandSquareIcon />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-10">
                <div className="flex flex-col gap-5">
                  {/* Tickets */}
                  <Link
                    href="/tickets"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      isTicketsActive
                        ? "bg-[rgba(255,250,244,0.21)] text-white"
                        : "text-white/90 hover:bg-white/5",
                      isCollapsed && "lg:justify-center lg:px-0"
                    )}
                    title={isCollapsed ? "Tickets" : ""}
                  >
                    <TicketsIcon />
                    {!isCollapsed && <span>Tickets</span>}
                  </Link>

                  {/* Admin Copilot */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCopilotOpen((open) => !open)}
                      className={cn(
                        "flex items-center justify-between w-full rounded-xl px-4 py-3 transition-colors",
                        isCopilotHighlighted ? "bg-[rgba(255,250,244,0.21)]" : "hover:bg-white/5",
                        isCollapsed && "lg:justify-center lg:px-2"
                      )}
                      aria-expanded={isCopilotOpen}
                    >
                      <div className="flex items-center gap-3">
                        <CopilotIcon />
                        {!isCollapsed && (
                          <span className="text-base font-medium text-white">Admin Copilot</span>
                        )}
                      </div>
                      {!isCollapsed && (
                        isCopilotOpen ? (
                          <ChevronUp className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white" />
                        )
                      )}
                    </button>

                    {isCopilotOpen && (
                      <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                        <Link
                          href="/"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            loadSessions();
                          }}
                          className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-lg text-base font-normal text-white/80 hover:bg-white/5 transition-colors",
                            isCollapsed && "lg:justify-center lg:px-0"
                          )}
                          title={isCollapsed ? "New Chat" : ""}
                        >
                          <PenSquare className="w-5 h-5 flex-shrink-0 text-white/70" />
                          {!isCollapsed && <span>New Chat</span>}
                        </Link>

                        {!isCollapsed && chatLogs.length === 0 ? (
                          <p className="px-4 py-1 text-sm text-white/40">No chat history</p>
                        ) : (
                          chatLogs.map((log) => {
                            const isActive = pathname === log.href;
                            const isMenuOpen = openMenuId === log.id;

                            return (
                              <div
                                key={log.href}
                                className={cn(
                                  "relative group rounded-lg transition-colors",
                                  isActive ? "bg-[rgba(255,250,244,0.21)]" : "hover:bg-white/5"
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <Link
                                    href={log.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                      "flex-1 min-w-0 text-sm font-medium transition-colors py-3",
                                      isCollapsed ? "lg:px-2 px-4" : "pl-4 pr-1",
                                      isActive ? "text-white" : "text-white/70 hover:text-white"
                                    )}
                                    title={log.title}
                                  >
                                    <span className="truncate block">
                                      {isCollapsed ? log.title.substring(0, 3) : log.title}
                                    </span>
                                  </Link>

                                  {!isCollapsed && (
                                    <div className="flex-shrink-0 pr-2 py-3 relative">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOpenMenuId(isMenuOpen ? null : log.id);
                                        }}
                                        className={cn(
                                          "p-1 rounded-md hover:bg-white/15 transition-all",
                                          isMenuOpen && "bg-white/10"
                                        )}
                                        aria-label="Session options"
                                      >
                                        <MoreVertical className="w-4 h-4 text-white" />
                                      </button>

                                      {isMenuOpen && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-[100]"
                                            onClick={() => setOpenMenuId(null)}
                                          />

                                          <div className="absolute right-0 top-full mt-1 z-[101] bg-[#1A1A1A] border border-white/20 rounded-md shadow-xl overflow-hidden min-w-[140px]">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteSession(log.id, log.title);
                                              }}
                                              className="w-full flex items-center justify-start gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                                            >
                                              <Trash2 className="w-4 h-4 flex-shrink-0" />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="mt-auto mx-auto w-full max-w-[192px]">
              <div className="flex flex-col gap-2">
                {bottomItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg text-base font-medium text-white hover:bg-white/5 transition-colors",
                        isCollapsed ? "lg:px-2 lg:py-3 lg:justify-center px-4 py-3" : "px-4 py-3"
                      )}
                      title={isCollapsed ? item.title : ""}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
