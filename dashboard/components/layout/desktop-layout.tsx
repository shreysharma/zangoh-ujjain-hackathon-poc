"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";

interface DesktopLayoutProps {
  children: React.ReactNode;
  showTopActions?: boolean;
}

function UserAvatar({ initials = "DA" }: { initials?: string }) {
  return (
    <div className="bg-[#fffaf4] overflow-clip relative rounded-xl md:rounded-[12px] shrink-0 w-8 h-8 md:w-10 md:h-10">
      <div className="absolute inset-0 flex items-center justify-center font-semibold text-xs md:text-sm tracking-[0.5px] text-[#f67965]">
        {initials}
      </div>
    </div>
  );
}

function AlertBadge() {
  return (
    <div className="overflow-clip relative shrink-0">
      <svg width="103" height="40" viewBox="0 0 103 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="103" height="40" rx="12" fill="white" fillOpacity="0.05" />
        <path
          d="M23.7954 27.5003C24.3831 28.019 25.1549 28.3337 26.0003 28.3337C26.8457 28.3337 27.6175 28.019 28.2052 27.5003M31.0003 16.667C31.0003 15.3409 30.4735 14.0691 29.5358 13.1315C28.5982 12.1938 27.3264 11.667 26.0003 11.667C24.6742 11.667 23.4024 12.1938 22.4648 13.1315C21.5271 14.0691 21.0003 15.3409 21.0003 16.667C21.0003 19.2421 20.3507 21.0053 19.625 22.1715C19.0129 23.1552 18.7068 23.6471 18.7181 23.7843C18.7305 23.9362 18.7627 23.9942 18.8851 24.085C18.9957 24.167 19.4941 24.167 20.491 24.167H31.5096C32.5065 24.167 33.0049 24.167 33.1155 24.085C33.2379 23.9942 33.2701 23.9362 33.2825 23.7843C33.2938 23.6471 32.9877 23.1552 32.3756 22.1715C31.6499 21.0053 31.0003 19.2421 31.0003 16.667Z"
          stroke="white"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M53.04 26L52.016 23.392H46.8L45.776 26H44.32L48.592 15.12H50.288L54.576 26H53.04ZM49.088 17.504L47.248 22.208H51.568L49.728 17.504L49.408 16.544L49.088 17.504ZM56.0106 26V14.48H57.4186V26H56.0106ZM66.9953 23.232C66.5312 25.216 65.1073 26.192 63.1713 26.192C60.7073 26.192 59.2193 24.528 59.2193 21.76C59.2193 18.88 60.7073 17.296 63.0913 17.296C65.4913 17.296 66.9313 18.944 66.9313 21.648V22H60.6593C60.7393 23.904 61.6353 24.976 63.1713 24.976C64.3713 24.976 65.2193 24.4 65.5233 23.232H66.9953ZM63.0913 18.512C61.7313 18.512 60.9153 19.36 60.7073 20.944H65.4593C65.2673 19.376 64.4193 18.512 63.0913 18.512ZM68.8075 26V17.504H70.2155V18.816C70.7915 17.776 71.7035 17.296 72.7275 17.296C73.0635 17.296 73.3675 17.376 73.5275 17.504V18.768C73.2875 18.688 72.9835 18.656 72.6475 18.656C70.9515 18.656 70.2155 19.712 70.2155 21.248V26H68.8075ZM74.9683 23.552V18.624H73.7843V17.504H74.9683V15.552H76.3763V17.504H78.2483V18.624H76.3763V23.552C76.3763 24.576 76.6803 25.056 77.9283 25.056H78.2163V26.064C78.0563 26.144 77.7043 26.192 77.3043 26.192C75.7203 26.192 74.9683 25.344 74.9683 23.552ZM80.6288 19.68C80.6288 22.048 86.1488 20.096 86.1488 23.6C86.1488 25.184 84.7408 26.192 82.7408 26.192C80.7248 26.192 79.3168 25.232 78.9967 23.232H80.4048C80.5968 24.416 81.4768 25.072 82.7888 25.072C84.0688 25.072 84.7408 24.496 84.7408 23.696C84.7408 21.376 79.2848 23.296 79.2848 19.776C79.2848 18.48 80.2928 17.296 82.3728 17.296C84.2128 17.296 85.5728 18.16 85.8448 20.272H84.4368C84.2288 18.944 83.4928 18.448 82.2928 18.448C81.2368 18.448 80.6288 18.976 80.6288 19.68Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

export function DesktopLayout({ children, showTopActions = true }: DesktopLayoutProps) {
  return (
    <div className="min-h-screen bg-[#262626]">
      <Sidebar />

      {/* Top Right Actions */}
      {showTopActions && (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-2 md:gap-3">
          <AlertBadge />
          <UserAvatar />
        </div>
      )}

      {/* Main content with responsive margin */}
      <main className="min-h-screen transition-[margin] duration-300 lg:ml-[248px] px-4 md:px-0">
        {children}
      </main>
    </div>
  );
}
