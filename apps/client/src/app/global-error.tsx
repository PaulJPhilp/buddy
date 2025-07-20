"use client";

import { ErrorBoundary } from "@buddy/ui/components/ui/error-boundary";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary
          fallback={
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-8">
              <h2 className="text-lg font-semibold text-red-600">
                Critical Error
              </h2>
              <p className="text-sm text-gray-600">
                {error.message || "A critical error occurred"}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500">
                  Error ID: {error.digest}
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          }
        >
          <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-8">
            <h2 className="text-lg font-semibold text-red-600">
              Critical Error
            </h2>
            <p className="text-sm text-gray-600">
              {error.message || "A critical error occurred"}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500">Error ID: {error.digest}</p>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
