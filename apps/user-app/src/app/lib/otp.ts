import { randomInt } from "crypto";
import { getRedis } from "./redisClient";

export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_COOLDOWN_SECONDS = 60;

export type PendingRegistration = {
  email: string;
  number: string;
  password: string;
  name: string;
  role: "USER" | "MERCHANT";
};

export function otpKey(email: string): string {
  return `otp:${email.toLowerCase()}`;
}

export function otpAttemptsKey(email: string): string {
  return `otp:attempts:${email.toLowerCase()}`;
}

export function otpPayloadKey(email: string): string {
  return `otp:payload:${email.toLowerCase()}`;
}

export function otpCooldownKey(email: string): string {
  return `otp:cooldown:${email.toLowerCase()}`;
}

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export async function storeOtp(
  email: string,
  otp: string,
  payload: PendingRegistration,
): Promise<void> {
  const redis = await getRedis();
  const normalized = email.toLowerCase();

  await redis
    .multi()
    .set(otpKey(normalized), otp, { EX: OTP_TTL_SECONDS })
    .set(otpPayloadKey(normalized), JSON.stringify(payload), { EX: OTP_TTL_SECONDS })
    .del(otpAttemptsKey(normalized))
    .exec();
}

export async function getStoredOtp(email: string): Promise<string | null> {
  const redis = await getRedis();
  return redis.get(otpKey(email.toLowerCase()));
}

export async function getPendingRegistration(
  email: string,
): Promise<PendingRegistration | null> {
  const redis = await getRedis();
  const raw = await redis.get(otpPayloadKey(email.toLowerCase()));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingRegistration;
  } catch {
    return null;
  }
}

export async function clearOtp(email: string): Promise<void> {
  const redis = await getRedis();
  const normalized = email.toLowerCase();
  await redis.del([otpKey(normalized), otpPayloadKey(normalized), otpAttemptsKey(normalized)]);
}

export async function incrementOtpAttempts(email: string): Promise<number> {
  const redis = await getRedis();
  const key = otpAttemptsKey(email.toLowerCase());
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, OTP_TTL_SECONDS);
  }
  return attempts;
}

export async function isResendOnCooldown(email: string): Promise<boolean> {
  const redis = await getRedis();
  return (await redis.exists(otpCooldownKey(email.toLowerCase()))) === 1;
}

export async function setResendCooldown(email: string): Promise<void> {
  const redis = await getRedis();
  await redis.set(otpCooldownKey(email.toLowerCase()), "1", { EX: OTP_COOLDOWN_SECONDS });
}
