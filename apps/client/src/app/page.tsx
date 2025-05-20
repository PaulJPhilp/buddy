"use client";

import BusinessChat from "@/features/chat/BusinessChat";
import SocialChat from "@/features/chat/SocialChat";

export default function Home() {
  return (
    <div className="flex h-full w-full p-4 gap-4">
      <div className="flex-1 h-full rounded-lg shadow-lg overflow-hidden">
        <BusinessChat />
      </div>
      <div className="flex-1 h-full rounded-lg shadow-lg overflow-hidden">
        <SocialChat />
      </div>
    </div>
  );
}
