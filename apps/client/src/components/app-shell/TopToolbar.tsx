"use client";

import { Menu } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { UserCard } from "./UserCard";
import { Button } from "/Users/paul/Projects/buddy/src/components/components/ui/button";

interface TopToolbarProps {
  onToggleSidebarAction: () => void;
}

export function TopToolbar({ onToggleSidebarAction }: TopToolbarProps) {
  const { toast } = useToast();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy failed",
        description: "Your browser doesn't support clipboard operations",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-6 border-b bg-muted/40 flex items-center justify-between px-0.5">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebarAction}
          className="mr-2 h-full px-1"
        >
          <Menu className="h-3 w-3" aria-hidden={true} />
        </Button>
        <h1 className="text-sm font-semibold leading-none">Buddy</h1>
      </div>
      <UserCard />
    </div>
  );
}
