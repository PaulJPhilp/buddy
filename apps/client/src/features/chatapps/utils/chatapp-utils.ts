export function isValidChatAppId(id: string): boolean {
  return id.trim().length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}
