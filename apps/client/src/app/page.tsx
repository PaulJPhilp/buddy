"use client";

import { ClientOnly } from "@/features/chat/components/ClientOnly";
import { Suspense } from "react";
import ChatContainer from "./ChatContainer";

export default function Home() {
  return (
    <div className="h-screen w-full flex bg-gray-50">
      {/* Single Chat App - Business */}
      <div className="flex-1 bg-white">
        <div className="h-[calc(100vh-3rem)]">
          <Suspense
            fallback={
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <div className="text-blue-600">Loading Business Chat...</div>
                </div>
              </div>
            }
          >
            <ClientOnly>
              <ChatContainer chatType="business" />
            </ClientOnly>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
