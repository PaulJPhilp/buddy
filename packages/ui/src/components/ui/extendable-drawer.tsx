import { GripVertical } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

interface ExtendableDrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  position?: "left" | "right";
  showHandle?: boolean;
}

export function ExtendableDrawer({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  position = "left",
  showHandle = true,
  className,
  ...props
}: ExtendableDrawerProps) {
  const [width, setWidth] = React.useState(defaultWidth);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = React.useCallback(() => {
    setIsDragging(true);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = position === "left" ? e.clientX : window.innerWidth - e.clientX;
      setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, position]);

  return (
    <div
      className={cn(
        "flex h-full bg-background border-border",
        position === "left" ? "border-r" : "border-l",
        className,
      )}
      style={{ width }}
      {...props}
    >
      <div className="flex-1 overflow-hidden">{children}</div>
      {showHandle && (
        <div
          className={cn(
            "flex items-center justify-center w-2 bg-muted hover:bg-accent cursor-col-resize transition-colors",
            position === "left" ? "border-l" : "border-r",
          )}
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
