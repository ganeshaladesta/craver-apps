"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, FolderPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCraver } from "@/components/providers/CraverProviders";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Collection, Restaurant } from "@/types/database";

interface SaveToCollectionModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
}

export function SaveToCollectionModal({
  restaurant,
  onClose,
}: SaveToCollectionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const { user, configured, showToast } = useCraver();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (restaurant && !dialog.open) {
      dialog.returnValue = "";
      dialog.showModal();
    } else if (!restaurant && dialog.open) {
      dialog.close();
    }
  }, [restaurant]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  useEffect(() => {
    if (!restaurant || !user || !configured) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("collection_items")
        .select("collection_id")
        .eq("restaurant_id", restaurant.id),
    ]).then(([colsRes, itemsRes]) => {
      if (cancelled) return;
      setCollections((colsRes.data ?? []) as Collection[]);
      setMemberIds(
        new Set(
          (itemsRes.data ?? []).map((row: { collection_id: string }) => row.collection_id)
        )
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [configured, restaurant, user]);

  const toggleCollection = async (collectionId: string) => {
    if (!restaurant || !user) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const exists = memberIds.has(collectionId);
    if (exists) {
      const { error } = await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", collectionId)
        .eq("restaurant_id", restaurant.id);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      setMemberIds((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
      showToast("Removed from collection.", "info");
    } else {
      const { error } = await supabase.from("collection_items").insert({
        collection_id: collectionId,
        restaurant_id: restaurant.id,
      });
      if (error) {
        showToast(error.message, "error");
        return;
      }
      setMemberIds((prev) => new Set(prev).add(collectionId));
      showToast("Added to collection.", "success");
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !user || !newTitle.trim()) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setCreating(true);
    const title = newTitle.trim();
    const slug = `${slugify(title) || "collection"}-${Date.now().toString().slice(-5)}`;
    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        title,
        slug,
        description: "Personal Jakarta restaurant shortlist",
        is_public: true,
        cover_image_url: restaurant.cover_image_url,
      })
      .select("*")
      .single();

    if (error || !data) {
      showToast(error?.message || "Could not create collection.", "error");
      setCreating(false);
      return;
    }

    const { error: linkError } = await supabase.from("collection_items").insert({
      collection_id: data.id,
      restaurant_id: restaurant.id,
    });

    if (linkError) {
      showToast(linkError.message, "error");
    } else {
      setCollections((prev) => [data as Collection, ...prev]);
      setMemberIds((prev) => new Set(prev).add(data.id));
      setNewTitle("");
      showToast(`Created "${title}" and saved ${restaurant.name}.`, "success");
    }
    setCreating(false);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: "any" } as Record<string, string>)}
      className="w-full"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-display text-lg font-bold text-[#1C1C1C]">
              Save to Collection
            </h2>
            {restaurant && (
              <p className="mt-0.5 text-xs text-[#696969]">
                {restaurant.name} · {restaurant.district}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close save dialog"
            className="rounded-lg p-1.5 text-[#696969] hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {!configured ? (
          <p className="mt-5 rounded-xl bg-[#FAFAFA] p-4 text-sm text-[#696969]">
            Connect Supabase in <code className="font-mono">.env.local</code> to create
            and manage personal collections.
          </p>
        ) : !user ? (
          <div className="mt-5 rounded-xl bg-[#FAFAFA] p-5 text-center">
            <p className="text-sm text-[#696969]">
              Sign in to curate personal dining lists and share collections.
            </p>
            <button
              type="button"
              onClick={() => {
                dialogRef.current?.close();
                router.push("/auth/login");
              }}
              className="mt-3 rounded-lg bg-[#E23744] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C91D2B]"
            >
              Sign In to Continue
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {loading ? (
              <p className="text-sm text-[#696969]">Loading your collections...</p>
            ) : collections.length === 0 ? (
              <p className="rounded-lg bg-[#FAFAFA] p-3 text-sm text-[#696969]">
                You do not have any collections yet. Create your first shortlist below.
              </p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {collections.map((col) => {
                  const checked = memberIds.has(col.id);
                  return (
                    <li key={col.id}>
                      <button
                        type="button"
                        onClick={() => void toggleCollection(col.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-[#E8E8E8] px-3.5 py-2.5 text-left transition hover:border-[#E23744]/50"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1C1C1C]">
                            {col.title}
                          </p>
                          <p className="text-xs text-[#696969]">
                            {col.is_public ? "Public" : "Private"} list
                          </p>
                        </div>
                        <span
                          className={
                            checked
                              ? "flex h-6 w-6 items-center justify-center rounded-full bg-[#E23744] text-white"
                              : "h-6 w-6 rounded-full border border-[#E8E8E8]"
                          }
                        >
                          {checked && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <form
              onSubmit={handleCreateCollection}
              className="border-t border-[#E8E8E8] pt-4"
            >
              <label
                htmlFor="new-collection-name"
                className="block text-xs font-semibold text-[#1C1C1C]"
              >
                Or create a new collection
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="new-collection-name"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Weekend Date Night Spots"
                  minLength={2}
                  maxLength={100}
                  required
                  className="min-h-11 flex-1 rounded-lg border border-[#E8E8E8] px-3 text-sm text-[#1C1C1C] focus:border-[#E23744] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
                >
                  <FolderPlus className="h-4 w-4" aria-hidden="true" />
                  <span>{creating ? "Creating..." : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </dialog>
  );
}

