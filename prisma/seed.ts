import { faker } from "@faker-js/faker";
import { PrismaClient, Role } from "@prisma/client";
import slugify from "slugify";
import { createPasswordHash } from "~/utils/misc";

const db = new PrismaClient();

async function seed() {
  // Delete all records from all tables
  await db.itemOrder.deleteMany();
  await db.invoice.deleteMany();
  await db.order.deleteMany();
  await db.transaction.deleteMany();
  await db.wallet.deleteMany();
  await db.categoryItem.deleteMany();
  await db.item.deleteMany();
  await db.foodTruckSchedule.deleteMany();
  await db.staff.deleteMany();
  await db.manager.deleteMany();
  await db.foodTruck.deleteMany();
  await db.category.deleteMany();
  await db.admin.deleteMany();
  await db.customer.deleteMany();
  await db.user.deleteMany();
  await db.profile.deleteMany();

  // Create a customer
  const customerProfile = await db.profile.create({
    data: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      phoneNo: "123-456-7890",
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      state: faker.address.state(),
      zipCode: faker.address.zipCode(),
    },
  });

  const customerUser = await db.user.create({
    data: {
      email: "user@app.com",
      passwordHash: await createPasswordHash("password"),
      role: Role.CUSTOMER,
      profileId: customerProfile.id,
    },
  });

  // Create a wallet for the customer
  const customerWallet = await db.wallet.create({
    data: {
      balance: 1000,
    },
  });

  await db.customer.create({
    data: {
      userId: customerUser.id,
      walletId: customerWallet.id,
    },
  });

  // Create an admin
  const adminProfile = await db.profile.create({
    data: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    },
  });

  const adminUser = await db.user.create({
    data: {
      email: "admin@app.com",
      passwordHash: await createPasswordHash("password"),
      role: Role.ADMIN,
      profileId: adminProfile.id,
    },
  });

  await db.admin.create({
    data: {
      userId: adminUser.id,
    },
  });

  const IndianCategory = await db.category.create({
    data: {
      name: "Indian",
      imageUrl: "https://cdn.pixabay.com/photo/2024/05/31/05/47/ai-generated-8799843_1280.jpg",
    },
  });

  const MexicanCategory = await db.category.create({
    data: {
      name: "Mexican",
      imageUrl: "https://cdn.pixabay.com/photo/2024/05/19/13/19/ai-generated-8772597_1280.jpg",
    },
  });

  const ItalianCategory = await db.category.create({
    data: {
      name: "Italian",
      imageUrl: "https://cdn.pixabay.com/photo/2024/08/13/21/21/ai-generated-8967244_1280.jpg",
    },
  });

  const ft1 = await db.foodTruck.create({
    data: {
      name: "Sloppy Sandwiches",
      slug: slugify("Sloppy Sandwiches", { lower: true, strict: true }),
      location: "1234 Main St, San Francisco, CA 94111",
      phoneNo: "123-456-7890",
      image:
        "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80",
      items: {
        create: [
          {
            name: "Burger",
            image:
              "https://images.unsplash.com/photo-1568901346375-23c0b8199d4d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=999&q=80",
            price: Number(faker.finance.amount(5, 50, 2)),
            quantity: 1,
            slug: slugify("burger-20", { lower: true, strict: true }),
            description:
              "Sink your teeth into juicy perfection with our mouth-watering burgers, made to order and served fresh from our food truck!",
            categories: {
              create: {
                category: {
                  connect: {
                    id: ItalianCategory.id,
                  },
                },
              },
            },
          },
          {
            name: "Pizza",
            image:
              "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
            price: Number(faker.finance.amount(5, 50, 2)),
            quantity: 1,
            slug: slugify("pizza-02", { lower: true, strict: true }),
            description:
              "Hot, fresh, and always on-the-go: grab a slice of heaven from our sizzling food truck today!",
            categories: {
              create: {
                category: {
                  connect: {
                    id: ItalianCategory.id,
                  },
                },
              },
            },
          },
          {
            name: "Mac & Cheese",
            image:
              "https://plus.unsplash.com/premium_photo-1669687760005-89584766cd99?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
            price: Number(faker.finance.amount(5, 50, 2)),
            quantity: 1,
            slug: slugify("Mac & Cheese-20", { lower: true, strict: true }),
            description:
              "Get your comfort food fix with our creamy, cheesy mac & cheese, made with love and ready to warm your soul from our food truck!",
            categories: {
              create: {
                category: {
                  connect: {
                    id: ItalianCategory.id,
                  },
                },
              },
            },
          },
          {
            name: "Paneer Tikka",
            image:
              "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFuZWVyJTIwdGlra2F8ZW58MHx8MHx8fDA%3D",
            price: Number(faker.finance.amount(5, 50, 2)),
            quantity: 1,
            slug: slugify("Paneer Tikka-20", { lower: true, strict: true }),
            description:
              "Get your comfort food fix with our creamy, cheesy mac & cheese, made with love and ready to warm your soul from our food truck!",
            categories: {
              create: {
                category: {
                  connect: {
                    id: IndianCategory.id,
                  },
                },
              },
            },
          },
        ],
      },
      manager: {
        create: {
          user: {
            create: {
              email: "manager@app.com",
              passwordHash: await createPasswordHash("password"),
              role: Role.MANAGER,
              profile: {
                create: {
                  firstName: "FT1 Manager",
                  lastName: "FT1 Manager",
                },
              },
            },
          },
        },
      },
    },
  });

  const ft2 = await db.foodTruck.create({
    data: {
      name: "Good Food on Wheels",
      slug: slugify("grab-on-wheels", { lower: true, strict: true }),
      location: "1234 Main St, Cincinnati, OH 94111",
      phoneNo: "123-456-7890",
      image:
        "https://images.unsplash.com/photo-1567129937968-cdad8f07e2f8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1049&q=80",
      items: {
        create: [
          {
            name: "Nachos",
            image:
              "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=735&q=80",
            price: Number(faker.finance.amount(5, 50, 2)),
            quantity: 1,
            slug: slugify("Nachos-05", { lower: true, strict: true }),
            description:
              "Crunchy, cheesy, and loaded with flavor: our nachos are the ultimate snack to satisfy your cravings on-the-go from our food truck!",
            categories: {
              create: {
                category: {
                  connect: {
                    id: MexicanCategory.id,
                  },
                },
              },
            },
          },
          {
            name: "Tacos",
            image:
              "https://images.unsplash.com/photo-1620589125156-fd5028c5e05b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2687&q=80",
            price: Number(faker.finance.amount(5, 50, 2)),
            quantity: 1,
            slug: slugify("taco-s2", { lower: true, strict: true }),
            description:
              "Spice up your day with our delicious tacos, packed with fresh ingredients and bursting with authentic flavors from our food truck!",
            categories: {
              create: {
                category: {
                  connect: {
                    id: MexicanCategory.id,
                  },
                },
              },
            },
          },
          {
            name: "Mexican Rice",
            image:
              "https://images.unsplash.com/photo-1563861019306-9cccb83bdf0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2671&q=80",
            price: Number(faker.finance.amount(5, 50, 2)),
            quantity: 1,
            slug: slugify("mexican-rice", { lower: true, strict: true }),
            description:
              "Take your taste buds on a journey with our savory Mexican rice, a perfect side dish that will transport you straight to the heart of Mexico, from our food truck!",
            categories: {
              create: {
                category: {
                  connect: {
                    id: MexicanCategory.id,
                  },
                },
              },
            },
          },
        ],
      },
      manager: {
        create: {
          user: {
            create: {
              email: "manager02@app.com",
              passwordHash: await createPasswordHash("password"),
              role: Role.MANAGER,
              profile: {
                create: {
                  firstName: "FT2 Manager",
                  lastName: "FT2 Manager",
                },
              },
            },
          },
        },
      },
    },
  });

  await db.foodTruckSchedule.createMany({
    data: [
      {
        day: "Monday",
        // convert 10am to date object
        startTime: new Date(Date.parse("2023-04-24T10:00:00")),
        endTime: new Date(Date.parse("2023-04-24T17:00:00")),
        foodTruckId: ft1.id,
      },
      {
        day: "Wednesday",
        // convert 10am to date object
        startTime: new Date(Date.parse("2023-04-24T10:00:00")),
        endTime: new Date(Date.parse("2023-04-24T17:00:00")),
        foodTruckId: ft1.id,
      },
      {
        day: "Friday",
        // convert 10am to date object
        startTime: new Date(Date.parse("2023-04-24T10:00:00")),
        endTime: new Date(Date.parse("2023-04-24T17:00:00")),
        foodTruckId: ft1.id,
      },
      {
        day: "Sunday",
        // convert 10am to date object
        startTime: new Date(Date.parse("2023-04-24T10:00:00")),
        endTime: new Date(Date.parse("2023-04-24T17:00:00")),
        foodTruckId: ft1.id,
      },
    ],
  });

  await db.foodTruckSchedule.createMany({
    data: [
      {
        day: "Tuesday",
        startTime: new Date(Date.parse("2023-04-25T10:00:00")),
        endTime: new Date(Date.parse("2023-04-25T17:00:00")),
        foodTruckId: ft2.id,
      },
      {
        day: "Thursday",
        startTime: new Date(Date.parse("2023-04-25T10:00:00")),
        endTime: new Date(Date.parse("2023-04-25T17:00:00")),
        foodTruckId: ft2.id,
      },
      {
        day: "Saturday",
        startTime: new Date(Date.parse("2023-04-25T10:00:00")),
        endTime: new Date(Date.parse("2023-04-25T17:00:00")),
        foodTruckId: ft2.id,
      },
    ],
  });

  console.log("Database has been seeded. 🌱");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
