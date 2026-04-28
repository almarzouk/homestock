"use client";

import Link from "next/link";
import { Package, Calendar, MapPin } from "lucide-react";
import { IProduct, getStockStatus, getExpiryStatus } from "@/types";
import { StockBadge, ExpiryBadge } from "@/components/ui/Badge";
import { t } from "@/i18n";

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const category = typeof product.categoryId === "object" ? product.categoryId : null;

  return (
    <Link href={`/inventory/${product._id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-150 cursor-pointer">
        <div className="flex items-start gap-3">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 object-contain rounded-lg flex-shrink-0 bg-gray-50 border border-gray-100 p-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="h-7 w-7 text-gray-300" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
              <StockBadge status={stockStatus} />
            </div>

            {category && (
              <p className="text-xs text-gray-400 mt-0.5">{category.name}</p>
            )}

            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-medium text-gray-700">
                {product.quantity} {t(`unit.${product.unit}`)}
              </span>
              <span className="text-xs text-gray-400">
                Min: {product.minQuantity}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {product.location && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  {product.location}
                </span>
              )}
              {product.expiryDate && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(product.expiryDate).toLocaleDateString("de-DE")}
                </span>
              )}
              {expiryStatus !== "normal" && (
                <ExpiryBadge status={expiryStatus} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
