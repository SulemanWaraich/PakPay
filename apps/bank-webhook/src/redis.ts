// bank-webhook/redis.js
import { createClient } from "redis";

export const redisClient = createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

export async function publishEvent(channel: string, data: unknown) {
  await redisClient.publish(channel, JSON.stringify(data));
  console.log(`Published to ${channel}:`, data);
}
