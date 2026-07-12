"use client";

import { useEffect, useState } from "react";
import { Clock, Package } from "lucide-react";
import { UpgradeButton } from "@/components/UpgradeButton";
import { GuidedTourBanner } from "@/components/GuidedTourBanner";
import { usePlan, useIsMember } from "@/components/PlanContext";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  unit_price: number;
  type: "fixed" | "hourly";
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

const EMPTY_FIXED = { name: "", description: "", unit: "forfait", unit_price: 0 };
const EMPTY_HOURLY = { name: "", description: "", unit: "heure", unit_price: 0 };

export default function CataloguePage() {
  const plan = usePlan();       // plan workspace (owner) depuis le layout
  const isMember = useIsMember(); // les membres voient le catalogue en lecture seule
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state, shared for create/edit
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"fixed" | "hourly">("fixed");
  const [form, setForm] = useState(EMPTY_FIXED);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const inputCls = "w-full px-3 py-2 rounded-lg bg-ds-bg border border-ds-border text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white placeholder:text-gray-600";

  useEffect(() => {
    fetch("/api/catalog").then((r) => r.json()).then((catalogData) => {
      setItems(catalogData.items || []);
    }).finally(() => setLoading(false));
  }, []);

  const fixedItems = items.filter((i) => i.type === "fixed");
  const hourlyItems = items.filter((i) => i.type === "hourly");

  function openCreate(type: "fixed" | "hourly") {
    setEditId(null);
    setFormType(type);
    setForm(type === "hourly" ? { ...EMPTY_HOURLY } : { ...EMPTY_FIXED });
    setShowForm(true);
  }

  function openEdit(item: CatalogItem) {
    setEditId(item.id);
    setFormType(item.type);
    setForm({ name: item.name, description: item.description || "", unit: item.unit, unit_price: item.unit_price });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const isEdit = !!editId;
    const url = isEdit ? `/api/catalog/${editId}` : "/api/catalog";
    const method = isEdit ? "PATCH" : "POST";
    const payload = formType === "hourly"
      ? { ...form, unit: "heure", type: "hourly" }
      : { ...form, type: "fixed" };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      if (isEdit) {
        setItems((prev) => prev.map((i) => (i.id === editId ? data.item : i)));
      } else {
        setItems((prev) => [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name)));
      }
      closeForm();
    } else {
      alert(data.message || data.error);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette prestation ?")) return;
    await fetch(`/api/catalog/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) return <div className="text-center py-16 text-gray-500">Chargement…</div>;

  // Gate Pro — jamais affiché aux membres (ils utilisent les features de l'owner)
  if (!isMember && plan !== "pro") {
    return (
      <div className="max-w-2xl mx-auto">
        <GuidedTourBanner pageKey="catalogue" />
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight">Services</h1>
          <p className="text-gray-500 text-sm mt-1">Sauvegardez vos prestations pour les réutiliser en un clic.</p>
        </div>
        <div className="bg-ds-surface border border-ds-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-white font-semibold mb-1">Fonctionnalité Pro</p>
          <p className="text-gray-500 text-sm mb-6">
            Créez votre catalogue de prestations et insérez-les en un clic dans vos devis.
          </p>
          <UpgradeButton plan="pro" label="Passer Pro" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <GuidedTourBanner pageKey="catalogue" />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white tracking-tight">Services</h1>
        <p className="text-gray-500 text-sm mt-1">
          {items.length} prestation{items.length !== 1 ? "s" : ""}, réutilisables en un clic dans vos devis et factures.
        </p>
      </div>

      {/* ── Formulaire création / édition ── */}
      {showForm && (
        <div className={`border rounded-xl p-6 mb-8 ${formType === "hourly" ? "bg-ds-surface border-violet-500/30" : "bg-ds-surface border-indigo-500/30"}`}>
          <div className="flex items-center gap-2 mb-4">
            {formType === "hourly"
              ? <Clock size={15} className="text-violet-400" />
              : <Package size={15} className="text-indigo-400" />
            }
            <h2 className="font-semibold text-white text-sm">
              {editId ? "Modifier" : "Nouvelle prestation"} —{" "}
              <span className={formType === "hourly" ? "text-violet-400" : "text-indigo-400"}>
                {formType === "hourly" ? "Taux horaire" : "À l'acte"}
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nom *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={formType === "hourly" ? "Ex: Développement / Conseil / Audit…" : "Ex: Page web, Landing page, Logo…"}
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Détail de la prestation (optionnel)"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className={formType === "hourly" ? "" : "grid grid-cols-2 gap-3"}>
              {formType === "fixed" && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Unité</label>
                  <input
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="forfait, jour, page…"
                    className={inputCls}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {formType === "hourly" ? "Taux horaire HT (€/h)" : "Prix HT (€)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_price}
                  onChange={(e) => setForm((f) => ({ ...f, unit_price: parseFloat(e.target.value) || 0 }))}
                  className={inputCls}
                />
              </div>
            </div>
            {formType === "hourly" && (
              <p className="text-xs text-gray-600">
                Lors de l'ajout à un devis ou une facture, vous choisirez le nombre d'heures (par tranche de 15 min).
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={closeForm}
              className="px-4 py-2 text-sm bg-ds-elevated hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {saving ? "Enregistrement…" : editId ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </div>
      )}

      {/* ── Section À l'acte ── */}
      <Section
        title="À l'acte"
        description="Forfaits, livrables, jours, pages… Un prix fixe par unité."
        icon={<Package size={15} className="text-gray-400" />}
        badge={<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-ds-elevated border border-ds-border text-gray-400">{fixedItems.length}</span>}
        onAdd={isMember ? null : () => openCreate("fixed")}
        addLabel="+ Prestation"
        accentColor="indigo"
      >
        {fixedItems.length === 0 ? (
          <EmptyState
            icon="🏷️"
            text="Aucune prestation à l'acte"
            sub={isMember ? "Le propriétaire n'a pas encore créé de prestations à l'acte." : "Forfaits, livrables uniques, tarifs fixes…"}
            onAdd={isMember ? null : () => openCreate("fixed")}
            addLabel="+ Ajouter une prestation"
          />
        ) : (
          <div className="space-y-2">
            {fixedItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                badge={<span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-ds-elevated border border-ds-border text-gray-500">À l&apos;acte</span>}
                priceLabel={`${fmt(item.unit_price)} / ${item.unit}`}
                onEdit={isMember ? null : () => openEdit(item)}
                onDelete={isMember ? null : () => handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── Section Taux horaire ── */}
      <Section
        title="Taux horaire"
        description="Facturez au temps passé, par tranches de 15 minutes."
        icon={<Clock size={15} className="text-violet-400" />}
        badge={<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400">{hourlyItems.length}</span>}
        onAdd={isMember ? null : () => openCreate("hourly")}
        addLabel="+ Taux horaire"
        accentColor="violet"
      >
        {hourlyItems.length === 0 ? (
          <EmptyState
            icon="⏱️"
            text="Aucun taux horaire défini"
            sub={isMember ? "Le propriétaire n'a pas encore défini de taux horaires." : "Conseil, développement, formation… Tout ce qui se facture au temps."}
            onAdd={isMember ? null : () => openCreate("hourly")}
            addLabel="+ Ajouter un taux horaire"
          />
        ) : (
          <div className="space-y-2">
            {hourlyItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                badge={<span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center gap-1"><Clock size={9} />Horaire</span>}
                priceLabel={`${fmt(item.unit_price)} / h`}
                onEdit={isMember ? null : () => openEdit(item)}
                onDelete={isMember ? null : () => handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  title, description, icon, badge, onAdd, addLabel, accentColor, children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: React.ReactNode;
  onAdd: (() => void) | null;
  addLabel: string;
  accentColor: "indigo" | "violet";
  children: React.ReactNode;
}) {
  const btnCls = accentColor === "violet"
    ? "text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:bg-violet-500/10"
    : "text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10";

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {badge}
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${btnCls}`}
          >
            {addLabel}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      {children}
    </div>
  );
}

