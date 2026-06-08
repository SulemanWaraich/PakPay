import bcrypt from "bcryptjs";
import { prismaPlain } from "@repo/db";
import type { UserRole } from "@prisma/client";

export type RegisterUserInput = {
  email: string;
  number: string;
  password: string;
  name: string;
  role: UserRole;
  emailVerified?: Date;
};

export async function createRegisteredUser(input: RegisterUserInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  return prismaPlain.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        number: input.number.trim(),
        password: hashedPassword,
        role: input.role,
        emailVerified: input.emailVerified ?? new Date(),
      },
    });

    await tx.balance.create({
      data: {
        userId: user.id,
        amount: 0,
        locked: 0,
      },
    });

    if (input.role === "MERCHANT") {
      await tx.merchantProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    return user;
  });
}
