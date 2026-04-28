import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILocationDocument extends Document {
  name: string;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocationDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    icon: { type: String, default: "📦" },
    color: { type: String, default: "#6b7280" },
  },
  { timestamps: true }
);

const Location: Model<ILocationDocument> =
  mongoose.models.Location ||
  mongoose.model<ILocationDocument>("Location", LocationSchema);

export default Location;
