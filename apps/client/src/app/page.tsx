"use client"; // Make this a Client Component

import { ChatApp } from "@/app-chat/ChatApp";
import { useAppShellStore } from "@/stores/appShellStore"; // Import the store
import { useEffect } from "react";

export default function Home() {
  // Get both current selection and setter
  const { selectedThreadId, setSelectedThreadId } = useAppShellStore();

  // Set initial chat only if no chat is selected
  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThreadId("thread1");
    }
  }, [selectedThreadId, setSelectedThreadId]);

  return (
    <div className="flex flex-1 gap-4 overflow-hidden h-full p-4 bg-gray-100">
      <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-md">
          <ChatApp threadId="thread1" theme="blue" />
        </div>
      </div>
      <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-md">
          <ChatApp threadId="thread2" theme="rose" />
        </div>
      </div>
    </div>
  );
}
