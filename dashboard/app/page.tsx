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
      <div className="flex flex-col items-center justify-center min-h-screen px-4 md:px-8 py-12 md:py-16">
        {/* Main Content - Centered */}
        <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Heading */}
          <div className="text-center space-y-1 md:space-y-2">
            <h1 className="font-general-sans text-2xl md:text-3xl lg:text-[33px] font-medium text-white leading-[131%] tracking-[-0.011em] max-w-[826px] mx-auto px-4">
              Hi, I'm Sanrakshak, Your admin assistant and copilot.
            </h1>
            <p className="font-general-sans text-base md:text-lg lg:text-[20px] font-light italic text-white/60 leading-[131%] tracking-[-0.011em]">
              Powered by Zangoh· Real-time operational insights.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            {error && (
              <div className="px-3 md:px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs md:text-sm">{error}</p>
              </div>
            )}
            <div className="bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-xl md:rounded-2xl p-[1px]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-[#3A3A3A] rounded-lg md:rounded-xl px-3 md:px-5 py-3 md:py-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <Plus className="w-4 h-4 md:w-5 md:h-5 text-white flex-shrink-0" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything — from lost-case summaries to crowd flow insights or daily briefings"
                    className="flex-1 bg-transparent border-none outline-none text-white font-switzer text-sm md:text-base lg:text-lg leading-relaxed placeholder:text-[#BDBDBD]"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-primary-orange hover:bg-primary-orange/90 text-white px-4 md:px-6 py-2.5 md:py-2 rounded-lg font-medium text-sm md:text-base flex-shrink-0 w-full sm:w-auto"
                >
                  Search
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DesktopLayout>
  );
}
