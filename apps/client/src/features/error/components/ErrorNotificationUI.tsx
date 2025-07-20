import React from "react";
import { AppError, FatalError, HandledError } from "../errors";

interface ErrorNotificationUIProps {
  error: AppError | FatalError | HandledError;
  onClose: (errorId: string) => void;
}

export function ErrorNotificationUI({
  error,
  onClose,
}: ErrorNotificationUIProps) {
  const isFatal = error instanceof FatalError;
  const isHandled = error instanceof HandledError;

  const title = isFatal
    ? "Critical Error"
    : isHandled
      ? "Warning"
      : "Application Error";
  const message = error.message;
  const errorId = error instanceof HandledError ? error.details : error.message; // Use message as id for simplicity

  return (
    <div
      className={
        `mb-2 flex items-center justify-between rounded-md p-3 shadow-sm ` +
        `${isFatal ? "bg-red-100 border border-red-400 text-red-700" : "bg-yellow-100 border border-yellow-400 text-yellow-700"}`
      }
      role="alert"
    >
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm">{message}</p>
        {errorId && <p className="text-xs opacity-75">ID: {errorId}</p>}
      </div>
      <button
        onClick={() => onClose(errorId)}
        className="ml-4 rounded-full p-1 transition-colors hover:bg-gray-200"
        aria-label="Close alert"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
