"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Package, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import Header from "@/components/layout/Header";
import { MovementTypeBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { IMovement, IProduct } from "@/types";
import { t } from "@/i18n";
import Link from "next/link";

const PAGE_SIZE = 20;

function MovementIcon({ type }: { type: string }) {
  if (type === "IN") return <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0"><ArrowUp className="h-4 w-4 text-emerald-600" /></div>;
  if (type === "OUT") return <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"><ArrowDown className="h-4 w-4 text-red-600" /></div>;
  return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><RotateCcw className="h-4 w-4 text-blue-600" /></div>;
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<IMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/movements?page=${page}&limit=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((data) => {
        setMovements(Array.isArray(data.movements) ? data.movements : []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <Header title={t("movement.title")} subtitle={total > 0 ? `${total} Einträge` : undefined} />

      {total === 0 ? (
        <EmptyState icon={TrendingUp} title={t("movement.noMovements")} />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produkt</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Typ</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Änderung</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bestand</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notiz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movements.map((m) => {
                    const product = m.productId as IProduct;
                    const isObj = typeof product === "object" && product !== null;
                    return (
                      <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          {isObj ? (
                            <Link href={`/inventory/${product._id}`} className="flex items-center gap-3 group">
                              {product.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.image} alt={product.name}
                                  className="w-10 h-10 object-contain rounded-lg bg-gray-50 border border-gray-100 p-0.5 flex-shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package className="h-5 w-5 text-gray-300" />
                                </div>
                              )}
                              <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[160px]">
                                {product.name}
                              </span>
                            </Link>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3"><MovementTypeBadge type={m.type} /></td>
                        <td className="px-5 py-3 text-center">
                          <span className={`font-bold text-sm ${m.type === "IN" ? "text-emerald-600" : m.type === "OUT" ? "text-red-500" : "text-blue-600"}`}>
                            {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "±"}{m.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center text-gray-500 text-sm">
                          {m.previousQuantity} → <span className="font-semibold text-gray-800">{m.newQuantity}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(m.createdAt).toLocaleDateString("de-DE", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3 text-gray-400 max-w-[140px] truncate text-xs">{m.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-50">
              {movements.map((m) => {
                const product = m.productId as IProduct;
                const isObj = typeof product === "object" && product !== null;
                return (
                  <div key={m._id} className="flex items-center gap-3 px-4 py-3">
                    {isObj ? (
                      product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name}
                          className="w-12 h-12 object-contain rounded-xl bg-gray-50 border border-gray-100 p-0.5 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )
                    ) : <MovementIcon type={m.type} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <MovementTypeBadge type={m.type} />
                        <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString("de-DE")}</span>
                      </div>
                      <p className="font-semibold text-gray-900 truncate text-sm">{isObj ? product.name : "—"}</p>
                      {m.note && <p className="text-xs text-gray-400 truncate">{m.note}</p>}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-lg font-black ${m.type === "IN" ? "text-emerald-600" : m.type === "OUT" ? "text-red-500" : "text-blue-600"}`}>
                        {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "±"}{m.quantity}
                      </p>
                      <p className="text-xs text-gray-400">{m.previousQuantity}→{m.newQuantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE}
            onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </div>
  );
}
