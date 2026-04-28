"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Package, TrendingUp, TrendingDown, Eye } from "lucide-react";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import MovementModal from "@/components/product/MovementModal";
import { ICategory, IProduct, MovementType } from "@/types";
import { t } from "@/i18n";

const STATUS_OPTIONS = [
  { value: "", label: t("inventory.allStatuses") },
  { value: "good", label: t("status.good") },
  { value: "low", label: t("status.low") },
  { value: "out", label: t("status.out") },
];

export default function InventoryPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");

  // Quick movement modal
  const [movementProduct, setMovementProduct] = useState<IProduct | null>(null);
  const [movementType, setMovementType] = useState<MovementType>("IN");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryId) params.set("categoryId", categoryId);
      if (status) params.set("status", status);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, status]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const openMovement = (
    e: React.MouseEvent,
    product: IProduct,
    type: MovementType
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setMovementProduct(product);
    setMovementType(type);
  };

  const categoryOptions = [
    { value: "", label: t("inventory.allCategories") },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  return (
    <div>
      <Header
        title={t("inventory.title")}
        actions={
          <Link href="/inventory/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t("inventory.addProduct")}
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("inventory.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <Select
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>

      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          {products.length} {t("common.items")}
        </p>
      )}

      {loading ? (
        <PageLoader />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("inventory.noProducts")}
          description={t("inventory.noProductsHint")}
          action={{
            label: t("inventory.addProduct"),
            onClick: () => (window.location.href = "/inventory/new"),
          }}
        />
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("product.name")}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("product.category")}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("product.quantity")}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("product.expiryDate")}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {/* Actions column */}
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => {
                  const category =
                    typeof product.categoryId === "object"
                      ? product.categoryId
                      : null;
                  const qty = product.quantity;
                  const stockColor =
                    qty === 0
                      ? "text-red-600 font-bold"
                      : qty <= product.minQuantity
                      ? "text-amber-600 font-semibold"
                      : "text-gray-900";

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Name */}
                      <td className="px-5 py-3">
                        <Link
                          href={`/inventory/${product._id}`}
                          className="flex items-center gap-3"
                        >
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).style.display = "none")
                              }
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {product.name}
                          </span>
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3 text-gray-500">
                        {category?.name ?? "-"}
                      </td>

                      {/* Quantity */}
                      <td className={`px-5 py-3 ${stockColor}`}>
                        <span className="text-base font-bold">{qty}</span>
                        <span className="text-xs font-normal text-gray-400 ml-1">
                          {t(`unit.${product.unit}`)}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {product.expiryDate
                          ? new Date(product.expiryDate).toLocaleDateString("de-DE")
                          : "-"}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${qty === 0
                              ? "bg-red-100 text-red-800 border-red-200"
                              : qty <= product.minQuantity
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"}`}
                        >
                          {qty === 0
                            ? t("status.out")
                            : qty <= product.minQuantity
                            ? t("status.low")
                            : t("status.good")}
                        </span>
                      </td>

                      {/* ── Quick action buttons ── */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* + Eingang */}
                          <button
                            onClick={(e) => openMovement(e, product, "IN")}
                            title="Bestand erhöhen"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors border border-emerald-200"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>+</span>
                          </button>

                          {/* - Ausgang */}
                          <button
                            onClick={(e) => openMovement(e, product, "OUT")}
                            title="Bestand verringern"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors border border-red-200"
                          >
                            <TrendingDown className="h-3.5 w-3.5" />
                            <span>−</span>
                          </button>

                          {/* Details */}
                          <Link
                            href={`/inventory/${product._id}`}
                            onClick={(e) => e.stopPropagation()}
                            title="Details anzeigen"
                            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors border border-gray-200"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {products.map((product) => (
              <div key={product._id} className="relative">
                <ProductCard product={product} />
                {/* Quick action row below card */}
                <div className="flex gap-2 mt-1.5 px-1">
                  <button
                    onClick={(e) => openMovement(e, product, "IN")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Eingang
                  </button>
                  <button
                    onClick={(e) => openMovement(e, product, "OUT")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold border border-red-200 transition-colors"
                  >
                    <TrendingDown className="h-4 w-4" />
                    Ausgang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Movement modal */}
      {movementProduct && (
        <MovementModal
          open={!!movementProduct}
          onClose={() => setMovementProduct(null)}
          onSuccess={() => {
            setMovementProduct(null);
            fetchProducts();
          }}
          productId={movementProduct._id}
          productName={movementProduct.name}
          currentQuantity={movementProduct.quantity}
          movementType={movementType}
        />
      )}
    </div>
  );
}
