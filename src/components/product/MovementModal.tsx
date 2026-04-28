"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { MovementSchema, MovementFormData } from "@/schemas/product.schema";
import { MovementType } from "@/types";
import { t } from "@/i18n";

interface MovementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  productName: string;
  currentQuantity: number;
  movementType: MovementType;
}

const TYPE_CONFIG = {
  IN: {
    title: () => t("movement.increase"),
    color: "primary" as const,
  },
  OUT: {
    title: () => t("movement.decrease"),
    color: "danger" as const,
  },
  ADJUST: {
    title: () => t("movement.adjust"),
    color: "secondary" as const,
  },
};

export default function MovementModal({
  open,
  onClose,
  onSuccess,
  productId,
  productName,
  currentQuantity,
  movementType,
}: MovementModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const config = TYPE_CONFIG[movementType];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MovementFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(MovementSchema) as any,
    defaultValues: {
      productId,
      type: movementType,
      quantity: movementType === "ADJUST" ? currentQuantity : 1,
      note: "",
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit: SubmitHandler<MovementFormData> = async (data) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, productId, type: movementType }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || t("common.serverError"));
      }

      handleClose();
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("common.serverError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={config.title()}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={config.color}
            onClick={handleSubmit(onSubmit)}
            loading={submitting}
          >
            {t("common.confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {serverError}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg px-4 py-3">
          <p className="text-sm text-gray-500">{t("product.name")}</p>
          <p className="font-semibold text-gray-900">{productName}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t("product.currentQuantity")}:{" "}
            <span className="font-medium text-gray-800">{currentQuantity}</span>
          </p>
        </div>

        <Input
          label={movementType === "ADJUST" ? t("movement.newQuantity") : t("movement.quantity")}
          type="number"
          min={movementType === "ADJUST" ? 0 : 0.001}
          step="0.01"
          required
          error={errors.quantity?.message}
          {...register("quantity")}
        />

        <Textarea
          label={t("movement.note")}
          placeholder={t("movement.notePlaceholder")}
          rows={2}
          {...register("note")}
        />
      </div>
    </Modal>
  );
}
