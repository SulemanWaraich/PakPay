import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";

async function startServer() {
  // 1. Create WebSocket server
  const server = http.createServer();
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000", // configurable frontend URL
    },
  })

  // 2. Redis subscriber
  const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
  const subscriber = createClient({ url: redisUrl });
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

  // Health check endpoint
  server.on('request', (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
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
  const port = parseInt(process.env.PORT || '5000');
  server.listen(port, () => {
    console.log(`🔥 Notification server running on port ${port}`);
  });
}

startServer();
