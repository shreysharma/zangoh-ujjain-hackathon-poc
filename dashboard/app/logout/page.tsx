"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear all chat data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("chat-")) {
        localStorage.removeItem(key);
      }
    });

    // Redirect to home
    router.push("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-dark">
      <p className="text-white">Logging out...</p>
    </div>
  );
}
