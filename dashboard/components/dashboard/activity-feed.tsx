"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: string;
  location?: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "warning",
    message: "High crowd density detected at Gate 3",
    timestamp: "2 mins ago",
    location: "Gate 3, Main Entrance",
  },
  {
    id: "2",
    type: "success",
    message: "Medical emergency resolved successfully",
    timestamp: "15 mins ago",
    location: "Medical Camp A",
  },
  {
    id: "3",
    type: "info",
    message: "New security personnel checked in",
    timestamp: "32 mins ago",
    location: "Checkpoint B",
  },
  {
    id: "4",
    type: "error",
    message: "Communication disruption in Zone 4",
    timestamp: "1 hour ago",
    location: "Zone 4, West Section",
  },
  {
    id: "5",
    type: "success",
    message: "Lost child reunited with parents",
    timestamp: "2 hours ago",
    location: "Information Center",
  },
];

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: "text-green-400 bg-green-400/10",
  error: "text-red-400 bg-red-400/10",
  warning: "text-yellow-400 bg-yellow-400/10",
  info: "text-blue-400 bg-blue-400/10",
};

export function ActivityFeed() {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="text-white text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type];

            return (
              <div key={activity.id} className="flex gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    colorMap[activity.type]
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-tight">
                    {activity.message}
                  </p>
                  {activity.location && (
                    <p className="text-white/40 text-xs mt-1">{activity.location}</p>
                  )}
                  <p className="text-white/60 text-xs mt-1">{activity.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
