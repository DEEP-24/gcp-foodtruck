import { type Invoice, type Order, type OrderType, PaymentMethod, type User, OrderStatus, Customer } from "@prisma/client";
import type { CartItem } from "~/context/CartContext";
import { db } from "~/lib/db.server";

export function getOrders(userId: User["id"]) {
  return db.order.findMany({
    where: {
      customer: {
        userId: userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      invoice: true,
      id: true,
      status: true,
      pickupDateTime: true,
      items: {
        include: {
          item: true,
        },
      },
      feedback: true,
      createdAt: true,
    },
  });
}

export function createOrder({
  customerId,
  items,
  amount,
  orderType,
  paymentMethod,
  pickupDateTime,
}: {
  customerId: Customer["id"];
  items: Array<CartItem>;
  amount: Invoice["amount"];
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  pickupDateTime: Order["pickupDateTime"];
}) {
  return db.$transaction(async (tx) => {
    // Check if customerId is defined
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    // Find the customer associated with the user
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new Error(`Customer not found with ID: ${customerId}`);
    }

    // If payment method is wallet, check balance and deduct amount
    if (paymentMethod === PaymentMethod.WALLET) {
      const wallet = await tx.wallet.findFirst({
        where: { Customer: { some: { id: customer.id } } },
        select: { id: true, balance: true },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.balance < amount) {
        throw new Error("Insufficient wallet balance");
      }

      // Deduct amount from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      // Create a wallet transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: "PAYMENT",
        },
      });
    }

    // Create the order
    const order = await tx.order.create({
      data: {
        customer: {
          connect: { id: customer.id },
        },
        type: orderType,
        status: OrderStatus.PENDING,
        pickupDateTime,
        items: {
          create: items.map((item) => ({
            quantity: item.quantity,
            item: { connect: { id: item.id } },
          })),
        },
        invoice: {
          create: {
            amount,
            totalAmount: amount,
            paymentMethod,
          },
        },
      },
    });

    return order;
  });
}

export async function cancelOrder(orderId: Order["id"]) {
  const order = await db.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: {
        include: {
          item: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return db.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: OrderStatus.CANCELLED,
    },
  });
}
