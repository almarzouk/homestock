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
} from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { MovementTypeBadge } from "@/components/ui/Badge";
import { t } from "@/i18n";
import { DashboardStats, IMovement, IProduct } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Fehler beim Laden");
        const data = await res.json();
        setStats(data);
      } catch {
        setError(t("common.serverError"));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">{error}</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("app.tagline")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t("dashboard.totalProducts")}
          value={stats?.totalProducts ?? 0}
          icon={<Package className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={t("dashboard.lowStock")}
          value={stats?.lowStockCount ?? 0}
          icon={<TrendingDown className="h-6 w-6" />}
          color="amber"
        />
        <StatCard
          title={t("dashboard.expiredProducts")}
          value={stats?.expiredCount ?? 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title={t("dashboard.expiringSoon")}
          value={stats?.expiringSoonCount ?? 0}
          icon={<Clock className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">
              {t("dashboard.recentMovements")}
            </h2>
          </div>
          <Link
            href="/movements"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            {t("dashboard.viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!stats?.recentMovements?.length ? (
          <div className="py-12 text-center text-gray-400">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">{t("dashboard.noMovements")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentMovements.map((movement: IMovement) => {
              const product = movement.productId as IProduct;
              return (
                <div
                  key={movement._id}
                  className="flex items-center gap-4 px-6 py-3"
                >
                  <MovementTypeBadge type={movement.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {typeof product === "object" ? product.name : "-"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(movement.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">
                      {movement.previousQuantity} → {movement.newQuantity}
                    </p>
                    {movement.note && (
                      <p className="text-xs text-gray-400 truncate max-w-[120px]">
                        {movement.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/inventory/new", label: t("product.add"), color: "bg-blue-600 hover:bg-blue-700 text-white" },
          { href: "/scan", label: t("scanner.title"), color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
          { href: "/alerts", label: t("alerts.title"), color: "bg-amber-500 hover:bg-amber-600 text-white" },
          { href: "/shopping-list", label: t("shoppingList.title"), color: "bg-purple-600 hover:bg-purple-700 text-white" },
        ].map(({ href, label, color }) => (
          <Link
            key={href}
            href={href}
            className={`${color} px-4 py-3 rounded-xl text-sm font-medium text-center transition-colors`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
