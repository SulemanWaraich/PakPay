import { getRedis } from "./redisClient";

/**
 * Fixed-window rate limit using Redis INCR.
 * @returns true if under limit, false if exceeded
 */
export async function rateLimitAllow(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const r = await getRedis();
    const n = await r.incr(key);
    if (n === 1) {
      await r.expire(key, windowSeconds);
    }
    return n <= limit;
  } catch {
    // Fail open if Redis unavailable (avoid total outage)
    return true;
  }
}
