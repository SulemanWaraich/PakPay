import type { UserRole } from "@prisma/client";

declare module "socket.io" {
  interface SocketData {
    userId: number;
    role: UserRole;
  }
}
