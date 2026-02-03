import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanrakshak - Divya Darshak Dashboard",
  description: "Smart Pilgrimage Management Dashboard for Security Personnel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&f[]=switzer@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-switzer antialiased">
        {children}
      </body>
    </html>
  );
}
