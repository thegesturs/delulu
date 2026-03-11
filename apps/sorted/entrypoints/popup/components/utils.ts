/** biome-ignore-all lint/performance/useTopLevelRegex: <explanation> */

const REEL_URL_REGEX =
  /instagram\.com\/([^/]+)\/reel\/|instagram\.com\/reel\/([^/?]+)/;

export function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${Math.round(seconds)}s`;
}

export function extractReelLabel(reelUrl: string): string {
  const match = reelUrl.match(REEL_URL_REGEX);
  if (match) {
    const username = match[1];
    if (username && username !== "reel") {
      return `@${username}`;
    }
  }
  const idMatch = reelUrl.match(/\/reel\/([^/?]+)/);
  return idMatch ? `Reel ${idMatch[1].slice(0, 8)}...` : "Reel";
}
