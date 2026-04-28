"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import ProductForm from "@/components/product/ProductForm";
import { t } from "@/i18n";
import { PageLoader } from "@/components/ui/LoadingSpinner";

function NewProductContent() {
  const searchParams = useSearchParams();
  const barcode = searchParams.get("barcode") || undefined;
  const name = searchParams.get("name") || undefined;
  const image = searchParams.get("image") || undefined;

  return (
    <div>
      <Header
        title={t("product.add")}
        showBack
      />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <ProductForm
          prefillBarcode={barcode}
          defaultValues={{
            name: name || "",
            image: image || "",
          }}
        />
      </div>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <NewProductContent />
    </Suspense>
  );
}
