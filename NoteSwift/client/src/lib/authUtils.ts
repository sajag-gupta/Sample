export function isUnauthorizedError(error: Error): boolean {
  return /^(401|403):/.test(error.message) || 
         error.message.includes("Unauthorized") || 
         error.message.includes("Access token required") ||
         error.message.includes("Invalid or expired token");
}

export function getAuthHeader(token: string | null): Record<string, string> {
  if (!token) return {};
  return {
    "Authorization": `Bearer ${token}`,
  };
}

export function handleAuthError(error: Error, onUnauthorized: () => void) {
  if (isUnauthorizedError(error)) {
    onUnauthorized();
    return true;
  }
  return false;
}
