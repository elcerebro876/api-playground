// A saved explanation keeps its original createdAt, so it must not claim to be
// fresh. This reports how long ago the user saved it instead.
export function formatSavedAge(
  savedAt: number,
  now: number = Date.now(),
): string {
  if (!Number.isFinite(savedAt)) return "just now";
  const seconds = Math.max(0, Math.floor((now - savedAt) / 1000));
  if (seconds < 60) return "just now";
  const hours = Math.floor(seconds / 3600);
  if (seconds < 24 * 3600) return `${Math.max(1, hours)}h ago`;
  const days = Math.max(1, Math.floor(seconds / (24 * 3600)));
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export function formatFreshness(
  createdAt: string,
  fromCache: boolean,
  now: number = Date.now(),
): string {
  if (!fromCache) return "Explained just now";
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return "Just now";
  const seconds = Math.max(0, Math.floor((now - created) / 1000));
  if (seconds < 60) return "Just now";
  const hours = Math.floor(seconds / 3600);
  if (seconds < 24 * 3600) return `from cache ${Math.max(1, hours)}h ago`;
  const days = Math.max(1, Math.floor(seconds / (24 * 3600)));
  return `from cache ${days} ${days === 1 ? "day" : "days"} ago`;
}
