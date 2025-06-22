"use client";

import { AppShell } from "@/components/AppShell/AppShell";
import { ClientOnly } from "@/components/ClientOnly";

export default function Page() {
  return (
    <ClientOnly
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Initializing Workspace...</p>
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        <AppShell />
      </div>
    </ClientOnly>
  );
}
