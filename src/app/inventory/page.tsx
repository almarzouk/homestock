"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, Package, TrendingUp, TrendingDown, Eye,
  MapPin, ArrowUpDown, X, ShoppingCart,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import MovementModal from "@/components/product/MovementModal";
import { ICategory, IProduct, MovementType } from "@/types";
import { t } from "@/i18n";
import Pagination from "@/components/ui/Pagination";

interface ILocation { _id: string; name: string; icon: string; }

const STATUS_OPTIONS = [
  { value: "", label: t("inventory.allStatuses") },
  { value: "good", label: t("status.good") },
  { value: "low", label: t("status.low") },
  { value: "out", label: t("status.out") },
];

const SORT_OPTIONS = [
  { value: "", label: "Sortierung: Standard" },
  { value: "name_asc", label: "Name A → Z" },
  { value: "name_desc", label: "Name Z → A" },
  { value: "qty_asc", label: "Menge: aufsteigend" },
  { value: "qty_desc", label: "Menge: absteigend" },
];

function sortProducts(products: IProduct[], sort: string): IProduct[] {
  if (!sort) return products;
  return [...products].sort((a, b) => {
    if (sort === "name_asc") return a.name.localeCompare(b.name, "de");
    if (sort === "name_desc") return b.name.localeCompare(a.name, "de");
    if (sort === "qty_asc") return a.quantity - b.quantity;
    if (sort === "qty_desc") return b.quantity - a.quantity;
    return 0;
  });
}

