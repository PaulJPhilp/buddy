"use client";

import { Button } from "@ui/components/ui/button";
import { useToast } from "@ui/components/ui/use-toast";
import { Icon } from "@ui/components/Icon";
import { Menu, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { UserCard } from "./UserCard";

interface AppToolbarProps {
  onToggleSidebarAction: () => void;
}

export function AppToolbar({ onToggleSidebarAction }: AppToolbarProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement mute toggle
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied!", {
        description: "Text copied to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Copy failed", {
        description: "Your browser doesn't support clipboard operations",
      });
    }
  };

  return (
    <div className="h-5 border-b bg-muted/40 flex items-center justify-between px-0.5">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebarAction}
          className="mr-1 h-full px-0.5"
        >
          <Menu className="h-3 w-3" aria-hidden={true} />
        </Button>
        <h1 className="text-sm font-semibold leading-none">Buddy</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-full px-0.5"
          >
            <Settings className="h-3 w-3" aria-hidden={true} />
          </Button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-card ring-1 ring-border divide-y divide-border">
              <div className="py-1">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 mr-3" aria-hidden={true} />
                  ) : (
                    <Moon className="h-4 w-4 mr-3" aria-hidden={true} />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
                <button
                  onClick={toggleMute}
                  className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  {isMuted ? (
                    <Icon name="VolumeX" size={16} className="mr-3" />
                  ) : (
                    <Icon name="Volume2" size={16} className="mr-3" />
                  )}
                  {isMuted ? "Unmute" : "Mute"}
                </button>
              </div>
            </div>
          )}
        </div>
        <UserCard />
      </div>
    </div>
  );
}
