"use client";

import { LoadDebugInfo } from "@/features/application/components/LoadDebugInfo";
import { ApplicationContainer } from "@/features/application/container/ApplicationContainer";

export default function HomePage(): React.ReactElement {
  return (
    <>
      <ApplicationContainer />
      <LoadDebugInfo />
      {/* Development Links - Only show in development */}
      {/* Chat App Dev button removed */}
    </>
  );
}
