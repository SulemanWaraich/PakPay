import { NextResponse } from "next/server";

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  const err = error as { code?: string; name?: string; meta?: { target?: string[] } };

  if (err.code === "P2002") {
    const target = err.meta?.target;
    if (Array.isArray(target)) {
      if (target.includes("email")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This email is already in use. Sign in or use a different email.",
          },
          { status: 400 },
        );
      }
      if (target.includes("number")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This phone number is already in use. Sign in or use a different number.",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json(
      {
        success: false,
        message:
          "This information is already registered. Please use different details.",
      },
      { status: 400 },
    );
  }

  if (String(err.code) === "11000") {
    return NextResponse.json(
      {
        success: false,
        message: "An account with this email or phone number already exists.",
      },
      { status: 400 },
    );
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return NextResponse.json(
      {
        success: false,
        message: "This value is already taken. Try different details.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "We could not complete your request. Please try again in a moment.",
    },
    { status: 500 },
  );
}
