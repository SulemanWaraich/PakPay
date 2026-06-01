import { getRedis } from "./redisClient";
import { logger } from "./logger";

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
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      logger.error("rate_limit_redis_unavailable", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
    return true;
  }
}
