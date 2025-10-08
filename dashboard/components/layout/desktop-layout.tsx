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
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          className="flex items-center gap-1.5 md:gap-2 bg-white/5 hover:bg-white/10 text-white px-2.5 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl"
        >
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-xs md:text-sm font-medium hidden sm:inline">Alerts</span>
        </Button>

        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#FFFAF4] flex items-center justify-center text-[#393939] font-semibold text-xs md:text-sm">
          DA
        </div>
      </div>

      {/* Main content with responsive margin */}
      <main className="min-h-screen transition-[margin] duration-300 lg:ml-[240px] px-4 md:px-0">
        {children}
      </main>
    </div>
  );
}
