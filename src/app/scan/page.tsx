"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Search,
  ArrowRight,
  Loader2,
  Package,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Plus,
  Barcode,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardBody } from "@/components/ui/Card";
import MovementModal from "@/components/product/MovementModal";
import { BarcodeResult, IProduct, MovementType, getStockStatus, getExpiryStatus } from "@/types";
import { t } from "@/i18n";

const BarcodeScanner = dynamic(
  () => import("@/components/scanner/BarcodeScanner"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-52 bg-gray-100 rounded-2xl animate-pulse" />
    ),
  }
);

type ScanPhase =
  | "idle"
  | "loading"
  | "found-db"
  | "found-off"
  | "not-found"
  | "error";

const STOCK_CONFIG = {
  good: { label: "Gut", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  low:  { label: "Niedriger Bestand", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  out:  { label: "Nicht vorrätig", cls: "bg-red-100 text-red-800 border-red-200" },
};

const EXPIRY_CONFIG = {
  normal:         null,
  "expiring-soon": { label: "Läuft bald ab", cls: "bg-orange-100 text-orange-800 border-orange-200" },
  expired:        { label: "Abgelaufen", cls: "bg-red-200 text-red-900 border-red-300" },
};

export default function ScanPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const [fullProduct, setFullProduct] = useState<IProduct | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [movementType, setMovementType] = useState<MovementType>("IN");
  const [showMovement, setShowMovement] = useState(false);

  const lookup = async (barcode: string) => {
    setPhase("loading");
    setScannedBarcode(barcode);
    setFullProduct(null);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(barcode)}`);
      if (!res.ok) throw new Error();
      const data: BarcodeResult = await res.json();
      setResult(data);

      if (data.source === "database" && data.product?._id) {
        // Fetch full product details for stock info
        const prodRes = await fetch(`/api/products/${data.product._id}`);
        if (prodRes.ok) {
          const prod: IProduct = await prodRes.json();
          setFullProduct(prod);
        }
        setPhase("found-db");
      } else if (data.source === "open-food-facts") {
        setPhase("found-off");
      } else {
        setPhase("not-found");
      }
    } catch {
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setFullProduct(null);
    setScannedBarcode("");
    setManualBarcode("");
  };

  const goToAdd = () => {
    const p = new URLSearchParams();
    p.set("barcode", scannedBarcode);
    if (result?.product?.name) p.set("name", result.product.name);
    if (result?.product?.image) p.set("image", result.product.image);
    router.push(`/inventory/new?${p}`);
  };

  const openMovement = (type: MovementType) => {
    setMovementType(type);
    setShowMovement(true);
  };

  const stockStatus = fullProduct ? getStockStatus(fullProduct) : null;
  const expiryStatus = fullProduct ? getExpiryStatus(fullProduct) : null;
  const category = fullProduct && typeof fullProduct.categoryId === "object"
    ? fullProduct.categoryId
    : null;

  return (
    <div>
      <Header title={t("scanner.title")} showBack />

      <div className="max-w-lg mx-auto space-y-4">
        {/* Camera card */}
        <Card>
          <CardBody>
            <BarcodeScanner onScan={lookup} />
          </CardBody>
        </Card>

        {/* Manual entry */}
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Barcode className="h-4 w-4 text-gray-400" />
              Barcode manuell eingeben
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="z.B. 4000000000000"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && manualBarcode.trim() && lookup(manualBarcode.trim())}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => manualBarcode.trim() && lookup(manualBarcode.trim())}
                disabled={!manualBarcode.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1"
              >
                <Search className="h-4 w-4" />
                Suchen
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Loading */}
        {phase === "loading" && (
          <Card>
            <CardBody className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <p className="text-gray-500">Barcode wird gesucht…</p>
            </CardBody>
          </Card>
        )}

        {/* ✅ FOUND IN DATABASE — full stock view */}
        {phase === "found-db" && fullProduct && (
          <div className="space-y-3">
            {/* Header result */}
            <div className="flex items-center gap-2 px-1">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700">
                Produkt im Inventar gefunden
              </p>
            </div>

            {/* Product stock card */}
            <Card>
              <CardBody className="space-y-4">
                {/* Product header */}
                <div className="flex items-start gap-3">
                  {fullProduct.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fullProduct.image}
                      alt={fullProduct.name}
                      className="w-16 h-16 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                      }
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 text-lg leading-tight">
                      {fullProduct.name}
                    </h2>
                    {category && (
                      <p className="text-xs text-gray-400 mt-0.5">{category.name}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {stockStatus && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STOCK_CONFIG[stockStatus].cls}`}
                        >
                          {STOCK_CONFIG[stockStatus].label}
                        </span>
                      )}
                      {expiryStatus && expiryStatus !== "normal" && EXPIRY_CONFIG[expiryStatus] && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${EXPIRY_CONFIG[expiryStatus]!.cls}`}
                        >
                          {EXPIRY_CONFIG[expiryStatus]!.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Prominent stock sentence ── */}
                {(() => {
                  const qty = fullProduct.quantity;
                  const unit = t(`unit.${fullProduct.unit}`);
                  const isOut = qty === 0;
                  const isLow = qty > 0 && qty <= fullProduct.minQuantity;
                  const bgCls = isOut
                    ? "bg-red-50 border-red-200"
                    : isLow
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200";
                  const textCls = isOut
                    ? "text-red-700"
                    : isLow
                    ? "text-amber-700"
                    : "text-emerald-700";
                  const numCls = isOut
                    ? "text-red-600"
                    : isLow
                    ? "text-amber-600"
                    : "text-emerald-600";
                  const emoji = isOut ? "⚠️" : isLow ? "📉" : "✅";
                  const sentence = isOut
                    ? `Sie haben dieses Produkt nicht mehr auf Lager.`
                    : `Sie haben noch ${qty} ${unit} auf Lager.`;

                  return (
                    <div className={`rounded-2xl border-2 ${bgCls} px-4 py-4`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{emoji}</span>
                        <div>
                          <p className={`text-base font-semibold ${textCls}`}>
                            {sentence}
                          </p>
                          {isLow && (
                            <p className="text-sm text-amber-600 mt-0.5">
                              Mindestbestand: {fullProduct.minQuantity} {unit}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Big number */}
                      <div className="mt-3 flex items-end gap-2">
                        <span className={`text-6xl font-black ${numCls}`}>
                          {qty}
                        </span>
                        <span className={`text-xl font-semibold ${textCls} mb-2`}>
                          {unit}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Min stock row */}
                <div className="flex items-center justify-between px-1 text-sm text-gray-500">
                  <span>Mindestbestand</span>
                  <span className="font-semibold text-gray-700">
                    {fullProduct.minQuantity} {t(`unit.${fullProduct.unit}`)}
                  </span>
                </div>

                {/* Extra info */}
                <div className="space-y-1.5">
                  {fullProduct.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 text-gray-300" />
                      {t(`location.${fullProduct.location}`)}
                    </div>
                  )}
                  {fullProduct.expiryDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-gray-300" />
                      Ablaufdatum:{" "}
                      {new Date(fullProduct.expiryDate).toLocaleDateString("de-DE")}
                    </div>
                  )}
                  {fullProduct.barcode && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Barcode className="h-4 w-4 text-gray-300" />
                      {fullProduct.barcode}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Schnellaktionen
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openMovement("IN")}
                      className="flex flex-col items-center gap-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                    >
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-xs font-medium">Eingang</span>
                    </button>
                    <button
                      onClick={() => openMovement("OUT")}
                      className="flex flex-col items-center gap-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                    >
                      <TrendingDown className="h-5 w-5" />
                      <span className="text-xs font-medium">Ausgang</span>
                    </button>
                    <button
                      onClick={() => openMovement("ADJUST")}
                      className="flex flex-col items-center gap-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                    >
                      <RotateCcw className="h-5 w-5" />
                      <span className="text-xs font-medium">Korrektur</span>
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Footer actions */}
            <div className="flex gap-2">
              <Link
                href={`/inventory/${fullProduct._id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                Produktdetails
              </Link>
              <button
                onClick={reset}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium"
              >
                Neu scannen
              </button>
            </div>
          </div>
        )}

        {/* Found on Open Food Facts */}
        {phase === "found-off" && result?.product && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    Daten von Open Food Facts
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {result.product.name}
                  </p>
                  {result.product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.product.image}
                      alt={result.product.name}
                      className="mt-2 w-16 h-16 object-cover rounded-xl"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                      }
                    />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Dieses Produkt ist noch nicht in Ihrem Inventar. Möchten Sie es
                hinzufügen?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={goToAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Zum Inventar hinzufügen
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium"
                >
                  Abbrechen
                </button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Not found anywhere */}
        {phase === "not-found" && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Produkt nicht gefunden
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Barcode: <span className="font-mono">{scannedBarcode}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={goToAdd}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Manuell hinzufügen
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium"
                >
                  Abbrechen
                </button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Error */}
        {phase === "error" && (
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Fehler bei der Suche</p>
              </div>
              <button
                onClick={reset}
                className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Erneut versuchen
              </button>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Movement modal */}
      {showMovement && fullProduct && (
        <MovementModal
          open={showMovement}
          onClose={() => setShowMovement(false)}
          onSuccess={() => {
            setShowMovement(false);
            // Refresh product data
            fetch(`/api/products/${fullProduct._id}`)
              .then((r) => r.json())
              .then(setFullProduct)
              .catch(console.error);
          }}
          productId={fullProduct._id}
          productName={fullProduct.name}
          currentQuantity={fullProduct.quantity}
          movementType={movementType}
        />
      )}
    </div>
  );
}
