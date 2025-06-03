"use client";

import { ClientOnly } from "@/features/chat/components/ClientOnly";
import { Suspense } from "react";
import ChatContainer from "./ChatContainer";

export default function Home() {
  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="h-full w-full grid grid-cols-2 gap-4 p-4">
        {/* First Chat */}
        <div className="h-full bg-white shadow-sm rounded-lg overflow-hidden">
          <Suspense
            fallback={
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <div className="text-blue-600">Loading Business Chat 1...</div>
                </div>
              </div>
            }
          >
            <ClientOnly>
              <ChatContainer chatType="business" id="chat1" />
            </ClientOnly>
          </Suspense>
        </div>

        {/* Second Chat - Social Chat */}
        <div className="h-full bg-white shadow-sm rounded-lg overflow-hidden">
          <Suspense
            fallback={
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2" />
                  <div className="text-purple-600">Loading Social Chat...</div>
                </div>
              </div>
            }
          >
            <ClientOnly>
              <ChatContainer chatType="social" id="chat2" />
            </ClientOnly>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
