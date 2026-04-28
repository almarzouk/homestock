"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package, Edit, Trash2, Plus, Minus, RotateCcw,
  Calendar, MapPin, Tag, Barcode, TrendingUp,
  ArrowUp, ArrowDown, ChevronLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { StockBadge, ExpiryBadge, MovementTypeBadge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import MovementModal from "@/components/product/MovementModal";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { IMovement, IProduct, MovementType, getStockStatus, getExpiryStatus } from "@/types";
import { t } from "@/i18n";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [movements, setMovements] = useState<IMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementType, setMovementType] = useState<MovementType>("IN");
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [productRes, movementsRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch(`/api/products/${id}/movements`),
      ]);
      if (!productRes.ok) { router.push("/inventory"); return; }
      setProduct(await productRes.json());
      const md = await movementsRes.json();
      setMovements(Array.isArray(md) ? md : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMovement = (type: MovementType) => { setMovementType(type); setShowMovementModal(true); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) { router.push("/inventory"); router.refresh(); }
    } catch (err) { console.error(err); }
    finally { setDeleting(false); setShowDeleteModal(false); }
  };

  if (loading) return <PageLoader />;
  if (!product) return null;

  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const category = typeof product.categoryId === "object" ? product.categoryId : null;
  const stockPct = product.minQuantity > 0
    ? Math.min((product.quantity / product.minQuantity) * 100, 100)
    : 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Zurück
        </button>
        <div className="flex items-center gap-2">
          <Link href={`/inventory/${id}/edit`}>
            <Button variant="outline" size="sm"><Edit className="h-4 w-4" />{t("common.edit")}</Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="h-4 w-4" />{t("common.delete")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Hero card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt={product.name}
                  className="w-40 h-40 object-contain drop-shadow-md"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-36 h-36 bg-white rounded-2xl shadow-inner flex items-center justify-center">
                  <Package className="h-20 w-20 text-gray-200" />
                </div>
              )}
            </div>
            <div className="px-5 py-4">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex gap-2 flex-wrap">
                <StockBadge status={stockStatus} />
                {expiryStatus !== "normal" && <ExpiryBadge status={expiryStatus} />}
              </div>

              {/* Stock bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Lagerbestand</span>
                  <span className="font-semibold text-gray-800">
                    {product.quantity} / {product.minQuantity} {t(`unit.${product.unit}`)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    stockPct === 0 ? "bg-red-400" :
                    stockPct < 50 ? "bg-amber-400" : "bg-emerald-400"
                  }`} style={{ width: `${Math.max(stockPct, 2)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">Details</h2>
            </div>
            <div className="px-5 py-3 space-y-3">
              {category && (
                <DetailRow icon={<Tag className="h-4 w-4" />} label={t("product.category")} value={category.name} />
              )}
              {product.location && (
                <DetailRow icon={<MapPin className="h-4 w-4" />} label={t("product.location")} value={product.location!} />
              )}
              {product.expiryDate && (
                <DetailRow icon={<Calendar className="h-4 w-4" />} label={t("product.expiryDate")}
                  value={new Date(product.expiryDate).toLocaleDateString("de-DE")} />
              )}
              {product.barcode && (
                <DetailRow icon={<Barcode className="h-4 w-4" />} label={t("product.barcode")} value={product.barcode} mono />
              )}
              {product.notes && (
                <div className="pt-2 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-1">{t("product.notes")}</p>
                  <p className="text-sm text-gray-700">{product.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">{t("common.actions")}</h2>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <button onClick={() => handleMovement("IN")}
                className="flex flex-col items-center justify-center gap-2 py-5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-2xl transition-all group">
                <div className="w-10 h-10 bg-emerald-500 group-hover:bg-emerald-600 rounded-xl flex items-center justify-center transition-colors">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-700">{t("movement.increase")}</span>
              </button>
              <button onClick={() => handleMovement("OUT")}
                className="flex flex-col items-center justify-center gap-2 py-5 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-2xl transition-all group">
                <div className="w-10 h-10 bg-red-500 group-hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
                  <Minus className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-bold text-red-700">{t("movement.decrease")}</span>
              </button>
              <button onClick={() => handleMovement("ADJUST")}
                className="flex flex-col items-center justify-center gap-2 py-5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl transition-all group">
                <div className="w-10 h-10 bg-blue-500 group-hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors">
                  <RotateCcw className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-bold text-blue-700">{t("movement.adjust")}</span>
              </button>
            </div>
          </div>

          {/* Movement history */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-800 text-sm">{t("product.movementHistory")}</h2>
              </div>
              {movements.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{movements.length}</span>
              )}
            </div>

            {movements.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <TrendingUp className="h-8 w-8 mb-2 text-gray-200" />
                <p className="text-sm">{t("product.noMovements")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {movements.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.type === "IN" ? "bg-emerald-100" : m.type === "OUT" ? "bg-red-100" : "bg-blue-100"}`}>
                      {m.type === "IN" ? <ArrowUp className="h-4 w-4 text-emerald-600" />
                        : m.type === "OUT" ? <ArrowDown className="h-4 w-4 text-red-500" />
                        : <RotateCcw className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MovementTypeBadge type={m.type} />
                        <span className={`text-sm font-bold ${m.type === "IN" ? "text-emerald-600" : m.type === "OUT" ? "text-red-500" : "text-blue-600"}`}>
                          {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "±"}{m.quantity}
                        </span>
                      </div>
                      {m.note && <p className="text-xs text-gray-400 mt-0.5">{m.note}</p>}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500">{m.previousQuantity} → <span className="font-semibold text-gray-800">{m.newQuantity}</span></p>
                      <p className="text-xs text-gray-400">
                        {new Date(m.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showMovementModal && (
        <MovementModal open={showMovementModal} onClose={() => setShowMovementModal(false)}
          onSuccess={fetchData} productId={id} productName={product.name}
          currentQuantity={product.quantity} movementType={movementType} />
      )}
      <ConfirmModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete} title={t("product.delete")}
        message={t("common.confirmDelete")} loading={deleting} />
    </div>
  );
}

function DetailRow({ icon, label, value, mono = false }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-gray-300 flex-shrink-0">{icon}</div>
      <div className="flex-1 flex items-center justify-between min-w-0">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-sm text-gray-800 truncate max-w-[160px] ${mono ? "font-mono text-xs" : "font-medium"}`}>{value}</span>
      </div>
    </div>
  );
}
