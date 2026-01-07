"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await api.auth.login(email.trim(), password);
      const token =
        (response as any).token ||
        (response as any).access_token ||
        (response as any).accessToken;
      const refreshToken =
        (response as any).refresh_token ||
        (response as any).refreshToken ||
        "";

      if (!token) {
        throw new ApiError("Login succeeded but no token was returned.", 0);
      }

      localStorage.setItem("auth_token", token);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }
      localStorage.setItem("auth_user", JSON.stringify(response.user || {}));
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Login failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#262626] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,#E9842F,transparent_65%)] opacity-40" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,#8A38F5,transparent_65%)] opacity-30" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,#ffffff,transparent_70%)] opacity-10" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
            Sanrakshak
          </div>
          <h1 className="font-general-sans text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
            Secure access to the operations dashboard
          </h1>
          <p className="max-w-xl font-switzer text-base text-white/70 md:text-lg">
            Sign in to monitor live tickets, manage cases, and keep the field teams
            in sync with real-time updates.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white/90">Responsive</p>
              <p className="text-xs text-white/60">
                Optimized for desktop monitors and mobile field devices.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white/90">Secure</p>
              <p className="text-xs text-white/60">
                Token-based authentication aligned with your backend.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#2f2f2f]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur lg:p-8">
          <h2 className="text-xl font-semibold">Login</h2>
          <p className="mt-1 text-sm text-white/60">
            Use your admin credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs text-white/70">
                Email
              </label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin"
                className="border-white/10 bg-[#1f1f1f] text-white placeholder:text-white/40 focus-visible:ring-primary-orange"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs text-white/70">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="border-white/10 bg-[#1f1f1f] text-white placeholder:text-white/40 focus-visible:ring-primary-orange"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-orange text-white hover:bg-primary-orange/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-xs text-white/50">
              Need access? Contact the command center admin.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
