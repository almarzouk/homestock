"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Package, Search, Plus, X,
  Loader2, AlertCircle, CheckCircle, ExternalLink,
  ShoppingBag, Zap, CheckSquare, Square, PenLine, Trash2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { IProduct } from "@/types";
import { t } from "@/i18n";

interface ShoppingListItem { product: IProduct; needed: number; manual: boolean; }

interface OFFResult {
  barcode: string; name: string; image?: string;
  categoryName?: string; quantity?: string; brand?: string;
}

type AddState = "idle" | "loading" | "success" | "error";

const SEARCH_TIPS: Record<string, string[]> = {
  milchreis: ["Rundkornreis", "Klebreis", "Risottoreis"],
  reis: ["Langkornreis", "Basmati", "Jasminreis"],
  pasta: ["Spaghetti", "Penne", "Nudeln"],
  joghurt: ["Naturjoghurt", "Fruchtjoghurt"],
  käse: ["Gouda", "Emmentaler", "Mozzarella"],
};

async function searchOFF(query: string): Promise<OFFResult[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch { return []; }
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
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ name: "", quantity: "0", minQuantity: "1", unit: "piece" });
  const [savingManual, setSavingManual] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/shopping-list");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setListLoading(false); }
  }, []);

  const removeItem = async (productId: string) => {
    // Optimistic update
    setItems(prev => prev.filter(i => i.product._id !== productId));
    try {
      await fetch("/api/shopping-list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch { fetchList(); } // revert on error
  };

  useEffect(() => { fetchList(); }, [fetchList]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) { setSearchResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchOFF(trimmed);
      setSearchResults(results); setShowResults(true); setSearching(false);
    }, 1000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const saveManualProduct = async () => {
    if (!manualForm.name.trim()) return;
    setSavingManual(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualForm.name.trim(),
          barcode: "",
          quantity: Number(manualForm.quantity) || 0,
          unit: manualForm.unit,
          minQuantity: Number(manualForm.minQuantity) || 1,
          image: "",
          notes: "",
          inShoppingList: true,
        }),
      });
      if (!res.ok) throw new Error();
      setShowManualModal(false);
      setManualForm({ name: "", quantity: "0", minQuantity: "1", unit: "piece" });
      fetchList();
    } catch {
      // ignore
    } finally {
      setSavingManual(false);
    }
  };

  const addManualProduct = async () => {
    const name = query.trim(); if (!name) return;
    setAddingManual(true); setManualState("loading");
    try {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, barcode: "", quantity: 0, unit: "piece", minQuantity: 1, image: "", notes: "Manuell hinzugefügt" }),
      });
      if (!res.ok) throw new Error();
      setManualState("success");
      setTimeout(() => { setShowResults(false); setQuery(""); setAddingManual(false); setManualState("idle"); fetchList(); }, 800);
    } catch { setManualState("error"); setTimeout(() => { setManualState("idle"); setAddingManual(false); }, 2000); }
  };

  const addToInventory = async (product: OFFResult) => {
    const key = product.barcode;
    setAddStates(s => ({ ...s, [key]: "loading" }));
    try {
      const check = await fetch(`/api/barcode/${encodeURIComponent(product.barcode)}`);
      const checkData = await check.json();
      if (checkData.source === "database" && checkData.product?._id) {
        setAddStates(s => ({ ...s, [key]: "success" }));
        setTimeout(() => { setShowResults(false); setQuery(""); router.push(`/inventory/${checkData.product._id}`); }, 600);
        return;
      }
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: product.name, barcode: product.barcode, quantity: 0, unit: "piece", minQuantity: 1, image: product.image || "", notes: product.quantity ? `Packungsgröße: ${product.quantity}` : "" }),
      });
      if (!res.ok) throw new Error();
      setAddStates(s => ({ ...s, [key]: "success" }));
      setTimeout(() => { setShowResults(false); setQuery(""); fetchList(); }, 800);
    } catch { setAddStates(s => ({ ...s, [key]: "error" })); setTimeout(() => setAddStates(s => ({ ...s, [key]: "idle" })), 2000); }
  };

  // Stats
  const outOfStock = items.filter(i => i.product.quantity === 0 && !i.manual);
  const lowStock = items.filter(i => i.product.quantity > 0 && !i.manual);
  const manualItems = items.filter(i => i.manual && i.product.quantity > i.product.minQuantity);
  const doneCount = checked.size;
  const totalCount = items.length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t("shoppingList.title")}</h1>
          {totalCount > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{totalCount} Artikel · {doneCount} erledigt</p>
          )}
        </div>
        <button onClick={() => setShowManualModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-sm font-bold transition-all shadow-sm">
          <PenLine className="h-4 w-4" />
          <span className="hidden sm:inline">Manuell</span>
          <Plus className="h-4 w-4 sm:hidden" />
        </button>
      </div>

      {/* Progress card */}
      {totalCount > 0 && (
        <div className={`mb-5 rounded-2xl p-4 shadow-sm border ${doneCount === totalCount ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              {doneCount === totalCount
                ? <CheckCircle className="h-5 w-5 text-white" />
                : <ShoppingBag className="h-5 w-5 text-blue-500" />}
              <span className={`text-sm font-bold ${doneCount === totalCount ? "text-white" : "text-gray-700"}`}>
                {doneCount === totalCount ? "Alles erledigt! 🎉" : "Einkaufsfortschritt"}
              </span>
            </div>
            <span className={`text-sm font-black tabular-nums ${doneCount === totalCount ? "text-white/80" : "text-blue-600"}`}>
              {doneCount}/{totalCount}
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${doneCount === totalCount ? "bg-white/20" : "bg-gray-100"}`}>
            <div className={`h-full rounded-full transition-all duration-700 ${doneCount === totalCount ? "bg-white" : "bg-gradient-to-r from-blue-500 to-emerald-500"}`}
              style={{ width: `${(doneCount / totalCount) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Search */}
      <div ref={searchRef} className="relative mb-5">
        <div className={`flex items-center gap-3 bg-white border-2 rounded-2xl px-4 py-3 shadow-sm transition-all ${showResults || query ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"}`}>
          {searching ? <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
            : <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />}
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Produkt suchen… (Milch, Butter, Joghurt…)"
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none" />
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
              <div className="flex flex-col items-center py-8 px-4">
                <AlertCircle className="h-8 w-8 mb-2 text-gray-200" />
                <p className="text-sm font-semibold text-gray-600">Nicht gefunden</p>
                {(() => {
                  const tips = SEARCH_TIPS[query.toLowerCase().trim()];
                  return tips ? (
                    <div className="mt-3 w-full">
                      <p className="text-xs text-gray-400 mb-2 text-center">Versuchen Sie stattdessen:</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {tips.map(tip => (
                          <button key={tip} onClick={() => setQuery(tip)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors">{tip}</button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                <div className="mt-4 w-full border-t border-gray-100 pt-3">
                  <button onClick={addManualProduct} disabled={addingManual}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all">
                    {manualState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" />
                      : manualState === "success" ? <CheckCircle className="h-4 w-4" />
                      : <Plus className="h-4 w-4" />}
                    &quot;{query}&quot; manuell hinzufügen
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-blue-500" />
                    <p className="text-xs text-blue-700 font-semibold">{searchResults.length} Produkte gefunden</p>
                  </div>
                  <button onClick={addManualProduct} disabled={addingManual}
                    className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <Plus className="h-3 w-3" /> Manuell
                  </button>
                </div>
                <div className="max-h-[26rem] overflow-y-auto divide-y divide-gray-50">
                  {searchResults.map((product) => {
                    const state = addStates[product.barcode] ?? "idle";
                    const meta = [product.brand, product.quantity].filter(Boolean).join(" · ");
                    return (
                      <div key={product.barcode} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/40 transition-colors">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt={product.name}
                            className="w-12 h-12 object-contain rounded-xl flex-shrink-0 bg-gray-50 border border-gray-100 p-0.5"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                          {meta && <p className="text-xs text-gray-400 truncate">{meta}</p>}
                        </div>
                        <button onClick={() => addToInventory(product)} disabled={state === "loading" || state === "success"}
                          className={`flex-shrink-0 w-24 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all
                            ${state === "success" ? "bg-emerald-100 text-emerald-700"
                              : state === "error" ? "bg-red-100 text-red-600"
                              : state === "loading" ? "bg-gray-100 text-gray-400 cursor-wait"
                              : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                          {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : state === "success" ? <CheckCircle className="h-3.5 w-3.5" />
                            : state === "error" ? <AlertCircle className="h-3.5 w-3.5" />
                            : <Plus className="h-3.5 w-3.5" />}
                          {state === "success" ? "Fertig" : state === "error" ? "Fehler" : state === "loading" ? "…" : "Hinzufügen"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center">Open Food Facts Datenbank</p>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {listLoading ? <PageLoader /> : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl flex items-center justify-center mb-5">
            <ShoppingCart className="h-12 w-12 text-blue-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Einkaufsliste ist leer</h3>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            Suchen Sie oben nach Produkten oder fügen Sie Artikel hinzu — niedrige Bestände erscheinen automatisch.
          </p>
          <button onClick={() => setShowManualModal(true)}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-sm">
            <Plus className="h-4 w-4" /> Produkt hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Out of stock section */}
          {outOfStock.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <h2 className="text-xs font-black text-red-600 uppercase tracking-wider">Nicht vorrätig</h2>
                <span className="ml-auto text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">{outOfStock.length}</span>
              </div>
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden divide-y divide-red-50">
                {outOfStock.map(({ product, needed, manual }) => (
                  <ShoppingItem key={product._id} product={product} needed={needed} manual={manual}
                    accent="red"
                    checked={checked.has(product._id)} onToggle={() => toggleCheck(product._id)}
                    onRemove={() => removeItem(product._id)} />
                ))}
              </div>
            </section>
          )}

          {/* Low stock section */}
          {lowStock.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <h2 className="text-xs font-black text-amber-600 uppercase tracking-wider">Niedriger Bestand</h2>
                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{lowStock.length}</span>
              </div>
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden divide-y divide-amber-50">
                {lowStock.map(({ product, needed, manual }) => (
                  <ShoppingItem key={product._id} product={product} needed={needed} manual={manual}
                    accent="amber"
                    checked={checked.has(product._id)} onToggle={() => toggleCheck(product._id)}
                    onRemove={() => removeItem(product._id)} />
                ))}
              </div>
            </section>
          )}

          {/* Manually added (sufficient stock) */}
          {manualItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <h2 className="text-xs font-black text-blue-600 uppercase tracking-wider">Manuell hinzugefügt</h2>
                <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{manualItems.length}</span>
              </div>
              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden divide-y divide-blue-50">
                {manualItems.map(({ product, needed, manual }) => (
                  <ShoppingItem key={product._id} product={product} needed={needed} manual={manual}
                    accent="blue"
                    checked={checked.has(product._id)} onToggle={() => toggleCheck(product._id)}
                    onRemove={() => removeItem(product._id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Manual Add Modal */}
      <Modal
        open={showManualModal}
        onClose={() => { setShowManualModal(false); setManualForm({ name: "", quantity: "0", minQuantity: "1", unit: "piece" }); }}
        title="Produkt manuell hinzufügen"
        footer={
          <>
            <button onClick={() => setShowManualModal(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Abbrechen
            </button>
            <button onClick={saveManualProduct} disabled={savingManual || !manualForm.name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all">
              {savingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Hinzufügen
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produktname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manualForm.name}
              onChange={(e) => setManualForm(f => ({ ...f, name: e.target.value }))}
              placeholder="z.B. Milch, Brot, Butter…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Current quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aktueller Bestand</label>
              <input
                type="number" min="0"
                value={manualForm.quantity}
                onChange={(e) => setManualForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Min quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mindestbestand</label>
              <input
                type="number" min="1"
                value={manualForm.minQuantity}
                onChange={(e) => setManualForm(f => ({ ...f, minQuantity: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Einheit</label>
            <select
              value={manualForm.unit}
              onChange={(e) => setManualForm(f => ({ ...f, unit: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="piece">Stück</option>
              <option value="kg">Kilogramm (kg)</option>
              <option value="g">Gramm (g)</option>
              <option value="l">Liter (l)</option>
              <option value="ml">Milliliter (ml)</option>
              <option value="pack">Packung</option>
              <option value="box">Karton</option>
              <option value="bottle">Flasche</option>
            </select>
          </div>

          <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700">
            💡 Das Produkt erscheint automatisch in der Einkaufsliste, wenn der Bestand unter den Mindestbestand fällt.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ShoppingItem({ product, needed, manual, accent = "amber", checked, onToggle, onRemove }: {
  product: IProduct; needed: number; manual: boolean; accent?: "red" | "amber" | "blue";
  checked: boolean; onToggle: () => void; onRemove: () => void;
}) {
  const category = typeof product.categoryId === "object" ? product.categoryId : null;
  const isOut = product.quantity === 0;
  const accentColors = {
    red:   { pill: "bg-red-100 text-red-700",   qty: "text-red-600",   bar: "bg-red-400",   needed: "bg-red-50 text-red-600" },
    amber: { pill: "bg-amber-100 text-amber-700", qty: "text-amber-600", bar: "bg-amber-400", needed: "bg-amber-50 text-amber-700" },
    blue:  { pill: "bg-blue-100 text-blue-700",  qty: "text-blue-600",  bar: "bg-blue-400",  needed: "bg-blue-50 text-blue-600" },
  };
  const ac = accentColors[accent];

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 transition-all duration-200 ${checked ? "opacity-40" : ""}`}>
      {/* Checkbox */}
      <button onClick={onToggle} className="flex-shrink-0 active:scale-90 transition-transform">
        {checked
          ? <CheckSquare className="h-5 w-5 text-emerald-500" />
          : <Square className="h-5 w-5 text-gray-300" />}
      </button>

      {/* Image */}
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt={product.name}
          className={`w-14 h-14 object-contain rounded-xl flex-shrink-0 bg-gray-50 border border-gray-100 p-0.5 ${checked ? "grayscale" : ""}`}
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      ) : (
        <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Package className="h-7 w-7 text-gray-200" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-gray-900 truncate text-sm ${checked ? "line-through text-gray-400" : ""}`}>
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {category && <span className="text-[11px] text-gray-400">{category.name}</span>}
          {manual && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ac.pill}`}>manuell</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
            <div className={`h-full rounded-full ${ac.bar}`}
              style={{ width: isOut ? "3px" : `${Math.min((product.quantity / product.minQuantity) * 100, 100)}%` }} />
          </div>
          <span className={`text-[11px] font-semibold tabular-nums ${ac.qty}`}>
            {product.quantity}/{product.minQuantity} {t(`unit.${product.unit}`)}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        {/* How many to buy */}
        <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center ${ac.needed}`}>
          <span className="text-base font-black leading-none">{needed}</span>
          <span className="text-[9px] font-semibold opacity-60 leading-none">kaufen</span>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/inventory/${product._id}`}
            className="text-gray-300 hover:text-blue-500 transition-colors active:scale-90">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button onClick={onRemove} title="Aus Liste entfernen"
            className="text-gray-300 hover:text-red-500 transition-colors active:scale-90">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
