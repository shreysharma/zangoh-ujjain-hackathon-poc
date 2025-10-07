"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("p-6 bg-white/5 border-white/10 backdrop-blur-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm font-medium">{title}</p>
          <p className="text-white text-3xl font-bold mt-2">{value}</p>

          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-400" : "text-red-400"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-white/40 text-xs">vs last period</span>
            </div>
          )}
        </div>

        <div className="w-12 h-12 rounded-lg bg-primary-orange/20 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-orange" />
        </div>
      </div>
    </Card>
  );
}
