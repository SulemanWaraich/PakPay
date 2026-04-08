import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";

function getRedisUrl(): string {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST ?? "localhost";
  const port = process.env.REDIS_PORT ?? "6379";
  return `redis://${host}:${port}`;
}

async function startServer() {
  const corsOrigin = process.env.SOCKET_CORS_ORIGIN ?? "http://localhost:3000";
  const port = Number(process.env.PORT ?? "5000");

  // 1. Create WebSocket server
  const server = http.createServer();
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
    },
  })

  // 2. Redis subscriber
  const subscriber = createClient({ url: getRedisUrl() });
  await subscriber.connect();
  console.log("Redis Subscriber connected");

  // 3. Listen for frontend connections
  io.on("connection", (socket) => {
    const merchantId = socket.handshake.auth.merchantId;

    if (merchantId) {
      socket.join(`merchant-${merchantId}`);
      console.log(`Merchant connected to room merchant-${merchantId}`);
    }
  });

  // 4. Subscribe once
  await subscriber.subscribe("web-app-channel", (message) => {
    const data = JSON.parse(message);

    console.log("🔥 Event Received from bank-webhook:", data);

     switch (data.type) {
    case "merchantSettlementSuccess":
      io.to(`merchant-${data.merchantId}`).emit("settlementEvent", data);
      break;

    case "merchantPaymentSuccess":
      console.log("📢 Emitting paymentEvent...", data);
      io.to(`merchant-${data.merchantId}`).emit("paymentEvent", data);
      break;

    default:
      console.log("⚠ Unknown event type:", data.type);
      io.emit("bankWebhookEvent", data);
  }
  });

  // 5. Start WebSocket server
  server.listen(port, () => {
    console.log(`🔥 Notification server running on port ${port}`);
  });
}

startServer();
