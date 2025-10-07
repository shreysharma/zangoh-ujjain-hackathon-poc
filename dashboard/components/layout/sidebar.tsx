"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  LogOut,
  PenSquare,
  ChevronsLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [chatLogs, setChatLogs] = React.useState<ChatLog[]>([]);

  // Load chat logs from localStorage
  React.useEffect(() => {
    const loadChatLogs = () => {
      const logs: ChatLog[] = [];
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("chat-")) {
          const chatId = key.replace("chat-", "");
          const messages = JSON.parse(localStorage.getItem(key) || "[]");
          if (messages.length > 0) {
            // Use first user message as title
            const firstUserMessage = messages.find((m: any) => m.sender === "user");
            logs.push({
              id: chatId,
              title: firstUserMessage?.text.substring(0, 30) + "..." || `Chat ${chatId}`,
              href: `/chat/${chatId}`,
            });
          }
        }
      });
      // Sort by ID (timestamp) descending
      logs.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      setChatLogs(logs.slice(0, 10)); // Show only last 10 chats
    };

    loadChatLogs();

    // Listen for storage changes
    const handleStorageChange = () => loadChatLogs();
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically in case of same-tab updates
    const interval = setInterval(loadChatLogs, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [pathname]); // Reload when pathname changes

  return (
    <aside className="fixed left-0 top-0 h-screen w-[224px] bg-white/[0.03] backdrop-blur-sm rounded-xl m-4 p-6 flex flex-col gap-10">
      {/* Logo/Brand */}
      <div className="flex items-center justify-between">
        <h2 className="text-primary-orange font-semibold text-lg">Sanrakshak</h2>
        <button className="text-white/60 hover:text-white transition-colors">
          <ChevronsLeft className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <Link
        href="/"
        className="flex items-center gap-3 px-2 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors"
      >
        <PenSquare className="w-5 h-5" />
        <span>New Chat</span>
      </Link>

      {/* Chat Logs */}
      <nav className="flex-1 flex flex-col gap-2 mt-0 overflow-y-auto">
        {chatLogs.length === 0 ? (
          <p className="px-4 py-3 text-sm text-white/40">No chat history</p>
        ) : (
          chatLogs.map((log) => {
            const isActive = pathname === log.href;

            return (
              <Link
                key={log.href}
                href={log.href}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors truncate",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
                title={log.title}
              >
                {log.title}
              </Link>
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
