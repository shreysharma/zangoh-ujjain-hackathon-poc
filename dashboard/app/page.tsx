"use client";

import { DesktopLayout } from "@/components/layout/desktop-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sanitizeInput, validateInput } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = validateInput(input);
    if (!validation.isValid) {
      setError(validation.error || "Invalid input");
      return;
    }

    // Clear any previous errors
    setError(null);

    // Sanitize input before storing
    const sanitized = sanitizeInput(input);

    // Store the initial query in session storage
    sessionStorage.setItem("initialQuery", sanitized);

    // Generate a unique chat ID
    const chatId = Date.now().toString();

    // Navigate to the chat page
    router.push(`/chat/${chatId}`);
  };

  return (
    <DesktopLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Main Content - Centered */}
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="font-general-sans text-[33px] font-medium text-white leading-[131%] tracking-[-0.011em] max-w-[826px] mx-auto">
              Hi, I'm Sanrakshak, Your admin assistant and copilot.
            </h1>
            <p className="font-general-sans text-[20px] font-light italic text-white/60 leading-[131%] tracking-[-0.011em]">
              Powered by Zangoh· Real-time operational insights.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            {error && (
              <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <div className="flex items-center gap-3 bg-[#3A3A3A] rounded-xl px-5 py-4 border border-white/10">
              <Plus className="w-5 h-5 text-white flex-shrink-0" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything — from lost-case summaries to crowd flow insights or daily briefings"
                className="flex-1 bg-transparent border-none outline-none text-white font-switzer text-[18px] leading-[29.85px] placeholder:text-[#BDBDBD]"
              />
              <Button
                type="submit"
                className="bg-primary-orange hover:bg-primary-orange/90 text-white px-6 py-2 rounded-lg font-medium text-base flex-shrink-0"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DesktopLayout>
  );
}
