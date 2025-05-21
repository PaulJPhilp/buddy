"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(var(--background))] group-[.toaster]:text-[hsl(var(--foreground))] group-[.toaster]:border group-[.toaster]:border-[hsl(var(--border))] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[hsl(var(--muted-foreground))]",
          actionButton:
            "group-[.toast]:bg-[hsl(var(--primary))] group-[.toast]:text-[hsl(var(--primary-foreground))]",
          cancelButton:
            "group-[.toast]:bg-[hsl(var(--muted))] group-[.toast]:text-[hsl(var(--muted-foreground))]",
          error:
            "group-[.toaster]:bg-[hsl(var(--destructive))] group-[.toaster]:text-[hsl(var(--destructive-foreground))]",
          success:
            "group-[.toaster]:bg-[hsl(var(--success))] group-[.toaster]:text-[hsl(var(--success-foreground))]",
          warning:
            "group-[.toaster]:bg-[hsl(var(--warning))] group-[.toaster]:text-[hsl(var(--warning-foreground))]",
          info: "group-[.toaster]:bg-[hsl(var(--info))] group-[.toaster]:text-[hsl(var(--info-foreground))]",
        },
      }}
      position="top-center"
      richColors={false}
      expand={false}
      duration={4000}
      visibleToasts={3}
      closeButton={true}
      offset="32px"
    />
  );
}
