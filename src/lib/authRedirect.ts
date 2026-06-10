export function getLoginPath(returnTo?: string): string {
  if (!returnTo || !isSafeReturnPath(returnTo)) return "/login";
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function isSafeReturnPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function getPostAuthPath(
  returnTo: string | null,
  role: string | undefined
): string {
  if (returnTo && isSafeReturnPath(returnTo)) {
    return returnTo;
  }
  if (role === "creator") return "/dashboard";
  return "/feed";
}
