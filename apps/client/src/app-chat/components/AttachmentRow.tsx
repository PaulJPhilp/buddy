"use client";

import { cn } from "@/lib/utils";
import { FileIcon, XIcon } from "lucide-react";
import type { DisplayFile, Theme } from "../types";

interface AttachmentRowProps {
    attachedFiles: DisplayFile[];
    onRemoveFileAction: (fileId: string) => void;
    theme: Theme;
}

export function AttachmentRow({ attachedFiles, onRemoveFileAction, theme }: AttachmentRowProps) {
    if (attachedFiles.length === 0) {
        return null;
    }

    return (
        <div className="w-[90%] mx-auto py-0">
            <div className="mx-1">
                <div className={cn(
                    "flex flex-wrap gap-0 p-0 rounded-[1px]",
                    theme === "blue" ? 'bg-teal-50' : 'bg-orange-50'
                )}>
                    {attachedFiles.map((file) => (
                        <div
                            key={file.id}
                            className={cn(
                                "flex items-center bg-white px-0.5 py-0 rounded-[1px] border text-[4pt] gap-0 mr-0.5",
                                theme === "blue" ? 'border-teal-100' : 'border-orange-100'
                            )}
                        >
                            <FileIcon className={cn(
                                "h-1 w-1 mr-0.5",
                                theme === "blue" ? 'text-teal-500' : 'text-orange-500'
                            )} />
                            <span className="max-w-[24px] truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => onRemoveFileAction(file.id)}
                                className={cn(
                                    "ml-0.5 rounded-[1px] p-0",
                                    theme === "blue" ? 'hover:bg-teal-50' : 'hover:bg-orange-50'
                                )}
                                aria-label={`Remove ${file.name}`}
                            >
                                <XIcon className="h-1 w-1 text-gray-500 hover:text-red-500" aria-hidden={true} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
