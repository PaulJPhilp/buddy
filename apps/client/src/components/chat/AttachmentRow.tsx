"use client";

import React from 'react';
import { XIcon } from 'lucide-react';
import type { DisplayFile, Theme } from '@/features/chat/types';

interface AttachmentRowProps {
    theme: Theme;
    attachedFiles: DisplayFile[];
    onRemoveFileAction: (fileId: string) => void;
}

export function AttachmentRow({
    theme,
    attachedFiles,
    onRemoveFileAction
}: AttachmentRowProps) {
    if (!attachedFiles.length) return null;

    return (
        <div className="flex flex-wrap gap-2 py-2">
            {attachedFiles.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1 
                             rounded-full text-sm"
                >
                    <span className="text-gray-700">{file.name}</span>
                    <button
                        type="button"
                        onClick={() => onRemoveFileAction(file.id)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
