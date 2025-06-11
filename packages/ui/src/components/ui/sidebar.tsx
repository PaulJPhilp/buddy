import * as React from "react";
import { cn } from "../../lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean;
  collapsedWidth?: string | number;
  expandedWidth?: string | number;
  onToggle?: () => void;
  position?: "left" | "right";
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      children,
      isCollapsed = false,
      collapsedWidth = "64px",
      expandedWidth = "240px",
      onToggle,
      position = "left",
      ...props
    },
    ref,
  ) => {
    const [isCollapsedInternal, setIsCollapsedInternal] =
      React.useState(isCollapsed);

    React.useEffect(() => {
      setIsCollapsedInternal(isCollapsed);
    }, [isCollapsed]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full bg-background border-r transition-all duration-300 ease-in-out",
          position === "right" ? "border-l" : "border-r",
          className,
        )}
        style={{
          width: isCollapsedInternal ? collapsedWidth : expandedWidth,
        }}
        {...props}
      >
        <div
          className={cn(
            "flex-1 overflow-y-auto",
            isCollapsedInternal ? "px-2" : "px-4",
          )}
        >
          {isCollapsedInternal ? (
            <div className="py-4 flex flex-col items-center space-y-4">
              {React.Children.map(children, (child) => {
                if (
                  React.isValidElement<SidebarItemProps>(child) &&
                  child.props.collapsedIcon
                ) {
                  return child.props.collapsedIcon;
                }
                return null;
              })}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  collapsedIcon?: React.ReactNode;
  isActive?: boolean;
}

const SidebarItem = React.forwardRef<HTMLDivElement, SidebarItemProps>(
  ({ className, children, icon, collapsedIcon, isActive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
          className,
        )}
        {...props}
      >
        {icon}
        <span>{children}</span>
      </div>
    );
  },
);
SidebarItem.displayName = "SidebarItem";

interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, children, title, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("py-4", className)} {...props}>
        {title && (
          <h3 className="mb-2 px-4 text-sm font-semibold text-foreground">
            {title}
          </h3>
        )}
        <div className="space-y-1">{children}</div>
      </div>
    );
  },
);
SidebarSection.displayName = "SidebarSection";

export { Sidebar, SidebarItem, SidebarSection };
export type { SidebarItemProps, SidebarProps, SidebarSectionProps };

