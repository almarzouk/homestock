"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Edit,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  Calendar,
  MapPin,
  Tag,
  Barcode,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
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

      if (!productRes.ok) {
        router.push("/inventory");
        return;
      }

      const productData = await productRes.json();
      const movementsData = await movementsRes.json();

      setProduct(productData);
      setMovements(Array.isArray(movementsData) ? movementsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMovement = (type: MovementType) => {
    setMovementType(type);
    setShowMovementModal(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/inventory");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!product) return null;

  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product);
  const category = typeof product.categoryId === "object" ? product.categoryId : null;

  return (
    <div>
      <Header
        title={product.name}
        showBack
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/inventory/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
                {t("common.edit")}
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4" />
              {t("common.delete")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Image / Icon */}
          <Card>
            <CardBody className="flex flex-col items-center py-6">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-32 h-32 object-cover rounded-2xl mb-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Package className="h-16 w-16 text-gray-300" />
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 text-center">
                {product.name}
              </h2>
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                <StockBadge status={stockStatus} />
                {expiryStatus !== "normal" && (
                  <ExpiryBadge status={expiryStatus} />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-800">Details</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <DetailRow
                icon={<Package className="h-4 w-4 text-gray-400" />}
                label={t("product.quantity")}
                value={`${product.quantity} ${t(`unit.${product.unit}`)}`}
                highlight
              />
              <DetailRow
                icon={<Package className="h-4 w-4 text-gray-400" />}
                label={t("product.minQuantity")}
                value={`${product.minQuantity} ${t(`unit.${product.unit}`)}`}
              />
              {category && (
                <DetailRow
                  icon={<Tag className="h-4 w-4 text-gray-400" />}
                  label={t("product.category")}
                  value={category.name}
                />
              )}
              {product.location && (
                <DetailRow
                  icon={<MapPin className="h-4 w-4 text-gray-400" />}
                  label={t("product.location")}
                  value={t(`location.${product.location}`)}
                />
              )}
              {product.expiryDate && (
                <DetailRow
                  icon={<Calendar className="h-4 w-4 text-gray-400" />}
                  label={t("product.expiryDate")}
                  value={new Date(product.expiryDate).toLocaleDateString("de-DE")}
                />
              )}
              {product.barcode && (
                <DetailRow
                  icon={<Barcode className="h-4 w-4 text-gray-400" />}
                  label={t("product.barcode")}
                  value={product.barcode}
                />
              )}
              {product.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{t("product.notes")}</p>
                  <p className="text-sm text-gray-700">{product.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-800">{t("common.actions")}</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="primary"
                  onClick={() => handleMovement("IN")}
                  className="flex-col h-16 gap-1"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">{t("movement.increase")}</span>
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleMovement("OUT")}
                  className="flex-col h-16 gap-1"
                >
                  <Minus className="h-5 w-5" />
                  <span className="text-xs">{t("movement.decrease")}</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleMovement("ADJUST")}
                  className="flex-col h-16 gap-1"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span className="text-xs">{t("movement.adjust")}</span>
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Movement History */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-800">
                {t("product.movementHistory")}
              </h3>
            </CardHeader>
            {movements.length === 0 ? (
              <CardBody>
                <p className="text-sm text-gray-400 text-center py-4">
                  {t("product.noMovements")}
                </p>
              </CardBody>
            ) : (
              <div className="divide-y divide-gray-50">
                {movements.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center gap-4 px-6 py-3"
                  >
                    <MovementTypeBadge type={m.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        {m.previousQuantity} → {m.newQuantity}
                      </p>
                      {m.note && (
                        <p className="text-xs text-gray-400">{m.note}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Movement Modal */}
      {showMovementModal && (
        <MovementModal
          open={showMovementModal}
          onClose={() => setShowMovementModal(false)}
          onSuccess={fetchData}
          productId={id}
          productName={product.name}
          currentQuantity={product.quantity}
          movementType={movementType}
        />
      )}

      {/* Delete Modal */}
      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t("product.delete")}
        message={t("common.confirmDelete")}
        loading={deleting}
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="flex-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span
          className={`text-sm ${highlight ? "font-bold text-gray-900" : "text-gray-700"}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
