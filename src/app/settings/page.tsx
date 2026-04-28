"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Edit2, Trash2, Tag, MapPin, ChevronRight,
  Layers, Database, RefreshCw, CheckCircle, Package,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { CategorySchema, CategoryFormData } from "@/schemas/product.schema";
import { ICategory } from "@/types";
import { t } from "@/i18n";

interface ILocation { _id: string; name: string; icon: string; color: string; }

const LocationSchema = z.object({
  name: z.string().min(1, "Name erforderlich").max(40),
  icon: z.string().max(4).optional(),
  color: z.string().optional(),
});
type LocationFormData = z.infer<typeof LocationSchema>;

const PRESET_ICONS = ["🍳", "📦", "❄️", "🧊", "🗄️", "🛁", "🚗", "🏚️", "🏠", "🌿", "💊", "🔧", "🎁", "🍷", "🧴"];

type SettingsTab = "categories" | "locations" | "data";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("categories");

  return (
    <div>
      <Header title={t("settings.title")} subtitle="Kategorien, Lagerorte und mehr" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1">
        {([
          { key: "categories", icon: Tag, label: "Kategorien" },
          { key: "locations", icon: MapPin, label: "Lagerorte" },
          { key: "data", icon: Database, label: "Daten" },
        ] as { key: SettingsTab; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all
              ${activeTab === key ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "categories" && <CategoriesTab />}
      {activeTab === "locations" && <LocationsTab />}
      {activeTab === "data" && <DataTab />}
    </div>
  );
}

/* ─── Categories Tab ──────────────────────────────────────── */
function CategoriesTab() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ICategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } =
    useForm<CategoryFormData>({ resolver: zodResolver(CategorySchema) as never });

  const fetch_ = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const openAdd = () => { setEditing(null); reset({ name: "", color: "" }); setServerError(null); setShowModal(true); };
  const openEdit = (c: ICategory) => { setEditing(c); setValue("name", c.name); setValue("color", c.color || ""); setServerError(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); reset(); setServerError(null); };

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setSubmitting(true); setServerError(null);
    try {
      const url = editing ? `/api/categories/${editing._id}` : "/api/categories";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || t("common.serverError")); }
      closeModal(); fetch_();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("common.serverError"));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try { await fetch(`/api/categories/${deletingId}`, { method: "DELETE" }); setDeletingId(null); fetch_(); }
    finally { setDeleting(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-gray-800">{t("settings.categories")}</h2>
            <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">{categories.length}</span>
          </div>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" />{t("settings.addCategory")}</Button>
        </div>
        {categories.length === 0 ? (
          <div className="px-6 py-8"><EmptyState icon={Tag} title={t("settings.noCategories")} action={{ label: t("settings.addCategory"), onClick: openAdd }} /></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: (cat.color || "#e5e7eb") + "33", border: `2px solid ${cat.color || "#e5e7eb"}` }}>
                  <div className="w-full h-full rounded-md" style={{ backgroundColor: cat.color || "#e5e7eb" }} />
                </div>
                <span className="flex-1 font-medium text-gray-800">{cat.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cat)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => setDeletingId(cat._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editing ? t("settings.editCategory") : t("settings.addCategory")}
        footer={<><Button variant="outline" onClick={closeModal} disabled={submitting}>{t("common.cancel")}</Button><Button onClick={handleSubmit(onSubmit)} loading={submitting}>{t("common.save")}</Button></>}>
        <div className="space-y-4">
          {serverError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{serverError}</div>}
          <Input label={t("settings.categoryName")} required error={errors.name?.message} {...register("name")} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("settings.categoryColor")}</label>
            <div className="flex items-center gap-3">
              <input type="color" className="h-10 w-16 rounded-lg cursor-pointer border border-gray-300 p-1" {...register("color")} />
              <Input placeholder="#3b82f6" error={errors.color?.message} {...register("color")} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete}
        title={t("settings.deleteCategory")} message={t("common.confirmDelete")} loading={deleting} />
    </>
  );
}

