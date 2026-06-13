import { getRedis } from "./redisClient";

export async function publishAppEvent(data: Record<string, unknown>): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.publish("web-app-channel", JSON.stringify(data));
  } catch (error) {
    console.error("[publishAppEvent]", error);
  }
}
