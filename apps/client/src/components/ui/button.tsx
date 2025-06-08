"use client";

import { cn } from "@/lib/utils";
import React from "react";

// Define button variants and sizes
const variants = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  outline:
    "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50",
  ghost: "bg-transparent hover:bg-gray-100",
  link: "bg-transparent underline-offset-4 hover:underline text-blue-600",
};

const sizes = {
  default: "h-10 py-2 px-4",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-8 text-lg",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
