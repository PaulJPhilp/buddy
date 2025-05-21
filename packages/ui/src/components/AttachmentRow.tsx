import { File, FileImage, FileText, Paperclip, X } from "lucide-react";
import React from "react";

export interface AttachmentRowProps {
  attachedFiles: Array<File>;
  onRemoveFile: (file: File) => void;
  className?: string;
}

/**
 * A component to display attached files with the ability to remove them.
 */
export const AttachmentRow: React.FC<AttachmentRowProps> = ({
  attachedFiles,
  onRemoveFile,
  className = "",
}) => {
  if (attachedFiles.length === 0) {
    return null;
  }

  // Get appropriate icon component for file type
  const getFileIcon = (file: File) => {
    const fileType = file.type || "";
    const iconSize = 14;

    if (fileType.includes("image")) {
      return <FileImage size={iconSize} />;
    }
    if (fileType.includes("pdf")) {
      return <File size={iconSize} />;
    }
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      return <FileText size={iconSize} />;
    }
    if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText size={iconSize} />;
    }
    return <Paperclip size={iconSize} />;
  };

  return (
    <div className={`flex flex-wrap gap-2 p-2 ${className}`}>
      {attachedFiles.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center bg-muted/20 hover:bg-muted/30 rounded-md px-2 py-1 text-xs border border-input transition-colors shadow-sm"
        >
          <span className="mr-2 text-muted-foreground" aria-hidden="true">
            {getFileIcon(file)}
          </span>
          <span className="mr-2 truncate max-w-[150px]" title={file.name}>
            {file.name}
          </span>
          <button
            type="button"
            className="ml-1 text-muted-foreground hover:text-destructive hover:bg-muted/50 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
            onClick={() => onRemoveFile(file)}
            aria-label={`Remove ${file.name}`}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
};
