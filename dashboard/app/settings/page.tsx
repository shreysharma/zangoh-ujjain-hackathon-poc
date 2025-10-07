import { DesktopLayout } from "@/components/layout/desktop-layout";

export default function SettingsPage() {
  return (
    <DesktopLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-white mb-6">Settings</h1>
          <div className="bg-white/5 rounded-xl p-6">
            <p className="text-white/60">Settings page coming soon...</p>
          </div>
        </div>
      </div>
    </DesktopLayout>
  );
}
