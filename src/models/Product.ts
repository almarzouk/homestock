import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IProductDocument extends Document {
  name: string;
  barcode?: string;
  categoryId?: Types.ObjectId;
  quantity: number;
  unit: "piece" | "kg" | "g" | "liter" | "ml" | "box" | "pack";
  minQuantity: number;
  expiryDate?: Date;
  image?: string;
  location?: "kitchen" | "freezer" | "bathroom" | "storage";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true, sparse: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: {
      type: String,
      required: true,
      enum: ["piece", "kg", "g", "liter", "ml", "box", "pack"],
      default: "piece",
    },
    minQuantity: { type: Number, required: true, min: 0, default: 1 },
    expiryDate: { type: Date },
    image: { type: String, trim: true },
    location: {
      type: String,
      enum: ["kitchen", "freezer", "bathroom", "storage"],
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ProductSchema.index({ barcode: 1 }, { sparse: true, unique: true });
ProductSchema.index({ name: "text" });

const Product: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
