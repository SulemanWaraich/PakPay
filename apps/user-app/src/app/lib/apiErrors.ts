import { NextResponse } from "next/server";

export function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json(
    { success: false, error: { message, ...(code ? { code } : {}) } },
    { status },
  );
}
