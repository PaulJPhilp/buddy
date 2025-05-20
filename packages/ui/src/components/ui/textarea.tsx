import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((
  { className, autoResize, onChange, ...props },
  ref
) => {
  const localRef = React.useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = (ref || localRef) as React.RefObject<HTMLTextAreaElement>;

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    onChange?.(event);
  };

  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [autoResize, textareaRef]);

  return (
    <textarea
      ref={textareaRef}
      onChange={handleChange}
      className={cn(
        "flex w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
