"use client";

import { Button } from "@ui/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui/components/ui/tooltip"
import { cn } from "@ui/lib/utils"
import { ToolbarProps, isCommand, isSpacer } from "./types"

export function Toolbar({ config, className }: ToolbarProps) {
  const toolbarClasses = cn(
    "flex items-center gap-1 p-2",
    {
      // Position-based classes
      "flex-row": config.position === 'top' || config.position === 'bottom',
      "flex-col": config.position === 'left' || config.position === 'right',
      
      // Variant-based classes
      "bg-background border-b": config.position === 'top',
      "bg-background border-t": config.position === 'bottom',
      "bg-background border-r": config.position === 'left',
      "bg-background border-l": config.position === 'right',
      
      // Variant styles
      "min-h-[48px]": config.variant === 'default',
      "min-h-[36px]": config.variant === 'compact',
      "min-h-[24px]": config.variant === 'minimal',
    },
    config.className,
    className
  )

  return (
    <TooltipProvider>
      <div className={toolbarClasses} role="toolbar" aria-label={`${config.id} toolbar`}>
        {config.items.map((item) => {
          if (isSpacer(item)) {
            return (
              <div
                key={item.id}
                className={cn(
                  item.type === 'spacer' ? "w-px h-4 bg-border mx-1" : "flex-1",
                  config.position === 'left' || config.position === 'right' 
                    ? "h-px w-4 bg-border my-1" 
                    : ""
                )}
                aria-hidden="true"
              />
            )
          }

          if (isCommand(item)) {
            const buttonContent = (
              <Button
                variant={item.variant === 'primary' ? 'default' : 'ghost'}
                size={item.size || 'default'}
                onClick={item.action}
                disabled={item.disabled}
                className={cn(
                  "shrink-0",
                  item.active && "bg-accent text-accent-foreground",
                  item.variant === 'danger' && "text-destructive hover:text-destructive",
                )}
                aria-label={item.label}
                aria-pressed={item.active}
              >
                {item.icon && (
                  <span className="flex items-center justify-center">
                    {item.icon}
                  </span>
                )}
                {!item.icon && (
                  <span className="text-xs font-medium">
                    {item.label}
                  </span>
                )}
              </Button>
            )

            if (item.tooltip) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    {buttonContent}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.id}>{buttonContent}</div>
          }

          return null
        })}
      </div>
    </TooltipProvider>
  )
} 