"use client";

import { AppShell } from "@/components/app/AppShell";
import { LoadDebugInfo } from "@/components/app/LoadDebugInfo";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <AppShell />
      <LoadDebugInfo />
      {/* Development Link - Only show in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-50">
          <Link
            href="/chatapp-dev"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            🛠️ Chat App Dev
          </Link>
        </div>
      )}
    </>
  );
}
