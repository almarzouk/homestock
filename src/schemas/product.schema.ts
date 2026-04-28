import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(200),
  barcode: z.string().max(100).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0, "Menge muss positiv sein"),
  unit: z.enum(["piece", "kg", "g", "liter", "ml", "box", "pack"]),
  minQuantity: z.coerce.number().min(0, "Mindestbestand muss positiv sein"),
  expiryDate: z.string().optional().or(z.literal("")),
  image: z.string().url("Ungültige URL").optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type ProductFormData = z.infer<typeof ProductSchema>;

export const MovementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.coerce.number().min(0.001, "Menge muss größer als 0 sein"),
  note: z.string().max(500).optional().or(z.literal("")),
});

export type MovementFormData = z.infer<typeof MovementSchema>;

export const CategorySchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ungültige Farbe")
    .optional()
    .or(z.literal("")),
});

export type CategoryFormData = z.infer<typeof CategorySchema>;
