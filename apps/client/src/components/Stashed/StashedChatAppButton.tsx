"use client";

import type { ChatAppEntry } from "@/workspace/types";
import { Button } from "@ui/components/ui/button";
import { MessageCircle } from "lucide-react";
import React from "react";

interface StashedChatAppButtonProps {
  chatApp: ChatAppEntry;
  onUnstash: (appId: string) => void;
}

export function StashedChatAppButton({
  chatApp,
  onUnstash,
}: StashedChatAppButtonProps) {
  const headerBgColor = chatApp.config.theme?.colors?.headerBar?.background;
  const headerTextColor = chatApp.config.theme?.colors?.headerBar?.text;

  return (
    <Button
      variant="default"
      size="sm"
      className="font-medium"
      style={{
        backgroundColor: headerBgColor,
        color: headerTextColor,
      }}
      onClick={() => onUnstash(chatApp.id)}
    >
      <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
      <span className="truncate">{chatApp.config.name}</span>
    </Button>
  );
}
