import type { User, Profile, Customer } from "@prisma/client";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "~/lib/db.server";
import { createPasswordHash } from "~/utils/misc";

export async function getUserById(id: User["id"]) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      hasResetPassword: true,
      role: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      customer: {
        select: {
          id: true,
        },
      },
    },
  });
}

export async function getUserByEmail(email: User["email"]) {
  return db.user.findUnique({
    where: { email },
    select: {
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
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
  firstName: Profile["firstName"];
  lastName: Profile["lastName"];
  role?: User["role"];
}) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await createPasswordHash(password),
        role,
        profile: {
          create: {
            firstName,
            lastName,
          },
        },
      },
    });

    if (role === Role.CUSTOMER) {
      const customer = await tx.customer.create({
        data: {
          userId: user.id,
        },
      });

      await tx.wallet.create({
        data: {
          balance: 0,
          Customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
    }

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
  firstName: Profile["firstName"];
  lastName: Profile["lastName"];
  phoneNo: Profile["phoneNo"];
  address: Profile["address"];
}) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await createPasswordHash(password),
        role: Role.CUSTOMER,
        profile: {
          create: {
            firstName,
            lastName,
            phoneNo,
            address,
          },
        },
      },
    });

    const customer = await tx.customer.create({
      data: {
        userId: user.id,
      },
    });

    await tx.wallet.create({
      data: {
        balance: 0,
        Customer: {
          connect: {
            id: customer.id,
          },
        },
      },
    });

    return user;
  });
}

export async function verifyLogin(email: User["email"], password: string) {
  const userWithPassword = await db.user.findUnique({
    where: { email },
    include: {
      profile: true,
    },
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
