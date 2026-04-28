"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Package, Search, Plus, X,
  Loader2, AlertCircle, CheckCircle, ExternalLink,
} from "lucide-react";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { IProduct } from "@/types";
import { t } from "@/i18n";

interface ShoppingListItem {
  product: IProduct;
  needed: number;
}

interface OFFResult {
  barcode: string;
  name: string;
  image?: string;
  categoryName?: string;
  quantity?: string;
  brand?: string;
}

type AddState = "idle" | "loading" | "success" | "error";

const SEARCH_TIPS: Record<string, string[]> = {
  milchreis: ["Rundkornreis", "Klebreis", "Risottoreis"],
  reis: ["Langkornreis", "Basmati", "Jasminreis"],
  pasta: ["Spaghetti", "Penne", "Nudeln"],
  joghurt: ["Naturjoghurt", "Fruchtjoghurt"],
  käse: ["Gouda", "Emmentaler", "Mozzarella"],
};

// ── Call via our own server-side route (avoids browser CORS / User-Agent issues)
async function searchOFF(query: string): Promise<OFFResult[]> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

export default function ShoppingListPage() {
  const router = useRouter();

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OFFResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});
  const [addingManual, setAddingManual] = useState(false);
  const [manualState, setManualState] = useState<AddState>("idle");

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/shopping-list");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchOFF(trimmed);
      setSearchResults(results);
      setShowResults(true);
      setSearching(false);
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addManualProduct = async () => {
    const name = query.trim();
    if (!name) return;
    setAddingManual(true);
    setManualState("loading");
    try {
      const payload = {
        name,
        barcode: "",
        quantity: 0,
        unit: "piece",
        minQuantity: 1,
        image: "",
        notes: "Manuell hinzugefügt",
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setManualState("success");
      setTimeout(() => {
        setShowResults(false);
        setQuery("");
        setAddingManual(false);
        setManualState("idle");
        fetchList();
      }, 800);
    } catch {
      setManualState("error");
      setTimeout(() => { setManualState("idle"); setAddingManual(false); }, 2000);
    }
  };

  const addToInventory = async (product: OFFResult) => {
    const key = product.barcode;
    setAddStates((s) => ({ ...s, [key]: "loading" }));

    try {
      const check = await fetch(
        `/api/barcode/${encodeURIComponent(product.barcode)}`
      );
      const checkData = await check.json();

      if (checkData.source === "database" && checkData.product?._id) {
        setAddStates((s) => ({ ...s, [key]: "success" }));
        setTimeout(() => {
          setShowResults(false);
          setQuery("");
          router.push(`/inventory/${checkData.product._id}`);
        }, 600);
        return;
      }

      const payload = {
        name: product.name,
        barcode: product.barcode,
        quantity: 0,
        unit: "piece",
        minQuantity: 1,
        image: product.image || "",
        notes: product.quantity ? `Packungsgröße: ${product.quantity}` : "",
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      setAddStates((s) => ({ ...s, [key]: "success" }));
      setTimeout(() => {
        setShowResults(false);
        setQuery("");
        fetchList();
      }, 800);
    } catch {
      setAddStates((s) => ({ ...s, [key]: "error" }));
      setTimeout(() => setAddStates((s) => ({ ...s, [key]: "idle" })), 2000);
    }
  };

  return (
    <div>
      <Header
        title={t("shoppingList.title")}
        subtitle={`${items.length} ${t("common.items")}`}
      />

      {/* Search */}
      <div ref={searchRef} className="relative mb-6">
        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-2xl px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          {searching ? (
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
          ) : (
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Produkt suchen… (z.B. Milchreis, Butter, Joghurt)"
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); setShowResults(false); }}>
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 overflow-hidden">
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400 px-4">
                <AlertCircle className="h-8 w-8 mb-2 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">Kein Produkt gefunden</p>
                {(() => {
                  const tips = SEARCH_TIPS[query.toLowerCase().trim()];
                  return tips ? (
                    <div className="mt-3 w-full">
                      <p className="text-xs text-gray-400 mb-2 text-center">Versuchen Sie stattdessen:</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {tips.map((tip) => (
                          <button key={tip} onClick={() => setQuery(tip)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors">
                            {tip}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                <div className="mt-4 w-full border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 text-center mb-2">Produkt nicht in der Datenbank? Manuell hinzufügen:</p>
                  <button onClick={addManualProduct} disabled={addingManual}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-all">
                    {manualState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" />
                      : manualState === "success" ? <CheckCircle className="h-4 w-4" />
                      : <Plus className="h-4 w-4" />}
                    &quot;{query}&quot; manuell hinzufügen
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-50">
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <p className="text-xs text-blue-600 font-medium">
                    {searchResults.length} Produkte gefunden
                  </p>
                  <button onClick={addManualProduct} disabled={addingManual}
                    className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <Plus className="h-3 w-3" /> Manuell hinzufügen
                  </button>
                </div>
                {searchResults.map((product) => {
                  const state = addStates[product.barcode] ?? "idle";
                  const meta = [product.brand, product.quantity, product.categoryName]
                    .filter(Boolean).join(" · ");
                  return (
                    <div key={product.barcode}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/40 transition-colors">
                      {/* Image */}
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name}
                          className="w-12 h-12 object-cover rounded-xl flex-shrink-0 bg-gray-100 border border-gray-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                        {meta && <p className="text-xs text-gray-400 truncate">{meta}</p>}
                        <p className="text-xs text-gray-300 font-mono">{product.barcode}</p>
                      </div>
                      {/* Add */}
                      <button
                        onClick={() => addToInventory(product)}
                        disabled={state === "loading" || state === "success"}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-w-[100px] justify-center
                          ${state === "success" ? "bg-emerald-100 text-emerald-700"
                            : state === "error" ? "bg-red-100 text-red-600"
                            : state === "loading" ? "bg-gray-100 text-gray-400 cursor-wait"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"}`}
                      >
                        {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : state === "success" ? <CheckCircle className="h-3.5 w-3.5" />
                          : state === "error" ? <AlertCircle className="h-3.5 w-3.5" />
                          : <Plus className="h-3.5 w-3.5" />}
                        {state === "success" ? "Hinzugefügt"
                          : state === "error" ? "Fehler"
                          : state === "loading" ? "Laden…"
                          : "Hinzufügen"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">Suchergebnisse von Open Food Facts</p>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {listLoading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={t("shoppingList.empty")}
          description="Suchen Sie oben nach Produkten oder fügen Sie Artikel mit niedrigem Bestand hinzu."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {items.length} Produkte zum Einkaufen
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(({ product, needed }) => {
              const category = typeof product.categoryId === "object" ? product.categoryId : null;
              const isOut = product.quantity === 0;
              return (
                <div key={product._id} className="flex items-center gap-3 px-4 py-3.5">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name}
                      className="w-14 h-14 object-cover rounded-xl flex-shrink-0 bg-gray-100"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="h-7 w-7 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                    {category && <p className="text-xs text-gray-400">{category.name}</p>}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className={`h-full rounded-full ${isOut ? "bg-red-400" : "bg-amber-400"}`}
                          style={{ width: isOut ? "4px" : `${Math.min((product.quantity / product.minQuantity) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${isOut ? "text-red-500" : "text-amber-600"}`}>
                        {product.quantity} / {product.minQuantity} {t(`unit.${product.unit}`)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Kaufen</p>
                      <p className="text-2xl font-black text-blue-600">{needed}</p>
                      <p className="text-xs text-gray-400">{t(`unit.${product.unit}`)}</p>
                    </div>
                    <Link href={`/inventory/${product._id}`}
                      className="text-gray-300 hover:text-blue-500 transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
