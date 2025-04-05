//@ts-nocheck
"use server";

import { sql } from "kysely";
import { DEFAULT_PAGE_SIZE } from "../../constant";
import { db } from "../../db";
import { InsertProducts, UpdateProducts } from "@/types";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/utils/authOptions";
import { cache } from "react";

// ✅ getProducts with pagination + sorting support
export async function getProducts(
  pageNo = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  sortBy = ""
) {
  try {
    // Get total product count
    const totalProducts = await db
      .selectFrom("products")
      .select(sql<number>`COUNT(*)`.as("count"))
      .executeTakeFirst();

    const count = totalProducts?.count || 0;
    const lastPage = Math.ceil(count / pageSize);

    // Build the query
    let query = db.selectFrom("products").selectAll().distinct();

    // ✅ Add sorting logic
    if (sortBy === "price_asc") {
      query = query.orderBy("price", "asc");
    } else if (sortBy === "price_desc") {
      query = query.orderBy("price", "desc");
    } else if (sortBy === "name_asc") {
      query = query.orderBy("name", "asc");
    } else if (sortBy === "name_desc") {
      query = query.orderBy("name", "desc");
    }

    // ✅ Add pagination
    const products = await query
      .offset((pageNo - 1) * pageSize)
      .limit(pageSize)
      .execute();

    const numOfResultsOnCurPage = products.length;

    return { products, count, lastPage, numOfResultsOnCurPage };
  } catch (error) {
    console.error("Error in getProducts:", error);
    return { products: [], count: 0, lastPage: 1, numOfResultsOnCurPage: 0 };
  }
}

// ✅ get single product
export const getProduct = cache(async function getProduct(productId: number) {
  try {
    const product = await db
      .selectFrom("products")
      .selectAll()
      .where("id", "=", productId)
      .execute();

    return product;
  } catch (error) {
    console.error("Error in getProduct:", error);
    return { error: "Could not find the product" };
  }
});

// ✅ delete product
export async function deleteProduct(productId: number) {
  try {
    await sql`SET foreign_key_checks = 0`.execute(db);

    await db
      .deleteFrom("product_categories")
      .where("product_id", "=", productId)
      .execute();
    await db.deleteFrom("reviews").where("product_id", "=", productId).execute();
    await db.deleteFrom("comments").where("product_id", "=", productId).execute();
    await db.deleteFrom("products").where("id", "=", productId).execute();

    await sql`SET foreign_key_checks = 1`.execute(db);
    revalidatePath("/products");

    return { message: "Product deleted successfully" };
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    return { error: "Something went wrong, cannot delete product" };
  }
}

// ✅ map brand ids to names
export async function MapBrandIdsToName(brandsId: number[]) {
  try {
    const brands = await db
      .selectFrom("brands")
      .select(["id", "name"])
      .where("id", "in", brandsId)
      .execute();

    return new Map(brands.map((brand) => [brand.id, brand.name]));
  } catch (error) {
    console.error("Error in MapBrandIdsToName:", error);
    throw error;
  }
}

// ✅ get all product categories for list
export async function getAllProductCategories(products: any[]) {
  try {
    const productsId = products.map((product) => product.id);

    const categories = await db
      .selectFrom("product_categories")
      .innerJoin(
        "categories",
        "categories.id",
        "product_categories.category_id"
      )
      .select(["product_categories.product_id", "categories.name"])
      .where("product_categories.product_id", "in", productsId)
      .execute();

    const categoriesMap = new Map();
    categories.forEach(({ product_id, name }) => {
      if (!categoriesMap.has(product_id)) categoriesMap.set(product_id, []);
      categoriesMap.get(product_id).push(name);
    });

    return categoriesMap;
  } catch (error) {
    console.error("Error in getAllProductCategories:", error);
    throw error;
  }
}

// ✅ get categories for single product
export async function getProductCategories(productId: number) {
  try {
    const categories = await db
      .selectFrom("product_categories")
      .innerJoin(
        "categories",
        "categories.id",
        "product_categories.category_id"
      )
      .select(["categories.id", "categories.name"])
      .where("product_categories.product_id", "=", productId)
      .execute();

    return categories;
  } catch (error) {
    console.error("Error in getProductCategories:", error);
    throw error;
  }
}
