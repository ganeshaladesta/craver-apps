"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, FolderPlus, Globe, Lock, Trash2 } from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { collectionSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";
import type { Collection } from "@/types/database";

interface CollectionsClientProps {
  configured: boolean;
  curatedCollections: Collection[];
  initialUserCollections: Collection[];
}

export function CollectionsClient({
  configured,
  curatedCollections,
  initialUserCollections,
}: CollectionsClientProps) {
  const { user, showToast } = useCraver();
  const [userCollections, setUserCollections] = useState<Collection[]>(
    initialUserCollections
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setIsPublic(true);
    setShowForm(true);
  };

  const openEdit = (col: Collection) => {
    setEditing(col);
    setTitle(col.title);
    setDescription(col.description);
    setIsPublic(col.is_public);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = collectionSchema.safeParse({
      title,
      description,
      is_public: isPublic,
      cover_image_url: editing?.cover_image_url || null,
    });
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Check fields.", "error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);

    if (editing) {
      const { data, error } = await supabase
        .from("collections")
        .update({
          title: parsed.data.title,
          description: parsed.data.description,
          is_public: parsed.data.is_public,
        })
        .eq("id", editing.id)
        .select("*, collection_items(id)")
        .single();

      if (error || !data) {
        showToast(error?.message || "Update failed.", "error");
      } else {
        setUserCollections((prev) =>
          prev.map((c) => (c.id === editing.id ? (data as Collection) : c))
        );
        setShowForm(false);
        setEditing(null);
        showToast("Collection updated.", "success");
      }
    } else {
      const slug = `${slugify(parsed.data.title) || "list"}-${Date.now().toString().slice(-5)}`;
      const { data, error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          title: parsed.data.title,
          slug,
          description: parsed.data.description,
          is_public: parsed.data.is_public,
          cover_image_url: "/images/rest-indonesian-senopati.jpg",
        })
        .select("*, collection_items(id)")
        .single();

      if (error || !data) {
        showToast(error?.message || "Could not create collection.", "error");
      } else {
        setUserCollections((prev) => [data as Collection, ...prev]);
        setShowForm(false);
        showToast(`Created "${parsed.data.title}".`, "success");
      }
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setDeleteBusy(true);
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleteBusy(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setUserCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast("Collection deleted.", "info");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
            Food Guides &amp; Shortlists
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
            Curated Collections
          </h1>
          <p className="mt-2 text-sm text-[#696969]">
            Save neighborhood shortlists, date-night guides, and ramen trails across Jakarta.
          </p>
        </div>

        {configured && user && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E23744] px-5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
          >
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
            <span>New Collection</span>
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-[#E23744]/30 bg-[#FFF0F1]/30 p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
            {editing ? `Edit "${editing.title}"` : "Create Dining Collection"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="col-title" className="block text-xs font-semibold">
                Title *
              </label>
              <input
                id="col-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
                placeholder="e.g. Best Sunday Brunch in South Jakarta"
                className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="accent-[#E23744]"
                />
                <span>Make collection publicly shareable</span>
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="col-desc" className="block text-xs font-semibold">
              Description
            </label>
            <textarea
              id="col-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell diners what connects these spots..."
              className="mt-1 w-full rounded-lg border border-[#E8E8E8] bg-white p-3 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[#E8E8E8] bg-white px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#E23744] px-5 py-2 text-xs font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Collection"}
            </button>
          </div>
        </form>
      )}

      {/* Personal Collections */}
      {configured && user && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#1C1C1C]">
            Your Saved Lists
          </h2>
          {userCollections.length === 0 ? (
            <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-8 text-sm text-[#696969]">
              You have not created any personal lists yet. Click &ldquo;New Collection&rdquo; or use
              &ldquo;Add to List&rdquo; on any restaurant page.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {userCollections.map((col) => (
                <article
                  key={col.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#E8E8E8] bg-white p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#696969]">
                      <span className="inline-flex items-center gap-1 font-medium">
                        {col.is_public ? (
                          <Globe className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {col.is_public ? "Public" : "Private"}
                      </span>
                      <span>{col.collection_items?.length ?? 0} spots</span>
                    </div>
                    <Link
                      href={`/collections/${col.slug}`}
                      className="mt-2 block font-display text-lg font-bold text-[#1C1C1C] hover:text-[#E23744]"
                    >
                      {col.title}
                    </Link>
                    <p className="mt-1 text-xs text-[#696969] line-clamp-2">
                      {col.description || "Custom CRAVER shortlist"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#E8E8E8] pt-3">
                    <Link
                      href={`/collections/${col.slug}`}
                      className="text-xs font-semibold text-[#E23744] hover:underline"
                    >
                      Open list →
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(col)}
                        aria-label={`Edit ${col.title}`}
                        className="rounded p-1 text-[#696969] hover:text-[#1C1C1C]"
                      >
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(col)}
                        aria-label={`Delete ${col.title}`}
                        className="rounded p-1 text-[#696969] hover:text-[#C91D2B]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Editorial & Community Public Collections */}
      <section className="space-y-5">
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">
          Community &amp; Editorial Trails
        </h2>
        {!configured ? (
          <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center text-sm text-[#696969]">
            Connect Supabase and apply <code className="font-mono">supabase/seed.sql</code> to
            explore curated Jakarta trails.
          </div>
        ) : curatedCollections.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center text-sm text-[#696969]">
            No public collections published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {curatedCollections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#1C1C1C] aspect-[16/10]"
              >
                <img
                  src={col.cover_image_url || "/images/rest-indonesian-senopati.jpg"}
                  alt={col.title}
                  className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="rounded-full bg-[#E23744] px-2.5 py-0.5 text-[10px] font-bold uppercase">
                    {col.is_curated ? "Curated" : "Community"} ·{" "}
                    {col.collection_items?.length ?? 0} spots
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold">{col.title}</h3>
                  <p className="mt-1 text-xs text-white/85 line-clamp-2">
                    {col.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Delete "${deleteTarget.title}"?` : "Delete collection"}
        description="Your shortlist items inside this collection will be removed."
        confirmLabel="Delete"
        destructive
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

