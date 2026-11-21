const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";

export function getArgentinaDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getPreviousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return utcDate.toISOString().slice(0, 10);
}

export function formatDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function fnv1aHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Picks a friend deterministically for a dateKey, avoiding recently selected
 * friends when the pool allows it.
 */
export function pickDailyFriendId(
  poolIds: string[],
  recentIds: string[],
  dateKey: string
): string {
  if (poolIds.length === 0) {
    throw new Error("No hay amigos activos en el pool para sortear.");
  }
  if (poolIds.length === 1) {
    return poolIds[0];
  }

  const sortedPool = [...poolIds].sort();
  const recentSet = new Set(recentIds);
  let candidates = sortedPool.filter((id) => !recentSet.has(id));

  // If every friend appeared recently, exclude at least yesterday's friend.
  if (candidates.length === 0 && recentIds.length > 0) {
    const yesterdayId = recentIds[0];
    candidates = sortedPool.filter((id) => id !== yesterdayId);
  }

  if (candidates.length === 0) {
    candidates = sortedPool;
  }

  const index = fnv1aHash(`paladle:${dateKey}`) % candidates.length;
  return candidates[index];
}
