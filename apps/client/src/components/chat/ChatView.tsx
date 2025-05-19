"use client";

import React from "react";
import { Button } from "@ui/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { Settings } from "lucide-react";

export function ChatView() {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="h-16 border-b p-4 flex items-center justify-between bg-muted/50">
        {/* Clerk User Button on the left */}
        <UserButton />
        {/* Settings Button on the right */}
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Placeholder */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-muted-foreground text-center">
          Messages will appear here...
        </p>
        {/* Example messages would go here */}
      </div>

      {/* Input Area Placeholder */}
      <div className="border-t p-4 bg-muted/50">
        <p className="text-muted-foreground">Input area goes here...</p>
      </div>
    </div>
  );
}
