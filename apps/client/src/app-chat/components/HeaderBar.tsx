"use client";

import { cn } from "@/lib/utils";

interface HeaderBarProps {
    threadId?: string;
    isSelected: boolean;
    theme: "blue" | "rose";
}

export function HeaderBar({ threadId, isSelected, theme }: HeaderBarProps) {
    return (
        <div className="px-2 shadow-sm bg-white flex justify-between items-center h-2 border-b border-gray-200/50">
            <div className="flex items-center gap-1">
                <div className={cn(
                    "w-1 h-1 rounded-full",
                    isSelected
                        ? (theme === "blue" ? 'bg-teal-500' : 'bg-orange-500')
                        : 'bg-gray-400'
                )} />
            </div>
        </div>
    );
}
