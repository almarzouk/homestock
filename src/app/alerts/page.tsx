"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  TrendingDown,
  Calendar,
  ShieldCheck,
  Package,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { AlertsData, IProduct } from "@/types";
import { t } from "@/i18n";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const total =
    (alerts?.outOfStock.length ?? 0) +
    (alerts?.lowStock.length ?? 0) +
    (alerts?.expired.length ?? 0) +
    (alerts?.expiringSoon.length ?? 0);

  return (
    <div>
      <Header title={t("alerts.title")} />

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t("alerts.allGood")}</h2>
          <p className="text-gray-400">{t("alerts.noAlerts")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AlertSection
            title={t("alerts.outOfStock")}
            icon={<Package className="h-5 w-5 text-red-600" />}
            products={alerts?.outOfStock ?? []}
            badgeColor="bg-red-100 text-red-700 border-red-200"
            headerColor="border-red-100 bg-red-50"
          />
          <AlertSection
            title={t("alerts.lowStock")}
            icon={<TrendingDown className="h-5 w-5 text-amber-600" />}
            products={alerts?.lowStock ?? []}
            badgeColor="bg-amber-100 text-amber-700 border-amber-200"
            headerColor="border-amber-100 bg-amber-50"
          />
          <AlertSection
            title={t("alerts.expired")}
            icon={<AlertTriangle className="h-5 w-5 text-red-900" />}
            products={alerts?.expired ?? []}
            badgeColor="bg-red-200 text-red-900 border-red-300"
            headerColor="border-red-200 bg-red-50"
          />
          <AlertSection
            title={t("alerts.expiringSoon")}
            icon={<Calendar className="h-5 w-5 text-orange-600" />}
            products={alerts?.expiringSoon ?? []}
            badgeColor="bg-orange-100 text-orange-700 border-orange-200"
            headerColor="border-orange-100 bg-orange-50"
          />
        </div>
      )}
    </div>
  );
}

interface AlertSectionProps {
  title: string;
  icon: React.ReactNode;
  products: IProduct[];
  badgeColor: string;
  headerColor: string;
}

function AlertSection({
  title,
  icon,
  products,
  badgeColor,
  headerColor,
}: AlertSectionProps) {
  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2 px-6 py-3 border-b ${headerColor}`}>
        {icon}
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <span
          className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}
        >
          {products.length}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {products.map((product) => {
          const category =
            typeof product.categoryId === "object" ? product.categoryId : null;
          return (
            <Link
              key={product._id}
              href={`/inventory/${product._id}`}
              className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-400">
                  {category?.name ?? ""}{" "}
                  {product.location ? `· ${t(`location.${product.location}`)}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">
                  {product.quantity} / {product.minQuantity}
                </p>
                {product.expiryDate && (
                  <p className="text-xs text-gray-400">
                    {new Date(product.expiryDate).toLocaleDateString("de-DE")}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
