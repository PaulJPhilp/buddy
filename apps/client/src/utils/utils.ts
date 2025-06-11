import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a timestamp that is fixed relative to the current time
 * @param minutesAgo Number of minutes to subtract from current time
 */
export function getFixedTimestamp(minutesAgo: number): number {
  return Date.now() - minutesAgo * 60 * 1000;
}
