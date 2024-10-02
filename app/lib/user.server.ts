import type { User } from "@prisma/client";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "~/lib/db.server";
import { createPasswordHash } from "~/utils/misc";

export async function getUserById(id: User["id"]) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      foodTruckId: true,
      hasResetPassword: true,
      role: true,
    },
  });
}

export async function getUserByEmail(email: User["email"]) {
  return db.user.findUnique({
    where: { email },
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  });
}

export async function createUser({
  email,
  password,
  firstName,
  lastName,
  role = Role.CUSTOMER,
}: {
  email: User["email"];
  password: string;
  firstName: User["firstName"];
  lastName: User["lastName"];
  role?: User["role"];
}) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: await createPasswordHash(password),
        role,
      },
    });

    await tx.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    });

    return user;
  });
}

export async function createCustomer({
  email,
  password,
  firstName,
  lastName,
  phoneNo,
  address,
}: {
  email: User["email"];
  password: string;
  firstName: User["firstName"];
  lastName: User["lastName"];
  phoneNo: User["phoneNo"];
  address: User["address"];
  role?: User["role"];
}) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNo,
        address,
        passwordHash: await createPasswordHash(password),
        role: Role.CUSTOMER,
      },
    });

    await tx.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    });

    return user;
  });
}

export async function verifyLogin(email: User["email"], password: string) {
  const userWithPassword = await db.user.findUnique({
    where: { email },
  });

  if (!userWithPassword || !userWithPassword.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, userWithPassword.passwordHash);

  if (!isValid) {
    return null;
  }

  const { passwordHash: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
