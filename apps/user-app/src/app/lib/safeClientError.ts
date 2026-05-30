import { Prisma } from "@prisma/client";

/** Maps known errors to safe user-facing text (no Prisma/stack leakage). */
export function safeP2pTransferErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Duplicate transaction detected";
    }
    if (error.code === "P2034") {
      return "Transfer failed, please try again";
    }
  }

  if (
    error instanceof Error &&
    error.message === "Insufficient funds to complete transfer."
  ) {
    return error.message;
  }

  return "Transfer failed due to an internal error";
}
