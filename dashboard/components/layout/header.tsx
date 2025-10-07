"use client";

import * as React from "react";
import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-2 px-6 py-4 bg-white/5 backdrop-blur-sm rounded-lg">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          type="search"
          placeholder="Search..."
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <Button variant="ghost" size="icon">
          <User className="w-5 h-5 text-white" />
        </Button>
      </div>
    </header>
  );
}
