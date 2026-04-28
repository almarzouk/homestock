import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IMovementDocument extends Document {
  productId: Types.ObjectId;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  note?: string;
  createdAt: Date;
}

const MovementSchema = new Schema<IMovementDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["IN", "OUT", "ADJUST"],
    },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MovementSchema.index({ productId: 1, createdAt: -1 });
MovementSchema.index({ createdAt: -1 });

const Movement: Model<IMovementDocument> =
  mongoose.models.Movement ||
  mongoose.model<IMovementDocument>("Movement", MovementSchema);

export default Movement;
