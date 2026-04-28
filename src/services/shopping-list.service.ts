import { connectDB } from "@/lib/mongodb";
import Product, { IProductDocument } from "@/models/Product";

export interface ShoppingListItem {
  product: IProductDocument;
  needed: number;
}

export async function getShoppingList(): Promise<ShoppingListItem[]> {
  await connectDB();

  const products = await Product.find({
    $expr: { $lte: ["$quantity", "$minQuantity"] },
  })
    .populate("categoryId", "name color")
    .sort({ name: 1 })
    .lean<IProductDocument[]>();

  return products.map((product) => ({
    product,
    needed: Math.max(0, product.minQuantity - product.quantity + product.minQuantity),
  }));
}
