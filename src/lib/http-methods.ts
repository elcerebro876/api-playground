export const ALLOWED_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export function isAllowedMethod(m: string): boolean {
  const up = (m ?? "").trim().toUpperCase();
  return (ALLOWED_METHODS as readonly string[]).includes(up);
}