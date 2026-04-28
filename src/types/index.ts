export type Unit = "piece" | "kg" | "g" | "liter" | "ml" | "box" | "pack";
export type Location = "kitchen" | "freezer" | "bathroom" | "storage";
export type MovementType = "IN" | "OUT" | "ADJUST";
export type StockStatus = "good" | "low" | "out";
export type ExpiryStatus = "normal" | "expiring-soon" | "expired";

export interface ICategory {
  _id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  _id: string;
  name: string;
  barcode?: string;
  categoryId?: ICategory | string;
  quantity: number;
  unit: Unit;
  minQuantity: number;
  expiryDate?: string;
  image?: string;
  location?: Location;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMovement {
  _id: string;
  productId: IProduct | string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  note?: string;
  createdAt: string;
}

export interface BarcodeResult {
  source: "database" | "open-food-facts" | "none";
  product?: {
    _id?: string;
    name: string;
    barcode: string;
    image?: string;
    categoryName?: string;
  };
}

export interface AlertsData {
  lowStock: IProduct[];
  outOfStock: IProduct[];
  expired: IProduct[];
  expiringSoon: IProduct[];
}

export interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  recentMovements: IMovement[];
}

export function getStockStatus(product: IProduct): StockStatus {
  if (product.quantity === 0) return "out";
  if (product.quantity <= product.minQuantity) return "low";
  return "good";
}

export function getExpiryStatus(product: IProduct): ExpiryStatus {
  if (!product.expiryDate) return "normal";
  const now = new Date();
  const expiry = new Date(product.expiryDate);
  if (expiry < now) return "expired";
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (expiry <= sevenDays) return "expiring-soon";
  return "normal";
}
