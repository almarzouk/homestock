"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { ProductSchema, ProductFormData } from "@/schemas/product.schema";
import { ICategory, IProduct } from "@/types";
import { t } from "@/i18n";
import { ScanLine } from "lucide-react";
import Link from "next/link";

interface ILocation { _id: string; name: string; icon: string; }

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  productId?: string;
  prefillBarcode?: string;
}

const UNIT_OPTIONS = [
  { value: "piece", label: t("unit.piece") },
  { value: "kg", label: t("unit.kg") },
  { value: "g", label: t("unit.g") },
  { value: "liter", label: t("unit.liter") },
  { value: "ml", label: t("unit.ml") },
  { value: "box", label: t("unit.box") },
  { value: "pack", label: t("unit.pack") },
];

export default function ProductForm({ defaultValues, productId, prefillBarcode }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue } =
    useForm<ProductFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(ProductSchema) as any,
      defaultValues: {
        unit: "piece",
        quantity: 0,
        minQuantity: 1,
        ...defaultValues,
        barcode: prefillBarcode || defaultValues?.barcode || "",
      },
    });

  // Load categories — then re-apply the defaultValue so the Select shows it
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: ICategory[]) => {
        setCategories(data);
        // Re-apply after options load so the <select> renders with the correct option
        if (defaultValues?.categoryId) {
          setValue("categoryId", defaultValues.categoryId);
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load locations from DB
  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((data: ILocation[]) => {
        setLocations(data);
        // Re-apply location value after options load
        if (defaultValues?.location) {
          setValue("location", defaultValues.location);
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = [
    { value: "", label: t("product.noCategory") },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const locationOptions = [
    { value: "", label: "— Kein Lagerort —" },
    ...locations.map((l) => ({ value: l.name, label: `${l.icon} ${l.name}` })),
  ];

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const url = productId ? `/api/products/${productId}` : "/api/products";
      const method = productId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || t("common.serverError"));
      }
      const product: IProduct = await res.json();
      router.push(`/inventory/${product._id}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("common.serverError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Name */}
        <div className="md:col-span-2">
          <Input label={t("product.name")} placeholder="z.B. Milch" required
            error={errors.name?.message} {...register("name")} />
        </div>

        {/* Barcode */}
        <div>
          <div className="relative">
            <Input label={t("product.barcode")} placeholder="z.B. 4000000000000"
              error={errors.barcode?.message} {...register("barcode")} />
            <Link href="/scan" className="absolute right-2 top-8 text-gray-400 hover:text-blue-500 transition-colors" title={t("product.scanBarcode")}>
              <ScanLine className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Category */}
        <Select label={t("product.category")} options={categoryOptions}
          error={errors.categoryId?.message} {...register("categoryId")} />

        {/* Quantity */}
        <Input label={t("product.quantity")} type="number" min="0" step="0.01" required
          error={errors.quantity?.message} {...register("quantity")} />

        {/* Unit */}
        <Select label={t("product.unit")} options={UNIT_OPTIONS} required
          error={errors.unit?.message} {...register("unit")} />

        {/* Min Quantity */}
        <Input label={t("product.minQuantity")} type="number" min="0" step="0.01" required
          error={errors.minQuantity?.message} {...register("minQuantity")} />

        {/* Expiry Date */}
        <Input label={t("product.expiryDate")} type="date"
          error={errors.expiryDate?.message} {...register("expiryDate")} />

        {/* Location — dynamic from DB */}
        <div>
          <Select
            label={t("product.location")}
            options={locationOptions.length > 1 ? locationOptions : [{ value: "", label: "Ladevorte werden geladen…" }]}
            placeholder={locationOptions.length <= 1 ? undefined : undefined}
            error={errors.location?.message}
            {...register("location")}
          />
          {locations.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Keine Lagerorte gefunden.{" "}
              <Link href="/settings" className="underline hover:text-amber-800">
                Lagerorte in Einstellungen hinzufügen →
              </Link>
            </p>
          )}
        </div>

        {/* Image URL */}
        <div className="md:col-span-2">
          <Input label={t("product.image")} type="url" placeholder="https://..."
            error={errors.image?.message} {...register("image")} />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <Textarea label={t("product.notes")} placeholder={t("movement.notePlaceholder")}
            error={errors.notes?.message} {...register("notes")} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={submitting}>
          {productId ? t("product.edit") : t("product.add")}
        </Button>
      </div>
    </form>
  );
}
