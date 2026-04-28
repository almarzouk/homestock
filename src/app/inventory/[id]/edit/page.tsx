"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import ProductForm from "@/components/product/ProductForm";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { IProduct } from "@/types";
import { ProductFormData } from "@/schemas/product.schema";
import { t } from "@/i18n";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!product) return <p className="text-gray-500 text-center py-12">Produkt nicht gefunden</p>;

  const defaultValues: Partial<ProductFormData> = {
    name: product.name,
    barcode: product.barcode || "",
    categoryId: typeof product.categoryId === "object" ? product.categoryId._id : (product.categoryId as string) || "",
    quantity: product.quantity,
    unit: product.unit,
    minQuantity: product.minQuantity,
    expiryDate: product.expiryDate
      ? new Date(product.expiryDate).toISOString().split("T")[0]
      : "",
    image: product.image || "",
    location: product.location,
    notes: product.notes || "",
  };

  return (
    <div>
      <Header title={t("product.edit")} showBack />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <ProductForm productId={id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
