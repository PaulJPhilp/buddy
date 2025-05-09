"use client";

import { BarChart2Icon, PaperclipIcon } from "lucide-react";

interface IconBarProps {
    onFileClick: () => void;
    onDashboardClick: () => void;
}

export function IconBar({ onFileClick, onDashboardClick }: IconBarProps) {
    return (
        <div className="flex items-center gap-2 px-2">
            <button
                type="button"
                onClick={onDashboardClick}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Show dashboard"
            >
                <BarChart2Icon className="h-4 w-4" aria-hidden={true} />
            </button>
            <button
                type="button"
                onClick={onFileClick}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Attach file"
            >
                <PaperclipIcon className="h-4 w-4" aria-hidden={true} />
            </button>
        </div>
    );
}