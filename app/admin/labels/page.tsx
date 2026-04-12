"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Save, X, Tag, ImageIcon } from "lucide-react";
import Image from "next/image";
import { labels as initial } from "@/lib/data";
import type { Label } from "@/lib/data";

const PRESET_COLORS = [
  "#ef4444","#f97316","#f59e0b","#22c55e","#14b8a6",
  "#3b82f6","#8b5cf6","#ec4899","#06b6d4","#10b981",
];

export default function AdminLabelsPage() {
  const [lbls, setLbls] = useState<Label[]>(initial);
  const [editing, setEditing] = useState<Partial<Label> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const startNew = () => {
    setEditing({ id: String(Date.now()), slug: "", name: "", color: "#f59e0b", count: 0, heroImage: "" });
    setIsNew(true);
  };

  const save = () => {
    if (!editing || !editing.name) return;
    const slug = editing.slug || editing.name.toLowerCase().replace(/\s+/g, "-");
    const full: Label = { id: editing.id!, slug, name: editing.name, color: editing.color ?? "#f59e0b", count: editing.count ?? 0, heroImage: editing.heroImage ?? "" };
    if (isNew) {
      setLbls((prev) => [...prev, full]);
    } else {
      setLbls((prev) => prev.map((l) => (l.id === full.id ? full : l)));
    }
    setEditing(null);
    setIsNew(false);
  };

  const del = (id: string) => setLbls((prev) => prev.filter((l) => l.id !== id));

  const set = (field: keyof Label, value: string | number) =>
    setEditing((prev) => prev ? { ...prev, [field]: value } : prev);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Labels</h1>
          <p className="text-muted-foreground mt-1">{lbls.length} labels defined</p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gold)] text-stone-900 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Label
        </button>
      </div>

      {/* Form */}
      {editing && (
        <div className="rounded-2xl border-2 border-[var(--gold)] bg-card p-6 space-y-4">
          <h2 className="font-semibold">{isNew ? "New Label" : "Edit Label"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1" htmlFor="lbl-name">Label Name</label>
              <input
                id="lbl-name"
                type="text"
                value={editing.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Label name"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1" htmlFor="lbl-slug">Slug</label>
              <input
                id="lbl-slug"
                type="text"
                value={editing.slug ?? ""}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="auto-generated"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1" htmlFor="lbl-hero">Hero Image URL</label>
            <input
              id="lbl-hero"
              type="url"
              value={editing.heroImage ?? ""}
              onChange={(e) => set("heroImage", e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            />
            {editing.heroImage && (
              <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden border border-border">
                <Image src={editing.heroImage} alt="Hero preview" fill className="object-cover" sizes="600px" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Label Color</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className="w-7 h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: editing.color === c ? "var(--gold)" : "transparent",
                  }}
                  aria-label={`Select color ${c}`}
                />
              ))}
              <input
                type="color"
                value={editing.color ?? "#f59e0b"}
                onChange={(e) => set("color", e.target.value)}
                className="w-7 h-7 rounded-full border border-border cursor-pointer"
                aria-label="Custom color picker"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={save} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] text-stone-900 text-sm font-semibold hover:opacity-90 cursor-pointer">
              <Save className="w-3.5 h-3.5" aria-hidden="true" /> Save
            </button>
            <button type="button" onClick={() => { setEditing(null); setIsNew(false); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted cursor-pointer">
              <X className="w-3.5 h-3.5" aria-hidden="true" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-semibold text-sm">All Labels</h2>
        </div>
        <div className="divide-y divide-border">
          {lbls.map((lbl) => (
            <div key={lbl.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              {lbl.heroImage ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative border border-border">
                  <Image src={lbl.heroImage} alt={lbl.name} fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center border border-border"
                  style={{ backgroundColor: lbl.color + "20" }}
                >
                  <ImageIcon className="w-4 h-4" style={{ color: lbl.color }} aria-hidden="true" />
                </div>
              )}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: lbl.color + "25", color: lbl.color }}
                >
                  {lbl.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">/{lbl.slug}</span>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">{lbl.count} uses</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => { setEditing(lbl); setIsNew(false); }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-[var(--gold)]"
                  aria-label={`Edit ${lbl.name}`}
                >
                  <Edit className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => del(lbl.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer text-muted-foreground hover:text-red-600"
                  aria-label={`Delete ${lbl.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
