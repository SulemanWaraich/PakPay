import { createClient } from "redis";
import { logger } from "./logger.ts";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => logger.error("Redis client error", { err: String(err) }));

export async function connectRedis() {
  await redisClient.connect();
}

export async function publishEvent(channel: string, data: unknown) {
  await redisClient.publish(channel, JSON.stringify(data));
  logger.info("Published redis event", { channel, type: (data as { type?: string }).type });
}