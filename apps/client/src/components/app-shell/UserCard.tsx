"use client";

import { UserButton } from "@clerk/nextjs";

export function UserCard() {
  return (
    <div className="flex items-center transform scale-75">
      <UserButton />
    </div>
  );
}
