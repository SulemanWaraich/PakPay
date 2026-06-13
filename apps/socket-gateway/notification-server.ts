import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import winston from "winston";
import prisma from "./src/prismaClient.js";
import {
  verifyMerchantRoomAccess,
  verifySocketToken,
} from "./src/socketAuth.js";

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

  io.use(async (socket, next) => {
    const raw = socket.handshake.auth.token;
    const token = typeof raw === "string" ? raw.trim() : "";

    if (!token) {
      return next(new Error("unauthorized"));
    }

    const verified = await verifySocketToken(token);
    if (!verified) {
      return next(new Error("unauthorized"));
    }

    socket.data.userId = verified.userId;
    socket.data.role = verified.role;
    next();
  });

  const subscriber = createClient({ url: getRedisUrl() });
  await subscriber.connect();
  logger.info("Redis subscriber connected");

  io.on("connection", async (socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    socket.join(`user-${userId}`);
    logger.info("User joined room", { userId, role });

    if (role === "MERCHANT") {
      const profile = await prisma.merchantProfile.findUnique({
        where: { userId },
        select: { id: true, userId: true },
      });

      if (profile) {
        socket.join(`merchant-${profile.userId}`);
        logger.info("Merchant joined room", { merchantUserId: profile.userId });
      }

      const rawMerchantId = socket.handshake.auth.merchantId;
      const requestedProfileId =
        rawMerchantId != null ? Number(rawMerchantId) : NaN;

      if (Number.isFinite(requestedProfileId) && requestedProfileId > 0) {
        const ownerUserId = await verifyMerchantRoomAccess(
          requestedProfileId,
          userId,
        );
        if (ownerUserId != null) {
          socket.join(`merchant-${ownerUserId}`);
        }
      }
    }
  });

  await subscriber.subscribe("web-app-channel", (message) => {
    const data = JSON.parse(message);
    logger.info("Redis event", { type: data.type });

    switch (data.type) {
      case "merchantSettlementSuccess":
        io.to(`merchant-${data.merchantId}`).emit("settlementEvent", {
          type: data.type,
          merchantId: data.merchantId,
          amount: data.amount,
          settlementId: data.settlementId,
        });
        break;

      case "merchantPaymentSuccess":
        io.to(`merchant-${data.merchantId}`).emit("paymentEvent", {
          type: data.type,
          merchantId: data.merchantId,
          amount: data.amount,
          token: data.token,
        });
        break;

      case "onRampSuccess":
      case "offRampSuccess":
        if (data.userId != null) {
          io.to(`user-${data.userId}`).emit(data.type, {
            type: data.type,
            userId: data.userId,
            amount: data.amount,
            token: data.token,
          });
        }
        break;

      case "p2pTransferAdded":
        if (data.fromUserId != null) {
          io.to(`user-${data.fromUserId}`).emit("p2pTransferAdded", data);
        }
        if (data.toUserId != null) {
          io.to(`user-${data.toUserId}`).emit("p2pTransferAdded", data);
        }
        break;

      default:
        logger.warn("Unhandled Redis event type", { type: data.type });
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
