import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "../contexts/AppContext";
import { ConversationProvider } from "../providers/ConversationProvider";
// import ConnectionStatus from "@/components/ConnectionStatus";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Divya Darshak - Smart Pilgrimage Guide",
  description: "Your spiritual journey companion. Get guidance for pilgrimage sites, religious practices, and spiritual path.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased m-0 p-0 bg-gray-100`}
      >
        <AppProvider>
          <ConversationProvider>
            {/* <ConnectionStatus /> */}
            {children}
          </ConversationProvider>
        </AppProvider>
      </body>
    </html>
  );
}
