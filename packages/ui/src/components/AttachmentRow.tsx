import { Icon } from "@ui/components/Icon"; // Assuming Icon component is available
import React from "react";

export interface AttachmentRowProps {
  files: File[];
  onRemoveFile: (file: File) => void;
  className?: string;
}

/**
 * A component to display attached files with the ability to remove them.
 */
const AttachmentRow: React.FC<AttachmentRowProps> = ({
  files,
  onRemoveFile,
  className = "",
}) => {
  if (!files || files.length === 0) {
    return null;
  }

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div
      className={`flex flex-wrap gap-xs p-xs items-center bg-muted/30 rounded-sm overflow-x-auto ${className}`}
      aria-label="Attached files"
    >
      {files.map((file, index) => (
        <div
          key={`${file.name}-${file.lastModified}-${index}`}
          className="flex items-center gap-xs bg-background border border-border rounded-sm px-xs py-xxs text-xs whitespace-nowrap"
          title={`${file.name} (${formatFileSize(file.size)})`}
        >
          <Icon
            name="FileText"
            size={14}
            className="text-muted-foreground flex-shrink-0"
          />
          <span className="truncate max-w-[100px]" title={file.name}>
            {file.name}
          </span>
          <span className="text-muted-foreground text-xxs">
            ({formatFileSize(file.size)})
          </span>
          <button
            type="button"
            onClick={() => onRemoveFile(file)}
            className="ml-xs p-0.5 rounded hover:bg-destructive/20 text-destructive flex-shrink-0"
            aria-label={`Remove ${file.name}`}
            title={`Remove ${file.name}`}
          >
            <Icon name="X" size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AttachmentRow;
