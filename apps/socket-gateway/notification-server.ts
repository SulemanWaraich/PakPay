import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

function getRedisUrl(): string {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST ?? "localhost";
  const port = process.env.REDIS_PORT ?? "6379";
  return `redis://${host}:${port}`;
}

function parseCorsOrigins(): string | string[] {
  const raw = process.env.SOCKET_CORS_ORIGIN ?? "http://localhost:3000";
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 1 ? list[0]! : list;
}

async function startServer() {
  const port = Number(process.env.PORT ?? "5000");
  const server = http.createServer();

  server.prependListener("request", (req, res) => {
    if (req.method === "GET" && req.url?.split("?")[0] === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "socket-gateway" }));
    }
  });

  const io = new Server(server, {
    cors: {
      origin: parseCorsOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const subscriber = createClient({ url: getRedisUrl() });
  await subscriber.connect();
  logger.info("Redis subscriber connected");

  io.on("connection", (socket) => {
    const merchantId = socket.handshake.auth.merchantId;

    if (merchantId) {
      socket.join(`merchant-${merchantId}`);
      logger.info("Merchant joined room", { merchantId });
    }
  });

  await subscriber.subscribe("web-app-channel", (message) => {
    const data = JSON.parse(message);
    logger.info("Redis event", { type: data.type });

    switch (data.type) {
      case "merchantSettlementSuccess":
        io.to(`merchant-${data.merchantId}`).emit("settlementEvent", data);
        break;

      case "merchantPaymentSuccess":
        io.to(`merchant-${data.merchantId}`).emit("paymentEvent", data);
        break;

      default:
        io.emit("bankWebhookEvent", data);
    }
  });

  server.listen(port, () => {
    logger.info("Socket gateway listening", { port });
  });
}

startServer().catch((e) => {
  logger.error("Fatal", { error: String(e) });
  process.exit(1);
});
