"use client";

import { UserButton } from "@clerk/nextjs";

export function UserCard() {
  return (
    <div className="flex items-center transform scale-[.5625]">
      <UserButton />
    </div>
  );
}
