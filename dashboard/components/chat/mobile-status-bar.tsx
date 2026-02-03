"use client";

import * as React from "react";

export function MobileStatusBar() {
  const [time, setTime] = React.useState("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-[59px] bg-background-light">
      <div className="flex items-center justify-between w-full px-6">
        <span className="text-sm font-medium text-text-dark">{time}</span>
        <div className="flex items-center gap-1">
          {/* Signal bars */}
          <div className="flex items-end gap-0.5">
            <div className="w-1 h-2 bg-text-dark rounded-sm" />
            <div className="w-1 h-3 bg-text-dark rounded-sm" />
            <div className="w-1 h-4 bg-text-dark rounded-sm" />
            <div className="w-1 h-5 bg-text-dark rounded-sm" />
          </div>
          {/* Battery */}
          <div className="ml-2 w-6 h-3 border border-text-dark rounded-sm relative">
            <div className="absolute inset-0.5 bg-text-dark rounded-sm" />
            <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-0.5 h-1.5 bg-text-dark" />
          </div>
        </div>
      </div>
    </div>
  );
}
