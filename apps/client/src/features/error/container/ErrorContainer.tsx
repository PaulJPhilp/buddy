import React from "react";
import { ErrorNotificationUI } from "../components/ErrorNotificationUI";
import { useErrorManager } from "../hooks/useErrorManager";

interface ErrorContainerProps {
  children?: React.ReactNode;
}

export function ErrorContainer({ children }: ErrorContainerProps) {
  const { errors, clearError } = useErrorManager();

  return (
    <div className="relative h-full w-full">
      {children}
      {errors.length > 0 && (
        <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
          {errors.map((error, index) => (
            <ErrorNotificationUI
              key={error.message || index}
              error={error}
              onClose={clearError}
            />
          ))}
        </div>
      )}
    </div>
  );
}
