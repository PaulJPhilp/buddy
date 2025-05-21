import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import { FileIcon, X } from "lucide-react";
import React from "react";

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface AttachmentBarProps {
  attachments: AttachmentFile[];
  onRemoveAttachment: (fileId: string) => void;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = Math.abs(bytes);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
};

const AttachmentBar: React.FC<AttachmentBarProps> = ({
  attachments = [],
  onRemoveAttachment,
  className,
}) => {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 bg-white rounded",
        className,
      )}
      role="list"
      aria-label="Attached files"
    >
      {attachments.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 bg-background rounded px-3 py-1.5 text-sm"
          role="listitem"
        >
          <FileIcon
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="max-w-[200px] truncate" title={file.name}>
            {file.name}
          </span>
          <span
            className="text-xs text-muted-foreground"
            title={`File size: ${formatFileSize(file.size)}`}
          >
            ({formatFileSize(file.size)})
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 -mr-1 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRemoveAttachment(file.id)}
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default AttachmentBar;
