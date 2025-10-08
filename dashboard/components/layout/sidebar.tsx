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
          "fixed top-4 bottom-4 bg-white/[0.03] backdrop-blur-sm rounded-xl p-6 flex flex-col gap-10 transition-all duration-300 z-40",
          // Desktop
          "lg:left-4",
          isCollapsed ? "lg:w-[72px]" : "lg:w-[224px]",
          // Mobile/Tablet
          "left-4 right-4",
          "lg:right-auto",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-[calc(100%+1rem)] lg:translate-x-0"
        )}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-primary-orange font-semibold text-lg">
              Sanrakshak
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/60 hover:text-white transition-colors ml-auto hidden lg:block"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-5 h-5" />
            ) : (
              <ChevronsLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* New Chat Button */}
        <Link
          href="/"
          onClick={() => {
            setIsMobileMenuOpen(false);
            // Refresh sessions list when starting new chat
            loadSessions();
          }}
          className={cn(
            "flex items-center gap-3 px-2 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors",
            isCollapsed && "lg:justify-center lg:px-0"
          )}
          title={isCollapsed ? "New Chat" : ""}
        >
          <PenSquare className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>New Chat</span>}
        </Link>

        {/* Chat Logs */}
        <nav className="flex-1 flex flex-col gap-2 mt-0 overflow-y-auto">
          {!isCollapsed && chatLogs.length === 0 ? (
            <p className="px-4 py-3 text-sm text-white/40">No chat history</p>
          ) : (
            chatLogs.map((log) => {
              const isActive = pathname === log.href;
              const isMenuOpen = openMenuId === log.id;

              return (
                <div
                  key={log.href}
                  className={cn(
                    "relative group rounded-lg border-l-2 transition-colors",
                    isActive
                      ? "bg-white/10 border-primary-orange"
                      : "border-transparent hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Link
                      href={log.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex-1 min-w-0 text-sm font-medium transition-colors py-3",
                        isCollapsed ? "lg:px-2 px-4" : "pl-4 pr-1",
                        isActive ? "text-white" : "text-white/60 hover:text-white"
                      )}
                      title={log.title}
                    >
                      <span className="truncate block">
                        {isCollapsed ? log.title.substring(0, 3) : log.title}
                      </span>
                    </Link>

                    {/* Three-dot menu button */}
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
                            "p-1 rounded-md hover:bg-white/20 transition-all",
                            isMenuOpen && "bg-white/10"
                          )}
                          aria-label="Session options"
                        >
                          <MoreVertical className="w-4 h-4 text-white" />
                        </button>

                        {/* Dropdown menu */}
                        {isMenuOpen && (
                          <>
                            {/* Backdrop to close menu */}
                            <div
                              className="fixed inset-0 z-[100]"
                              onClick={() => setOpenMenuId(null)}
                            />

                            {/* Menu */}
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
        </nav>

        {/* Bottom Navigation */}
        <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
          {bottomItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors",
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
      </aside>
    </>
  );
}