/* ─── Locations Tab ──────────────────────────────────────── */
function LocationsTab() {
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ILocation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } =
    useForm<LocationFormData>({ resolver: zodResolver(LocationSchema) as never });

  const selectedIcon = watch("icon") || "📦";

  const fetch_ = async () => {
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const openAdd = () => { setEditing(null); reset({ name: "", icon: "📦", color: "#6b7280" }); setServerError(null); setShowModal(true); };
  const openEdit = (l: ILocation) => { setEditing(l); setValue("name", l.name); setValue("icon", l.icon); setValue("color", l.color); setServerError(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); reset(); setServerError(null); };

  const onSubmit: SubmitHandler<LocationFormData> = async (data) => {
    setSubmitting(true); setServerError(null);
    try {
      const url = editing ? `/api/locations/${editing._id}` : "/api/locations";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || "Fehler"); }
      closeModal(); fetch_();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Fehler");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try { await fetch(`/api/locations/${deletingId}`, { method: "DELETE" }); setDeletingId(null); fetch_(); }
    finally { setDeleting(false); }
  };

  const seedLocations = async () => {
    setSeeding(true);
    try { await fetch("/api/seed/locations", { method: "POST" }); fetch_(); }
    finally { setSeeding(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-500" />
            <h2 className="font-semibold text-gray-800">Lagerorte</h2>
            <span className="ml-1 text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">{locations.length}</span>
          </div>
          <div className="flex gap-2">
            {locations.length === 0 && (
              <Button size="sm" variant="outline" onClick={seedLocations} loading={seeding}>
                <RefreshCw className="h-4 w-4" /> Standard laden
              </Button>
            )}
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" />Hinzufügen</Button>
          </div>
        </div>

        {locations.length === 0 ? (
          <div className="px-6 py-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">📦</div>
            <p className="text-gray-500 text-sm text-center">Noch keine Lagerorte. Klicken Sie auf &quot;Standard laden&quot; oder fügen Sie eigene hinzu.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {locations.map((loc) => (
              <div key={loc._id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: (loc.color || "#6b7280") + "20" }}>
                  {loc.icon || "📦"}
                </div>
                <span className="flex-1 font-medium text-gray-800">{loc.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(loc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => setDeletingId(loc._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editing ? "Lagerort bearbeiten" : "Lagerort hinzufügen"}
        footer={<><Button variant="outline" onClick={closeModal} disabled={submitting}>{t("common.cancel")}</Button><Button onClick={handleSubmit(onSubmit)} loading={submitting}>{t("common.save")}</Button></>}>
        <div className="space-y-4">
          {serverError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{serverError}</div>}
          <Input label="Name" required placeholder="z.B. Küche, Keller, Garage…" error={errors.name?.message} {...register("name")} />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Emoji auswählen</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_ICONS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setValue("icon", emoji)}
                  className={`w-10 h-10 rounded-xl text-xl transition-all ${selectedIcon === emoji ? "bg-blue-100 ring-2 ring-blue-400" : "bg-gray-100 hover:bg-gray-200"}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <Input placeholder="Eigenes Emoji eingeben" {...register("icon")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Farbe</label>
            <input type="color" className="h-10 w-full rounded-xl cursor-pointer border border-gray-300 p-1" {...register("color")} />
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete}
        title="Lagerort löschen" message="Möchten Sie diesen Lagerort wirklich löschen?" loading={deleting} />
    </>
  );
}

/* ─── Data Tab ───────────────────────────────────────────── */
function DataTab() {
  const [seeding, setSeeding] = useState<string | null>(null);
  const [results, setResults] = useState<{ action: string; status: "success" | "error" } | null>(null);

  const run = async (label: string, url: string) => {
    setSeeding(label); setResults(null);
    try {
      const res = await fetch(url, { method: "POST" });
      setResults({ action: label, status: res.ok ? "success" : "error" });
    } catch {
      setResults({ action: label, status: "error" });
    } finally { setSeeding(null); }
  };

  const actions = [
    { label: "Standard-Kategorien laden", icon: Tag, url: "/api/seed/categories", desc: "20 vordefinierte Kategorien einfügen" },
    { label: "Standard-Lagerorte laden", icon: MapPin, url: "/api/seed/locations", desc: "8 Standard-Lagerorte (Küche, Lager, …)" },
    { label: "Admin-Benutzer erstellen", icon: Package, url: "/api/seed", desc: "Admin-Konto zurücksetzen / erstellen" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Layers className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold text-gray-800">Datenverwaltung</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {actions.map(({ label, icon: Icon, url, desc }) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Icon className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
              <button onClick={() => run(label, url)} disabled={!!seeding}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                {seeding === label ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Ausführen
              </button>
            </div>
          ))}
        </div>
      </div>

      {results && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${results.status === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium text-sm">{results.action} — {results.status === "success" ? "Erfolgreich ausgeführt!" : "Fehler aufgetreten"}</p>
        </div>
      )}
    </div>
  );
}
