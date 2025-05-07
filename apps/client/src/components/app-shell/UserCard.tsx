"use client";

import { UserButton } from "@clerk/nextjs";

export function UserCard() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <UserButton />
    </div>
  );
}
