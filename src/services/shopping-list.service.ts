import { connectDB } from "@/lib/mongodb";
import Product, { IProductDocument } from "@/models/Product";
import "@/models/Category";

export interface ShoppingListItem {
  product: IProductDocument;
  needed: number;
  manual: boolean; // true = manually added (not just low stock)
}

export async function getShoppingList(): Promise<ShoppingListItem[]> {
  await connectDB();

  // Show: manually added (inShoppingList=true)
  //    OR auto-low-stock (inShoppingList is NOT false)
  const products = await Product.find({
    $or: [
      { inShoppingList: true },
      {
        inShoppingList: { $ne: false },
        $expr: { $lte: ["$quantity", "$minQuantity"] },
      },
    ],
  })
    .populate("categoryId", "name color")
    .sort({ name: 1 })
    .lean<IProductDocument[]>();

  return products.map((product) => ({
    product,
    needed: Math.max(1, product.minQuantity - product.quantity + product.minQuantity),
    manual: product.inShoppingList === true,
  }));
}

export async function addToShoppingList(productId: string): Promise<void> {
  await connectDB();
  await Product.findByIdAndUpdate(productId, { inShoppingList: true });
}

export async function removeFromShoppingList(productId: string): Promise<void> {
  await connectDB();
  // Set false = dismissed (won't reappear even if low stock)
  await Product.findByIdAndUpdate(productId, { inShoppingList: false });
}
