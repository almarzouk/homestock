"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import { MovementTypeBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { IMovement, IProduct } from "@/types";
import { t } from "@/i18n";
import Link from "next/link";

export default function MovementsPage() {
  const [movements, setMovements] = useState<IMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/movements?limit=100")
      .then((r) => r.json())
      .then((data) => setMovements(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <Header title={t("movement.title")} />

      {movements.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t("movement.noMovements")}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("movement.productName")}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("movement.type")}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("movement.quantity")}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("movement.previousQuantity")}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("movement.newQuantity")}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("movement.date")}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("movement.note")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.map((m) => {
                  const product = m.productId as IProduct;
                  return (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {typeof product === "object" ? (
                          <Link
                            href={`/inventory/${product._id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <MovementTypeBadge type={m.type} />
                      </td>
                      <td className="px-6 py-3 text-gray-700">{m.quantity}</td>
                      <td className="px-6 py-3 text-gray-500">{m.previousQuantity}</td>
                      <td className="px-6 py-3 text-gray-700 font-medium">{m.newQuantity}</td>
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-3 text-gray-400 max-w-[150px] truncate">
                        {m.note || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {movements.map((m) => {
              const product = m.productId as IProduct;
              return (
                <div
                  key={m._id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <MovementTypeBadge type={m.type} />
                    <span className="text-xs text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {typeof product === "object" ? product.name : "-"}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>{m.previousQuantity} → {m.newQuantity}</span>
                    <span className="text-gray-400">({m.quantity})</span>
                  </div>
                  {m.note && (
                    <p className="text-xs text-gray-400 mt-1">{m.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
