import { db } from "~/lib/db.server";

export function getAllRestaurants() {
  return db.foodTruck.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      location: true,
      image: true,
      phoneNo: true,
      items: true,
      schedule: true,
      staff: true,
      slug: true,
      description: true,
    },
  });
}

export type getAllRestaurantsType = Awaited<ReturnType<typeof getAllRestaurants>>;

export function getAllCategories() {
  return db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export function getRestaurantBySlug(slug: string) {
  return db.foodTruck.findUnique({
    where: {
      slug,
    },
    select: {
      name: true,
      location: true,
      image: true,
      phoneNo: true,
      items: true,
      schedule: true,
      staff: true,
      slug: true,
      description: true,
    },
  });
}

export type getFoodTruckBySlugType = Awaited<ReturnType<typeof getRestaurantBySlug>>;
