import { connectDB } from "@/lib/mongodb";
import Movement, { IMovementDocument } from "@/models/Movement";
import Product from "@/models/Product";
import { MovementType } from "@/types";

interface CreateMovementParams {
  productId: string;
  type: MovementType;
  quantity: number;
  note?: string;
}

export async function createMovement(
  params: CreateMovementParams
): Promise<IMovementDocument> {
  await connectDB();

  const product = await Product.findById(params.productId);
  if (!product) {
    throw new Error("Produkt nicht gefunden");
  }

  const previousQuantity = product.quantity;
  let newQuantity: number;

  switch (params.type) {
    case "IN":
      newQuantity = previousQuantity + params.quantity;
      break;
    case "OUT":
      newQuantity = Math.max(0, previousQuantity - params.quantity);
      break;
    case "ADJUST":
      newQuantity = params.quantity;
      break;
  }

  product.quantity = newQuantity;
  await product.save();

  const movement = new Movement({
    productId: params.productId,
    type: params.type,
    quantity: params.quantity,
    previousQuantity,
    newQuantity,
    note: params.note || undefined,
  });

  return movement.save();
}

export interface MovementsPage {
  movements: IMovementDocument[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export async function getAllMovements(
  params: { page?: number; limit?: number } = {}
): Promise<MovementsPage> {
  await connectDB();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const total = await Movement.countDocuments();
  const movements = await Movement.find()
    .populate("productId", "name unit image")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<IMovementDocument[]>();

  return { movements, total, page, totalPages: Math.max(1, Math.ceil(total / limit)), limit };
}

export async function getMovementsByProduct(
  productId: string
): Promise<IMovementDocument[]> {
  await connectDB();
  return Movement.find({ productId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<IMovementDocument[]>();
}

export async function getRecentMovements(limit = 10): Promise<IMovementDocument[]> {
  await connectDB();
  return Movement.find()
    .populate("productId", "name unit")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IMovementDocument[]>();
}
