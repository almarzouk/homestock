"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build page numbers with ellipsis
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <p className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">{from}–{to}</span> von <span className="font-medium text-gray-700">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all border
                ${p === page
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"}`}>
              {p}
            </button>
          )
        )}

        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
