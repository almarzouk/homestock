import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategoryDocument extends Document {
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, trim: true },
  },
  { timestamps: true }
);

const Category: Model<ICategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;
