import React from "react";
import { Icon } from "./Icon"; // Correct relative import path

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
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div
      className={`flex flex-wrap gap-1 p-1 items-center bg-muted/30 rounded-md overflow-x-auto h-full w-full ${className}`}
      aria-label="Attached files"
    >
      {files.map((file, index) => (
        <div
          key={`${file.name}-${file.lastModified}-${index}`}
          className="flex items-center gap-1 bg-background border border-border rounded-md px-1.5 py-0.5 text-[6px] whitespace-nowrap h-6"
          title={`${file.name} (${formatFileSize(file.size)})`}
        >
          <Icon
            name="FileText"
            size={12}
            className="text-muted-foreground flex-shrink-0"
          />
          <span className="truncate max-w-[80px]" title={file.name}>
            {file.name}
          </span>
          <span className="text-muted-foreground text-[6px]">
            ({formatFileSize(file.size)})
          </span>
          <button
            type="button"
            onClick={() => onRemoveFile(file)}
            className="ml-1 p-0.5 rounded hover:bg-destructive/20 text-destructive flex-shrink-0"
            aria-label={`Remove ${file.name}`}
            title={`Remove ${file.name}`}
          >
            <Icon name="X" size={10} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AttachmentRow;
