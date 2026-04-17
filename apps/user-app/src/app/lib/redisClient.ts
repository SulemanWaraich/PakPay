import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (client?.isOpen) {
    return client;
  }
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const next = createClient({ url });
  next.on("error", (err) => console.error("[redis]", err));
  await next.connect();
  client = next as RedisClientType;
  return client;
}
