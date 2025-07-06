"use client";

import { useEffect, useState } from "react";

export interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A wrapper component that ensures its children are only rendered on the client.
 * This is useful for components that rely on browser-specific APIs or have
 * issues with server-side rendering and hydration.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? <>{children}</> : <>{fallback}</>;
}
