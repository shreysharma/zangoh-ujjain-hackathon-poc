"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className="min-h-screen bg-[#262626]">
      <Sidebar />

      {/* Top Right Actions */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <Button
          variant="ghost"
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl"
        >
          <Bell className="w-5 h-5" />
          <span className="text-sm font-medium">Alerts</span>
        </Button>

        <div className="w-10 h-10 rounded-xl bg-[#FFFAF4] flex items-center justify-center text-[#393939] font-semibold text-sm">
          DA
        </div>
      </div>

      <main className="ml-[256px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
