import { connectDB } from "@/lib/mongodb";
import Product, { IProductDocument } from "@/models/Product";
import "@/models/Category"; // ensure Category schema is registered for populate
import { ProductFormData } from "@/schemas/product.schema";

interface GetProductsParams {
  search?: string;
  categoryId?: string;
  status?: "good" | "low" | "out";
  page?: number;
  limit?: number;
}

export interface ProductsPage {
  products: IProductDocument[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export async function getAllProducts(
  params: GetProductsParams = {}
): Promise<ProductsPage> {
  await connectDB();

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const query: Record<string, unknown> = {};

  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { barcode: { $regex: params.search, $options: "i" } },
    ];
  }

  if (params.categoryId) {
    query.categoryId = params.categoryId;
  }

  // If status filter: fetch all matching, filter, then paginate client-side
  if (params.status) {
    const all = await Product.find(query)
      .populate("categoryId", "name color")
      .sort({ name: 1 })
      .lean<IProductDocument[]>();

    const filtered = all.filter((p) => {
      if (params.status === "out") return p.quantity === 0;
      if (params.status === "low") return p.quantity > 0 && p.quantity <= p.minQuantity;
      if (params.status === "good") return p.quantity > p.minQuantity;
      return true;
    });

    const total = filtered.length;
    const products = filtered.slice((page - 1) * limit, page * limit);
    return { products, total, page, totalPages: Math.max(1, Math.ceil(total / limit)), limit };
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate("categoryId", "name color")
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<IProductDocument[]>();

  return { products, total, page, totalPages: Math.max(1, Math.ceil(total / limit)), limit };
}

export async function getProductById(id: string): Promise<IProductDocument | null> {
  await connectDB();
  return Product.findById(id)
    .populate("categoryId", "name color")
    .lean<IProductDocument>();
}

export async function getProductByBarcode(
  barcode: string
): Promise<IProductDocument | null> {
  await connectDB();
  return Product.findOne({ barcode })
    .populate("categoryId", "name color")
    .lean<IProductDocument>();
}

export async function createProduct(
  data: ProductFormData
): Promise<IProductDocument> {
  await connectDB();
  const product = new Product({
    name: data.name,
    barcode: data.barcode || undefined,
    categoryId: data.categoryId || undefined,
    quantity: data.quantity,
    unit: data.unit,
    minQuantity: data.minQuantity,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    image: data.image || undefined,
    location: data.location || undefined,
    notes: data.notes || undefined,
  });
  return product.save();
}

export async function updateProduct(
  id: string,
  data: ProductFormData
): Promise<IProductDocument | null> {
  await connectDB();
  return Product.findByIdAndUpdate(
    id,
    {
      name: data.name,
      barcode: data.barcode || undefined,
      categoryId: data.categoryId || undefined,
      quantity: data.quantity,
      unit: data.unit,
      minQuantity: data.minQuantity,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      image: data.image || undefined,
      location: data.location || undefined,
      notes: data.notes || undefined,
    },
    { new: true, runValidators: true }
  )
    .populate("categoryId", "name color")
    .lean<IProductDocument>();
}

export async function deleteProduct(id: string): Promise<boolean> {
  await connectDB();
  const result = await Product.findByIdAndDelete(id);
  return result !== null;
}

export async function getTotalProductCount(): Promise<number> {
  await connectDB();
  return Product.countDocuments();
}
