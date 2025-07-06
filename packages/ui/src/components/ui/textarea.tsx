"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
  primaryColor?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize, onChange, primaryColor, ...props }, ref) => {
    const localRef = React.useRef<HTMLTextAreaElement | null>(null);
    const textareaRef = (ref ||
      localRef) as React.RefObject<HTMLTextAreaElement>;

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
          "flex w-full rounded-md bg-transparent px-2 py-1 text-xs shadow-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        style={
          {
            ["--tw-ring-color" as string]: primaryColor || "hsl(var(--ring))",
            ...props.style,
          } as React.CSSProperties
        }
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
