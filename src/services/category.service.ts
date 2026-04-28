import { connectDB } from "@/lib/mongodb";
import Category, { ICategoryDocument } from "@/models/Category";
import { CategoryFormData } from "@/schemas/product.schema";

export async function getAllCategories(): Promise<ICategoryDocument[]> {
  await connectDB();
  return Category.find().sort({ name: 1 }).lean<ICategoryDocument[]>();
}

export async function getCategoryById(id: string): Promise<ICategoryDocument | null> {
  await connectDB();
  return Category.findById(id).lean<ICategoryDocument>();
}

export async function createCategory(data: CategoryFormData): Promise<ICategoryDocument> {
  await connectDB();
  const category = new Category({
    name: data.name,
    color: data.color || undefined,
  });
  return category.save();
}

export async function updateCategory(
  id: string,
  data: CategoryFormData
): Promise<ICategoryDocument | null> {
  await connectDB();
  return Category.findByIdAndUpdate(
    id,
    { name: data.name, color: data.color || undefined },
    { new: true, runValidators: true }
  ).lean<ICategoryDocument>();
}

export async function deleteCategory(id: string): Promise<boolean> {
  await connectDB();
  const result = await Category.findByIdAndDelete(id);
  return result !== null;
}
