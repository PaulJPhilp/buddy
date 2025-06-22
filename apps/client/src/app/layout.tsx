import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell/AppShell";
import { ClerkProvider } from "@clerk/nextjs";
import { cn } from "@ui/lib/utils";
import type { Metadata } from "next";

const GeistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const GeistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buddy",
  description: "Your personal AI companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={cn("min-h-screen font-sans antialiased")}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
