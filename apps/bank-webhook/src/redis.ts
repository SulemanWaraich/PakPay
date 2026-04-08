// bank-webhook/redis.js
import { createClient } from "redis";

export const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

export async function publishEvent(channel: string, data: unknown) {
  await redisClient.publish(channel, JSON.stringify(data));
  console.log(`Published to ${channel}:`, data);
}
