import { NextResponse } from "next/server";

export function handleApiError(error: any) {
  console.error("API Error:", error);

  // Prisma unique constraint
  if (error.code === "P2002") {
    return NextResponse.json(
      {
        success: false,
        message: "This value already exists. Please use a different one.",
      },
      { status: 400 }
    );
  }

  // Mongo duplicate key error
  if (error.code === 11000) {
    return NextResponse.json(
      {
        success: false,
        message: "An account with this information already exists.",
      },
      { status: 400 }
    );
  }

  // Sequelize unique constraint
  if (error.name === "SequelizeUniqueConstraintError") {
    return NextResponse.json(
      {
        success: false,
        message: "This value must be unique. Try a different one.",
      },
      { status: 400 }
    );
  }

  // Default fallback
  return NextResponse.json(
    {
      success: false,
      message: "Something went wrong. Please try again later.",
    },
    { status: 500 }
  );
}
