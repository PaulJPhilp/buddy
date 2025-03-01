"use client";

import React from "react";
import { Button } from "../ui/button";
import { LoaderIcon } from "../ui/icons";

// Import the useFormStatus hook directly from React
import { useFormStatus as useReactFormStatus } from "react-dom";

export function SubmitButton({
  children,
  isSuccessful,
  isPending,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
  isPending?: boolean;
}) {
  // Try to use React's built-in hook, but provide a fallback if it fails
  let pending = false;
  
  try {
    // This is wrapped in try/catch because the hook might not be available
    // in all React environments
    const formStatus = useReactFormStatus();
    pending = formStatus?.pending || false;
  } catch (e) {
    // Fallback to the prop if the hook is not available
    pending = isPending || false;
  }
  
  // Allow manual override of pending state via props
  if (isPending !== undefined) {
    pending = isPending;
  }

  return (
    <Button
      type={pending ? "button" : "submit"}
      aria-disabled={pending || isSuccessful}
      disabled={pending || isSuccessful}
      className="relative"
    >
      {children}

      {(pending || isSuccessful) && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}
    </Button>
  );
}