function EmptyState({ icon, text, sub, onAdd, addLabel }: {
  icon: string; text: string; sub: string; onAdd: (() => void) | null; addLabel: string;
}) {
  return (
    <div className="text-center py-8 border border-dashed border-ds-border rounded-xl">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-gray-400 text-sm font-medium">{text}</p>
      <p className="text-gray-600 text-xs mt-0.5">{sub}</p>
      {onAdd && (
        <button onClick={onAdd} className="mt-3 text-indigo-400 text-xs font-semibold hover:underline">
          {addLabel}
        </button>
      )}
    </div>
  );
}

function ItemRow({ item, badge, priceLabel, onEdit, onDelete }: {
  item: CatalogItem;
  badge: React.ReactNode;
  priceLabel: string;
  onEdit: (() => void) | null;
  onDelete: (() => void) | null;
}) {
  return (
    <div className="bg-ds-surface border border-ds-border rounded-xl px-5 py-3.5 flex items-center gap-4 hover:bg-ds-elevated/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm">{item.name}</span>
          {badge}
        </div>
        {item.description && (
          <div className="text-gray-500 text-xs mt-0.5 truncate">{item.description}</div>
        )}
      </div>
      <div className="text-sm font-semibold text-white shrink-0">{priceLabel}</div>
      {(onEdit || onDelete) && (
        <div className="flex gap-3 shrink-0">
          {onEdit && (
            <button onClick={onEdit} className="text-xs text-gray-400 hover:text-indigo-400 font-medium transition-colors">
              Modifier
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
