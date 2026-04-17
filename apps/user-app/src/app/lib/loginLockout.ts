import { getRedis } from "./redisClient";

const PREFIX = "loginfail:";
const MAX = 5;
const WINDOW_SEC = 15 * 60;

function key(email: string) {
  return `${PREFIX}${email.trim().toLowerCase()}`;
}

export async function isLoginLocked(email: string): Promise<boolean> {
  try {
    const r = await getRedis();
    const n = await r.get(key(email));
    return Number(n ?? 0) >= MAX;
  } catch {
    return false;
  }
}

export async function recordLoginFailure(email: string): Promise<void> {
  try {
    const r = await getRedis();
    const k = key(email);
    const n = await r.incr(k);
    if (n === 1) {
      await r.expire(k, WINDOW_SEC);
    }
  } catch {
    // ignore
  }
}

export async function clearLoginFailures(email: string): Promise<void> {
  try {
    const r = await getRedis();
    await r.del(key(email));
  } catch {
    // ignore
  }
}
