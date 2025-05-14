"use client";

import { cn } from "@/lib/utils";

interface HeaderBarProps {
    threadId?: string;
    isSelected: boolean;
    theme: "blue" | "rose";
    error?: string | null; // Add error prop
}

export function HeaderBar({ threadId, isSelected, theme, error }: HeaderBarProps) {
    return (
        <div className={cn(
            "px-2 shadow-sm flex justify-between items-center h-2 border-b",
            error ? "bg-red-100 border-red-300" : "bg-white border-gray-200/50" // Conditional background and border
        )}>
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
