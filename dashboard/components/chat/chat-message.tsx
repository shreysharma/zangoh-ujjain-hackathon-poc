"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  sender: "user" | "bot";
  timestamp?: string;
}

export function ChatMessage({ message, sender, timestamp }: ChatMessageProps) {
  const isUser = sender === "user";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 text-sm",
          isUser
            ? "bg-primary-orange text-white rounded-br-none"
            : "bg-white text-text-dark border border-border-light rounded-bl-none"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message}</p>
        {timestamp && (
          <span
            className={cn(
              "text-xs mt-1 block",
              isUser ? "text-white/70" : "text-text-gray"
            )}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
