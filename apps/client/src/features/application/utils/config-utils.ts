export function isValidConfigPath(path: string): boolean {
  return path.trim().length > 0 && path.includes(".");
}

export function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
