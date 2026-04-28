"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, Tag } from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { CategorySchema, CategoryFormData } from "@/schemas/product.schema";
import { ICategory } from "@/types";
import { t } from "@/i18n";

export default function SettingsPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CategoryFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CategorySchema) as any,
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditingCategory(null);
    reset({ name: "", color: "" });
    setServerError(null);
    setShowModal(true);
  };

  const openEdit = (category: ICategory) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("color", category.color || "");
    setServerError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    reset();
    setServerError(null);
  };

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory._id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || t("common.serverError"));
      }

      closeModal();
      fetchCategories();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("common.serverError"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await fetch(`/api/categories/${deletingId}`, { method: "DELETE" });
      setShowDeleteModal(false);
      setDeletingId(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Header title={t("settings.title")} />

      {/* Categories Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-800">{t("settings.categories")}</h2>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            {t("settings.addCategory")}
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="px-6 py-8">
            <EmptyState
              icon={Tag}
              title={t("settings.noCategories")}
              action={{ label: t("settings.addCategory"), onClick: openAdd }}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center gap-4 px-6 py-3"
              >
                <div
                  className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: cat.color || "#e5e7eb" }}
                />
                <span className="flex-1 font-medium text-gray-800">
                  {cat.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(cat._id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={
          editingCategory
            ? t("settings.editCategory")
            : t("settings.addCategory")
        }
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={submitting}
            >
              {t("common.save")}
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
          <Input
            label={t("settings.categoryName")}
            required
            error={errors.name?.message}
            {...register("name")}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {t("settings.categoryColor")}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-16 rounded-lg cursor-pointer border border-gray-300 p-1"
                {...register("color")}
              />
              <Input
                placeholder="#3b82f6"
                error={errors.color?.message}
                {...register("color")}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t("settings.deleteCategory")}
        message={t("common.confirmDelete")}
        loading={deleting}
      />
    </div>
  );
}
