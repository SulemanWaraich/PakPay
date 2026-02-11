import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";

async function startServer() {
  // 1. Create WebSocket server
  const server = http.createServer();
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // your frontend URL
    },
  })

  // 2. Redis subscriber
  const subscriber = createClient({ url: "redis://localhost:6379" });
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
  server.listen(5001, () => {
    console.log("🔥 Notification server running on port 5001");
  });
}

startServer();
