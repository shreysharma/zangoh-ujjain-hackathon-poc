"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export function ChatInput({ onSend, placeholder = "Type a message..." }: ChatInputProps) {
  const [message, setMessage] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-5 py-3 bg-white border-t border-border-light"
    >
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border-border-light"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim()}
        className="flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}
