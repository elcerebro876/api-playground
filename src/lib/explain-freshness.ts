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
  const days = Math.floor(seconds / (24 * 3600));
  return `from cache ${Math.max(1, days)} days ago`;
}
