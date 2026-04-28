"use client";

import { StockStatus, ExpiryStatus } from "@/types";
import { t } from "@/i18n";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "orange" | "darkred" | "blue" | "gray";
  className?: string;
}

export function Badge({ children, variant = "gray", className = "" }: BadgeProps) {
  const variants = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    yellow: "bg-amber-100 text-amber-800 border-amber-200",
    red: "bg-red-100 text-red-800 border-red-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    darkred: "bg-red-200 text-red-900 border-red-300",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StockBadge({ status }: { status: StockStatus }) {
  const variants: Record<StockStatus, "green" | "yellow" | "red"> = {
    good: "green",
    low: "yellow",
    out: "red",
  };

  const labels: Record<StockStatus, string> = {
    good: t("status.good"),
    low: t("status.low"),
    out: t("status.out"),
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

export function ExpiryBadge({ status }: { status: ExpiryStatus }) {
  if (status === "normal") return null;

  const variants: Record<"expiring-soon" | "expired", "orange" | "darkred"> = {
    "expiring-soon": "orange",
    expired: "darkred",
  };

  const labels: Record<"expiring-soon" | "expired", string> = {
    "expiring-soon": t("status.expiringSoon"),
    expired: t("status.expired"),
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

export function MovementTypeBadge({ type }: { type: "IN" | "OUT" | "ADJUST" }) {
  const config = {
    IN: { variant: "green" as const, label: t("movement.in") },
    OUT: { variant: "red" as const, label: t("movement.out") },
    ADJUST: { variant: "blue" as const, label: t("movement.correction") },
  };

  const { variant, label } = config[type];
  return <Badge variant={variant}>{label}</Badge>;
}
