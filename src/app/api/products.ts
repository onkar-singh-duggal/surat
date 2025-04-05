import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db"; // Import database connection
import { basicSchema } from "@/schemas/product";
import { Prisma } from "@prisma/client"; // If using Prisma

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        const products = await db.product.findMany(); // Fetch all products
        return res.status(200).json(products);

      case "POST":
        const validatedData = await basicSchema.validate(req.body);
        const newProduct = await db.product.create({ data: validatedData });
        return res.status(201).json(newProduct);

      case "PUT":
        const { id, ...updateData } = req.body;
        const updatedProduct = await db.product.update({
          where: { id: Number(id) },
          data: updateData,
        });
        return res.status(200).json(updatedProduct);

      case "DELETE":
        const { productId } = req.body;
        await db.product.delete({ where: { id: Number(productId) } });
        return res.status(200).json({ message: "Product deleted successfully" });

      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
