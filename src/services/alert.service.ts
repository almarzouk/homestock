import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeanProduct = Record<string, any>;

export interface AlertsResult {
  lowStock: LeanProduct[];
  outOfStock: LeanProduct[];
  expired: LeanProduct[];
  expiringSoon: LeanProduct[];
}

export async function getAlerts(): Promise<AlertsResult> {
  await connectDB();

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const allProducts = await Product.find()
    .populate("categoryId", "name color")
    .lean();

  const products = allProducts as LeanProduct[];

  const outOfStock = products.filter((p) => p.quantity === 0);
  const lowStock = products.filter(
    (p) => p.quantity > 0 && p.quantity <= p.minQuantity
  );
  const expired = products.filter(
    (p) => p.expiryDate && new Date(p.expiryDate as string) < now
  );
  const expiringSoon = products.filter(
    (p) =>
      p.expiryDate &&
      new Date(p.expiryDate as string) >= now &&
      new Date(p.expiryDate as string) <= sevenDaysFromNow
  );

  return { lowStock, outOfStock, expired, expiringSoon };
}

export async function getAlertCounts(): Promise<{
  lowStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
}> {
  const alerts = await getAlerts();
  return {
    lowStockCount: alerts.lowStock.length + alerts.outOfStock.length,
    expiredCount: alerts.expired.length,
    expiringSoonCount: alerts.expiringSoon.length,
  };
}