export default function InventoryPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sort, setSort] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const [movementProduct, setMovementProduct] = useState<IProduct | null>(null);
  const [movementType, setMovementType] = useState<MovementType>("IN");

  const fetchProducts = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryId) params.set("categoryId", categoryId);
      if (status) params.set("status", status);
      params.set("page", String(p));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, status, page]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(console.error);
    fetch("/api/locations").then((r) => r.json()).then(setLocations).catch(console.error);
  }, []);

  // Reset to page 1 when filters/search change
  useEffect(() => { setPage(1); }, [search, categoryId, status]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(page), 300);
    return () => clearTimeout(timer);
  }, [fetchProducts, page]);

  const openMovement = (e: React.MouseEvent, product: IProduct, type: MovementType) => {
    e.stopPropagation(); e.preventDefault();
    setMovementProduct(product); setMovementType(type);
  };

  const toggleShoppingList = async (e: React.MouseEvent, product: IProduct) => {
    e.stopPropagation(); e.preventDefault();
    const isInList = product.inShoppingList === true;
    const method = isInList ? "DELETE" : "POST";
    await fetch("/api/shopping-list", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product._id }),
    });
    // Update local state
    setProducts(prev => prev.map(p =>
      p._id === product._id ? { ...p, inShoppingList: isInList ? null : true } as IProduct : p
    ));
  };

  const categoryOptions = [
    { value: "", label: t("inventory.allCategories") },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const locationOptions = [
    { value: "", label: "Alle Lagerorte" },
    ...locations.map((l) => ({ value: l.name, label: `${l.icon} ${l.name}` })),
  ];

  // Client-side location filter + sort
  const displayed = sortProducts(
    locationFilter ? products.filter((p) => p.location === locationFilter) : products,
    sort
  );

  const activeFiltersCount = [categoryId, status, locationFilter, sort].filter(Boolean).length;

  return (
    <div>
      <Header
        title={t("inventory.title")}
        subtitle={!loading ? `${total} Produkte` : undefined}
        actions={
          <Link href="/inventory/new">
            <Button size="sm"><Plus className="h-4 w-4" />{t("inventory.addProduct")}</Button>
          </Link>
        }
      />

      {/* Search + filter bar */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t("inventory.searchPlaceholder")}
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" />
          </div>
          {/* Filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters || activeFiltersCount > 0 ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"}`}>
            <ArrowUpDown className="h-4 w-4" />
            Filter
            {activeFiltersCount > 0 && (
              <span className="ml-1 w-5 h-5 bg-white/30 rounded-full text-xs font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select options={categoryOptions} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
              <Select options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
              <Select options={locationOptions} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
              <Select options={SORT_OPTIONS} value={sort} onChange={(e) => setSort(e.target.value)} />
            </div>
            {activeFiltersCount > 0 && (
              <button onClick={() => { setCategoryId(""); setStatus(""); setLocationFilter(""); setSort(""); }}
                className="mt-3 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                <X className="h-3.5 w-3.5" /> Alle Filter zurücksetzen
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : displayed.length === 0 ? (
        <EmptyState icon={Package} title={t("inventory.noProducts")} description={t("inventory.noProductsHint")}
          action={{ label: t("inventory.addProduct"), onClick: () => (window.location.href = "/inventory/new") }} />
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* overflow-x-auto ensures the table scrolls rather than cutting off */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("product.name")}</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">{t("product.category")}</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Lagerort</div>
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("product.quantity")}</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">{t("product.expiryDate")}</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map((product) => {
                    const category = typeof product.categoryId === "object" ? product.categoryId : null;
                    const qty = product.quantity;
                    const stockColor = qty === 0 ? "text-red-600 font-bold" : qty <= product.minQuantity ? "text-amber-600 font-semibold" : "text-gray-900";
                    const locIcon = locations.find((l) => l.name === product.location)?.icon;

                    return (
                      <tr key={product._id} className="hover:bg-blue-50/30 transition-colors group">
                        {/* Name + image */}
                        <td className="px-4 py-3">
                          <Link href={`/inventory/${product._id}`} className="flex items-center gap-3">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.image} alt={product.name}
                                className="w-9 h-9 rounded-lg object-contain bg-gray-50 border border-gray-100 p-0.5 flex-shrink-0"
                                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                            ) : (
                              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-gray-300" />
                              </div>
                            )}
                            <span className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate max-w-[140px] md:max-w-[180px]">{product.name}</span>
                          </Link>
                        </td>

                        {/* Category — hidden on md, visible lg+ */}
                        <td className="px-3 py-3 text-gray-500 text-xs hidden lg:table-cell">{category?.name ?? "—"}</td>

                        {/* Location — hidden on md/lg, visible xl+ */}
                        <td className="px-3 py-3 hidden xl:table-cell">
                          {product.location ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                              {locIcon && <span>{locIcon}</span>}
                              {product.location}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className={`px-3 py-3 ${stockColor}`}>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold">{qty}</span>
                            <span className="text-xs font-normal text-gray-400">{t(`unit.${product.unit}`)}</span>
                          </div>
                          <div className="w-14 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${qty === 0 ? "bg-red-400" : qty <= product.minQuantity ? "bg-amber-400" : "bg-emerald-400"}`}
                              style={{ width: `${product.minQuantity > 0 ? Math.min((qty / product.minQuantity) * 100, 100) : 100}%` }} />
                          </div>
                        </td>

                        {/* Expiry — hidden on md, visible lg+ */}
                        <td className="px-3 py-3 text-gray-500 text-xs hidden lg:table-cell">
                          {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString("de-DE") : "—"}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                            ${qty === 0 ? "bg-red-100 text-red-800 border-red-200"
                              : qty <= product.minQuantity ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"}`}>
                            {qty === 0 ? t("status.out") : qty <= product.minQuantity ? t("status.low") : t("status.good")}
                          </span>
                        </td>

                        {/* Actions — icon-only buttons, always visible */}
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={(e) => openMovement(e, product, "IN")} title="Bestand erhöhen"
                              className="flex items-center justify-center w-8 h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200">
                              <TrendingUp className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={(e) => openMovement(e, product, "OUT")} title="Bestand verringern"
                              className="flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200">
                              <TrendingDown className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={(e) => toggleShoppingList(e, product)}
                              title={product.inShoppingList === true ? "Aus Einkaufsliste entfernen" : "Zur Einkaufsliste hinzufügen"}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors border ${product.inShoppingList === true ? "bg-blue-100 border-blue-200 text-blue-600 hover:bg-blue-200" : "bg-gray-100 border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"}`}>
                              <ShoppingCart className="h-3.5 w-3.5" />
                            </button>
                            <Link href={`/inventory/${product._id}`} onClick={(e) => e.stopPropagation()} title="Details"
                              className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors border border-gray-200">
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
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {displayed.map((product) => {
              const locIcon = locations.find((l) => l.name === product.location)?.icon;
              const qty = product.quantity;
              const isOut = qty === 0;
              const isLow = !isOut && qty <= product.minQuantity;
              const isGood = !isOut && !isLow;
              const category = typeof product.categoryId === "object" ? product.categoryId : null;
              const stockPct = product.minQuantity > 0 ? Math.min((qty / product.minQuantity) * 100, 100) : 100;

              return (
                <div key={product._id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isOut ? "border-red-200" : isLow ? "border-amber-200" : "border-gray-200"}`}>
                  {/* Top: image + info */}
                  <Link href={`/inventory/${product._id}`} className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors">
                    {/* Image */}
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name}
                        className="w-16 h-16 rounded-xl object-contain bg-gray-50 border border-gray-100 p-0.5 flex-shrink-0"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                    ) : (
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${isOut ? "bg-red-50" : isLow ? "bg-amber-50" : "bg-gray-50"}`}>
                        <Package className={`h-8 w-8 ${isOut ? "text-red-200" : isLow ? "text-amber-200" : "text-gray-200"}`} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Name + status pill */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-900 truncate text-sm leading-tight">{product.name}</p>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOut ? "bg-red-100 text-red-700" : isLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {isOut ? "Aus" : isLow ? "Niedrig" : "OK"}
                        </span>
                      </div>

                      {/* Category + location */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {category && (
                          <span className="text-[11px] text-gray-400 font-medium">{category.name}</span>
                        )}
                        {product.location && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400">
                            {locIcon && <span className="text-xs">{locIcon}</span>}
                            {product.location}
                          </span>
                        )}
                      </div>

                      {/* Quantity + stock bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${isOut ? "bg-red-400 w-[4px]" : isLow ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={!isOut ? { width: `${stockPct}%` } : undefined} />
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-700"}`}>
                          {qty} <span className="font-normal text-gray-400">/ {product.minQuantity} {t(`unit.${product.unit}`)}</span>
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Bottom action bar */}
                  <div className={`flex border-t ${isOut ? "border-red-100" : isLow ? "border-amber-100" : "border-gray-100"}`}>
                    <button onClick={(e) => openMovement(e, product, "IN")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors border-r border-gray-100">
                      <TrendingUp className="h-4 w-4" /> +
                    </button>
                    <button onClick={(e) => openMovement(e, product, "OUT")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-red-500 hover:bg-red-50 text-xs font-bold transition-colors border-r border-gray-100">
                      <TrendingDown className="h-4 w-4" /> −
                    </button>
                    <button onClick={(e) => toggleShoppingList(e, product)}
                      title={product.inShoppingList === true ? "Aus Liste entfernen" : "Zur Einkaufsliste"}
                      className={`flex items-center justify-center w-14 py-3 text-xs font-bold transition-colors ${product.inShoppingList === true ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}`}>
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                    <Link href={`/inventory/${product._id}`} onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center w-14 py-3 text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors border-l border-gray-100">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} total={locationFilter || sort ? displayed.length : total}
        pageSize={PAGE_SIZE} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

      {movementProduct && (
        <MovementModal open={!!movementProduct} onClose={() => setMovementProduct(null)}
          onSuccess={() => { setMovementProduct(null); fetchProducts(); }}
          productId={movementProduct._id} productName={movementProduct.name}
          currentQuantity={movementProduct.quantity} movementType={movementType} />
      )}
    </div>
  );
}
