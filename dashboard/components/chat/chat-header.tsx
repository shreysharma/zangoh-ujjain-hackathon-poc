"use client";

import * as React from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  title: string;
  onBack?: () => void;
}

export function ChatHeader({ title, onBack }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 bg-primary-orange">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-white font-semibold text-lg">{title}</h1>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10"
      >
        <MoreVertical className="w-5 h-5" />
      </Button>
    </div>
  );
}
