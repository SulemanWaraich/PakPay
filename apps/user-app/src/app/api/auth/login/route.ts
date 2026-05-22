import { NextResponse } from "next/server";
import { validateCredentials } from "../../../lib/credentialsAuth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request. Send email and password as JSON.",
      },
      { status: 400 },
    );
  }

  const result = await validateCredentials(
    body.email ?? "",
    body.password ?? "",
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, message: "Credentials valid" });
}
