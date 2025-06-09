"use client";

import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import { useState } from "react";

interface CreateChatDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onCreateChatAction: ({
    appName,
    displayName,
  }: {
    appName: string;
    displayName: string;
  }) => void;
}

export function CreateChatDialog({
  isOpen,
  onCloseAction,
  onCreateChatAction,
}: CreateChatDialogProps) {
  const [appName, setAppName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    appName?: string;
    displayName?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      appName?: string;
      displayName?: string;
    } = {};

    if (!appName.trim()) {
      newErrors.appName = "App name is required";
    } else if (!/^[a-z0-9-]+$/.test(appName)) {
      newErrors.appName =
        "Only lowercase letters, numbers, and hyphens are allowed";
    }

    if (!displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    if (validateForm()) {
      console.log("Form validated successfully");
      setIsSubmitting(true);
      try {
        console.log("Calling onCreateChatAction with:", {
          appName,
          displayName,
        });
        onCreateChatAction({ appName, displayName });
        setAppName("");
        setDisplayName("");
        setErrors({});
        console.log("Calling onCloseAction");
        onCloseAction();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("Form validation failed with errors:", errors);
    }
  };

  // If the dialog is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  // Use a simple approach similar to the debug dialog
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Create New Test Container
          </h2>
          <p className="text-sm text-muted-foreground">
            Create a new test container by filling out the form below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="app-name" className="text-right">
                Container ID
              </Label>
              <div className="col-span-3">
                <Input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="test-container-1"
                  className={errors.appName ? "border-red-500" : ""}
                />
                {errors.appName && (
                  <p className="text-red-500 text-sm mt-1">{errors.appName}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="display-name" className="text-right">
                Display Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="My Test Container"
                  className={errors.displayName ? "border-red-500" : ""}
                />
                {errors.displayName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.displayName}
                  </p>
                )}
              </div>
            </div>
            {/* Chat type field removed */}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("Cancel button clicked");
                onCloseAction();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Container"}
            </Button>
          </div>
        </form>

        {/* Close button in the top-right corner */}
        <button
          type="button"
          onClick={() => {
            console.log("Close button clicked");
            onCloseAction();
          }}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
            <path d="M14 9l-5 5m0 0l5 5m-5-5h12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
