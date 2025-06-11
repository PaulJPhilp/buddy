import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as React from "react";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

const AlertDialog: typeof AlertDialogPrimitive.Root = AlertDialogPrimitive.Root;
const AlertDialogTrigger: typeof AlertDialogPrimitive.Trigger =
  AlertDialogPrimitive.Trigger;
const AlertDialogPortal: typeof AlertDialogPrimitive.Portal =
  AlertDialogPrimitive.Portal;

const AlertDialogOverlay: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
  > &
    React.RefAttributes<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>
> = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
  > &
    React.RefAttributes<React.ElementRef<typeof AlertDialogPrimitive.Content>>
> = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className,
    )}
    {...props}
  />
));
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
));
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
  > &
    React.RefAttributes<React.ElementRef<typeof AlertDialogPrimitive.Title>>
> = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
  > &
    React.RefAttributes<
      React.ElementRef<typeof AlertDialogPrimitive.Description>
    >
> = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

const AlertDialogAction: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
  > &
    React.RefAttributes<React.ElementRef<typeof AlertDialogPrimitive.Action>>
> = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
  > &
    React.RefAttributes<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>
> = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className,
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
