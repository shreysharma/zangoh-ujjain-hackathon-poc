"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  AlertOctagon,
  MapPin,
  Radio,
  FileText,
  Camera,
} from "lucide-react";

const actions = [
  {
    icon: AlertOctagon,
    label: "Raise Alert",
    variant: "primary" as const,
  },
  {
    icon: Radio,
    label: "Broadcast",
    variant: "secondary" as const,
  },
  {
    icon: Users,
    label: "Add Personnel",
    variant: "secondary" as const,
  },
  {
    icon: MapPin,
    label: "View Map",
    variant: "secondary" as const,
  },
  {
    icon: FileText,
    label: "Report",
    variant: "secondary" as const,
  },
  {
    icon: Camera,
    label: "View Cameras",
    variant: "secondary" as const,
  },
];

export function QuickActions() {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-auto py-4 flex-col gap-2"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
