import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EffectProvider } from "@/components/EffectProvider";
import { cn } from "@buddy/ui/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buddy - AI Workspace",
  description: "Your AI-powered workspace for productivity and collaboration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(geist.variable, geistMono.variable)}
      >
        <head />
        <body
          className={cn(
            "min-h-screen font-sans antialiased",
            "bg-background text-foreground",
          )}
        >
          <EffectProvider>{children}</EffectProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
