"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  TrendingDown,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  ScanBarcode,
  Bell,
  ShoppingCart,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
} from "lucide-react";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { t } from "@/i18n";
import { DashboardStats, IMovement, IProduct } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STAT_CONFIG = [
  {
    key: "totalProducts" as const,
    label: "Produkte",
    icon: Package,
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
    ring: "ring-blue-200",
  },
  {
    key: "lowStockCount" as const,
    label: "Niedriger Bestand",
    icon: TrendingDown,
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
    ring: "ring-amber-200",
  },
  {
    key: "expiredCount" as const,
    label: "Abgelaufen",
    icon: AlertTriangle,
    gradient: "from-red-500 to-rose-600",
    bg: "bg-red-50",
    text: "text-red-600",
    ring: "ring-red-200",
  },
  {
    key: "expiringSoonCount" as const,
    label: "Läuft bald ab",
    icon: Clock,
    gradient: "from-orange-400 to-amber-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
    ring: "ring-orange-200",
  },
];

const QUICK_ACTIONS = [
  { href: "/inventory/new", label: "Produkt hinzufügen", icon: Plus, gradient: "from-blue-500 to-blue-600", desc: "Neues Produkt" },
  { href: "/scan", label: "Barcode scannen", icon: ScanBarcode, gradient: "from-emerald-500 to-teal-600", desc: "Scannen" },
  { href: "/alerts", label: "Warnungen", icon: Bell, gradient: "from-amber-400 to-orange-500", desc: "Benachrichtigungen" },
  { href: "/shopping-list", label: "Einkaufsliste", icon: ShoppingCart, gradient: "from-purple-500 to-violet-600", desc: "Einkaufen" },
];

function MovementIcon({ type }: { type: string }) {
  if (type === "IN") return (
    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
    </div>
  );
  if (type === "OUT") return (
    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
      <RefreshCcw className="h-4 w-4 text-blue-600" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setStats)
      .catch(() => setError(t("common.serverError")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-0.5">{today}</p>
        <h1 className="text-2xl font-extrabold text-gray-900">{t("dashboard.title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t("app.tagline")}</p>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CONFIG.map(({ key, label, icon: Icon, gradient, bg, text, ring }) => {
          const val = stats?.[key] ?? 0;
          const isWarning = val > 0 && key !== "totalProducts";
          return (
            <div key={key}
              className={`relative overflow-hidden rounded-2xl p-4 bg-white border shadow-sm transition-all ${isWarning ? `ring-2 ${ring}` : "border-gray-200"}`}>
              {/* Background accent */}
              {isWarning && (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.06] pointer-events-none`} />
              )}
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${text}`} />
              </div>
              <p className={`text-3xl font-black ${isWarning ? text : "text-gray-900"}`}>{val}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5 leading-tight">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Schnellzugriff</h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, gradient, desc }) => (
            <Link key={href} href={href}
              className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${gradient} text-white shadow-sm active:scale-95 transition-transform`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <ArrowRight className="h-4 w-4 text-white/60" />
              </div>
              <p className="text-xs text-white/70 font-medium">{desc}</p>
              <p className="text-sm font-bold text-white leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">{t("dashboard.recentMovements")}</h2>
          </div>
          <Link href="/movements"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
            {t("dashboard.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!stats?.recentMovements?.length ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400">{t("dashboard.noMovements")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentMovements.map((movement: IMovement) => {
              const product = movement.productId as IProduct;
              const delta = movement.newQuantity - movement.previousQuantity;
              return (
                <div key={movement._id} className="flex items-center gap-3 px-5 py-3">
                  <MovementIcon type={movement.type} />

                  {/* Product image */}
                  {product?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name}
                      className="w-9 h-9 rounded-xl object-contain bg-gray-50 border border-gray-100 p-0.5 flex-shrink-0"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-gray-200" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {typeof product === "object" ? product.name : "—"}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(movement.createdAt)}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-blue-500"}`}>
                      {delta > 0 ? "+" : ""}{delta}
                    </p>
                    <p className="text-xs text-gray-400">{movement.newQuantity} gesamt</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Low stock preview */}
      {(stats?.lowStockCount ?? 0) > 0 && (
        <Link href="/alerts"
          className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">{stats?.lowStockCount} Artikel mit niedrigem Bestand</p>
            <p className="text-xs text-amber-600">Jetzt Einkaufsliste prüfen</p>
          </div>
          <ArrowRight className="h-5 w-5 text-amber-400 flex-shrink-0" />
        </Link>
      )}
    </div>
  );
}
