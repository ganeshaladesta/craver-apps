"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bookmark,
  Camera,
  Check,
  Clock,
  Edit3,
  Flag,
  FolderPlus,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SaveToCollectionModal } from "@/components/restaurants/SaveToCollectionModal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { removeImageFromSupabase, uploadImageToSupabase } from "@/lib/supabase/storage";
import {
  menuCategorySchema,
  menuItemSchema,
  restaurantUpdateSchema,
  reviewSchema,
} from "@/lib/validation/schemas";
import { cn, formatDate, formatIdr, MENU_CATEGORY_PRESETS } from "@/lib/utils";
import type {
  MenuCategory,
  MenuItem,
  Photo,
  Restaurant,
  RestaurantUpdate,
  Review,
} from "@/types/database";

type TabKey = "overview" | "menu" | "reviews" | "photos" | "updates";

interface RestaurantDetailClientProps {
  restaurant: Restaurant;
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
  initialReviews: Review[];
  initialPhotos: Photo[];
  initialUpdates: RestaurantUpdate[];
  initialTab?: string;
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "menu", label: "Menu" },
  { key: "reviews", label: "Reviews" },
  { key: "photos", label: "Photos" },
  { key: "updates", label: "Updates" },
];

export function RestaurantDetailClient({
  restaurant,
  initialCategories,
  initialItems,
  initialReviews,
  initialPhotos,
  initialUpdates,
  initialTab = "overview",
}: RestaurantDetailClientProps) {
  const router = useRouter();
  const { user, profile, favoriteIds, toggleFavorite, showToast } = useCraver();
  const isAdmin = profile?.role === "admin";
  const isSaved = favoriteIds.includes(restaurant.id);

  const normalizedTab: TabKey = TABS.some((t) => t.key === initialTab)
    ? (initialTab as TabKey)
    : "overview";
  const [activeTab, setActiveTab] = useState<TabKey>(normalizedTab);

  // Live synced entities
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [updates, setUpdates] = useState<RestaurantUpdate[]>(initialUpdates);

  // Shared modals
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const reportDialogRef = useRef<HTMLDialogElement>(null);
  const [reportTarget, setReportTarget] = useState<{
    type: "restaurant" | "review" | "photo" | "menu_item";
    id: string;
    label: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("Inaccurate information");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Tabs DOM refs for beforematch & keyboard scrollIntoView
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = panelsContainerRef.current;
    if (!container) return;
    const onBeforeMatch = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const panel = target?.closest('[role="tabpanel"]') as HTMLElement | null;
      const key = panel?.dataset.tabKey as TabKey | undefined;
      if (key && TABS.some((t) => t.key === key)) {
        setActiveTab(key);
      }
    };
    container.addEventListener("beforematch", onBeforeMatch);
    return () => container.removeEventListener("beforematch", onBeforeMatch);
  }, []);

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    tabRefs.current[key]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  };

  // Menu state
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>("all");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("Best Sellers");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [showDishForm, setShowDishForm] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishCategoryId, setDishCategoryId] = useState<string>(
    initialCategories[0]?.id ?? ""
  );
  const [dishName, setDishName] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [dishPrice, setDishPrice] = useState("85000");
  const [dishPopular, setDishPopular] = useState(false);
  const [dishAvailable, setDishAvailable] = useState(true);
  const [dishPhotoUrl, setDishPhotoUrl] = useState("");
  const [dishBusy, setDishBusy] = useState(false);

  // Reviews state (enforces 1 review per user per restaurant)
  const existingUserReview = useMemo(
    () => (user ? reviews.find((r) => r.user_id === user.id) ?? null : null),
    [reviews, user]
  );
  const [reviewRating, setReviewRating] = useState<number>(
    existingUserReview?.rating ?? 5
  );
  const [reviewTitle, setReviewTitle] = useState(existingUserReview?.title ?? "");
  const [reviewComment, setReviewComment] = useState(
    existingUserReview?.comment ?? ""
  );
  const [reviewVisitDate, setReviewVisitDate] = useState(
    existingUserReview?.visit_date ?? ""
  );
  const [reviewPhotos, setReviewPhotos] = useState<string[]>(
    existingUserReview?.photo_urls ?? []
  );
  const [reviewBusy, setReviewBusy] = useState(false);
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);

  useEffect(() => {
    if (existingUserReview) {
      setReviewRating(existingUserReview.rating);
      setReviewTitle(existingUserReview.title || "");
      setReviewComment(existingUserReview.comment);
      setReviewVisitDate(existingUserReview.visit_date || "");
      setReviewPhotos(existingUserReview.photo_urls || []);
    }
  }, [existingUserReview]);

  // Photos upload state
  const [photoType, setPhotoType] = useState<"food" | "gallery" | "menu">("food");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  // Updates form state
  const [updateType, setUpdateType] = useState<
    "info_correction" | "hours" | "menu_update" | "announcement" | "closure_report"
  >("info_correction");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateBusy, setUpdateBusy] = useState(false);

  // Sync lightboxes & report modals
  useEffect(() => {
    const dlg = lightboxRef.current;
    if (!dlg) return;
    if (lightboxPhoto && !dlg.open) {
      dlg.returnValue = "";
      dlg.showModal();
    } else if (!lightboxPhoto && dlg.open) {
      dlg.close();
    }
  }, [lightboxPhoto]);

  useEffect(() => {
    const dlg = lightboxRef.current;
    if (!dlg) return;
    const onClose = () => {
      dlg.returnValue = "";
      setLightboxPhoto(null);
    };
    dlg.addEventListener("close", onClose);
    return () => dlg.removeEventListener("close", onClose);
  }, []);

  useEffect(() => {
    const dlg = reportDialogRef.current;
    if (!dlg) return;
    if (reportTarget && !dlg.open) {
      dlg.returnValue = "";
      dlg.showModal();
    } else if (!reportTarget && dlg.open) {
      dlg.close();
    }
  }, [reportTarget]);

  useEffect(() => {
    const dlg = reportDialogRef.current;
    if (!dlg) return;
    const onClose = () => {
      dlg.returnValue = "";
      setReportTarget(null);
    };
    dlg.addEventListener("close", onClose);
    return () => dlg.removeEventListener("close", onClose);
  }, []);

  // Rating breakdown metrics computed from published reviews
  const publishedReviews = useMemo(
    () => reviews.filter((r) => r.status === "published" || r.user_id === user?.id),
    [reviews, user]
  );

  const ratingSummary = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    for (const r of publishedReviews) {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating] += 1;
    }
    const localCount = publishedReviews.length;
    const localAvg =
      localCount > 0
        ? publishedReviews.reduce((acc, r) => acc + r.rating, 0) / localCount
        : Number(restaurant.rating_avg || 0);
    const totalShown = Math.max(localCount, restaurant.reviews_count || 0);
    return { counts, localAvg, localCount, totalShown };
  }, [publishedReviews, restaurant.rating_avg, restaurant.reviews_count]);

  const sortedCategories = useMemo(() => {
    const order = new Map<string, number>(
      MENU_CATEGORY_PRESETS.map((n, idx) => [n.toLowerCase(), idx])
    );
    return [...categories].sort((a, b) => {
      const idxA = order.get(a.name.toLowerCase()) ?? 99;
      const idxB = order.get(b.name.toLowerCase()) ?? 99;
      if (idxA !== idxB) return idxA - idxB;
      return a.sort_order - b.sort_order;
    });
  }, [categories]);

  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>();
    for (const item of items) {
      const arr = grouped.get(item.category_id) ?? [];
      arr.push(item);
      grouped.set(item.category_id, arr);
    }
    return grouped;
  }, [items]);

  const galleryPhotos = useMemo(() => {
    const urls = new Set(photos.map((p) => p.url));
    const list = [...photos];
    if (restaurant.cover_image_url && !urls.has(restaurant.cover_image_url)) {
      list.unshift({
        id: "cover-hero",
        restaurant_id: restaurant.id,
        menu_item_id: null,
        review_id: null,
        user_id: restaurant.created_by,
        url: restaurant.cover_image_url,
        storage_path: null,
        caption: `${restaurant.name} Dining Room`,
        photo_type: "cover",
        status: "approved",
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at,
      });
    }
    return list;
  }, [photos, restaurant]);

  const requireSignedIn = (actionText: string): boolean => {
    if (!user) {
      showToast(`Sign in to ${actionText}.`, "info");
      router.push(
        `/auth/login?next=${encodeURIComponent(`/restaurants/${restaurant.slug}`)}`
      );
      return false;
    }
    return true;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurant.name} on CRAVER`,
          text: restaurant.tagline || restaurant.description,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Restaurant link copied to clipboard.", "success");
    } catch {
      showToast("Copy the URL from your browser address bar.", "info");
    }
  };

  // Menu Category Create
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSignedIn("add menu categories")) return;

    const existing = categories.find(
      (c) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (existing) {
      setDishCategoryId(existing.id);
      setShowAddCategory(false);
      showToast(`Selected existing "${existing.name}" category.`, "info");
      return;
    }

    const parsed = menuCategorySchema.safeParse({
      restaurant_id: restaurant.id,
      name: newCategoryName,
      description: newCategoryDesc,
      sort_order: categories.length + 1,
    });
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Invalid category.", "error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const status = isAdmin ? "approved" : "pending";
    const { data, error } = await supabase
      .from("menu_categories")
      .insert({
        ...parsed.data,
        status,
        created_by: user!.id,
      })
      .select("*")
      .single();

    if (error || !data) {
      showToast(error?.message || "Failed to add category.", "error");
      return;
    }

    const created = data as MenuCategory;
    setCategories((prev) => [...prev, created]);
    setDishCategoryId(created.id);
    setNewCategoryDesc("");
    setShowAddCategory(false);
    showToast(
      isAdmin
        ? `Added category "${created.name}".`
        : `Category "${created.name}" submitted for moderation.`,
      "success"
    );
  };

  // Menu Dish Add / Update
  const openAddDish = (presetCategoryId?: string) => {
    if (!requireSignedIn("submit a dish")) return;
    setEditingDish(null);
    setDishCategoryId(presetCategoryId || sortedCategories[0]?.id || "");
    setDishName("");
    setDishDescription("");
    setDishPrice("85000");
    setDishPopular(false);
    setDishAvailable(true);
    setDishPhotoUrl("");
    setShowDishForm(true);
  };

  const openEditDish = (item: MenuItem) => {
    setEditingDish(item);
    setDishCategoryId(item.category_id);
    setDishName(item.name);
    setDishDescription(item.description);
    setDishPrice(String(item.price_idr));
    setDishPopular(item.is_popular);
    setDishAvailable(item.is_available);
    setDishPhotoUrl(item.photo_url || "");
    setShowDishForm(true);
  };

  const handleDishImageUpload = async (file: File | undefined) => {
    if (!file || !user) return;
    try {
      setDishBusy(true);
      const uploaded = await uploadImageToSupabase({
        file,
        bucket: "food-photos",
        userId: user.id,
        folder: `dishes/${restaurant.id}`,
      });
      setDishPhotoUrl(uploaded.publicUrl);
      showToast("Dish photo uploaded.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setDishBusy(false);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSignedIn("save dishes")) return;

    const targetCatId = dishCategoryId || categories[0]?.id;
    if (!targetCatId) {
      showToast("Create or select a menu category first.", "error");
      return;
    }

    const parsed = menuItemSchema.safeParse({
      restaurant_id: restaurant.id,
      category_id: targetCatId,
      name: dishName,
      description: dishDescription,
      price_idr: Number(dishPrice),
      photo_url: dishPhotoUrl || null,
      is_available: dishAvailable,
      is_popular: dishPopular,
      is_featured_dish: false,
      dietary_tags: [],
    });

    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Check dish details.", "error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setDishBusy(true);
    const nextStatus = isAdmin ? "approved" : "pending";

    if (editingDish) {
      const { data, error } = await supabase
        .from("menu_items")
        .update({
          category_id: parsed.data.category_id,
          name: parsed.data.name,
          description: parsed.data.description,
          price_idr: parsed.data.price_idr,
          photo_url: parsed.data.photo_url,
          is_available: parsed.data.is_available,
          is_popular: parsed.data.is_popular,
          status: isAdmin ? editingDish.status : "pending",
        })
        .eq("id", editingDish.id)
        .select("*")
        .single();

      if (error || !data) {
        showToast(error?.message || "Failed to update dish.", "error");
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === editingDish.id ? (data as MenuItem) : i))
        );
        setShowDishForm(false);
        setEditingDish(null);
        showToast("Dish updated.", "success");
      }
    } else {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          ...parsed.data,
          sort_order: items.length + 1,
          status: nextStatus,
          created_by: user!.id,
        })
        .select("*")
        .single();

      if (error || !data) {
        showToast(error?.message || "Failed to add dish.", "error");
      } else {
        setItems((prev) => [...prev, data as MenuItem]);
        setShowDishForm(false);
        showToast(
          isAdmin
            ? `Added "${parsed.data.name}" to menu.`
            : `Submitted "${parsed.data.name}" for review.`,
          "success"
        );
      }
    }
    setDishBusy(false);
  };

  const requestDeleteDish = (item: MenuItem) => {
    setConfirmState({
      title: `Delete "${item.name}"?`,
      description: "This menu item will be permanently removed from CRAVER.",
      onConfirm: async () => {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", item.id);
        if (error) {
          showToast(error.message, "error");
          return;
        }
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        showToast(`Deleted "${item.name}".`, "info");
      },
    });
  };

  // Review Upload & Save (Create or Update single review)
  const handleReviewPhotoUpload = async (file: File | undefined) => {
    if (!file || !requireSignedIn("upload review photos")) return;
    if (reviewPhotos.length >= 4) {
      showToast("Maximum 4 photos per review.", "info");
      return;
    }
    try {
      setUploadingReviewPhoto(true);
      const uploaded = await uploadImageToSupabase({
        file,
        bucket: "food-photos",
        userId: user!.id,
        folder: `reviews/${restaurant.id}`,
      });
      setReviewPhotos((prev) => [...prev, uploaded.publicUrl]);
      showToast("Review photo attached.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setUploadingReviewPhoto(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSignedIn("publish a review")) return;

    const parsed = reviewSchema.safeParse({
      restaurant_id: restaurant.id,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      visit_date: reviewVisitDate || null,
      photo_urls: reviewPhotos,
    });

    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Check review details.", "error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setReviewBusy(true);

    if (existingUserReview) {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          rating: parsed.data.rating,
          title: parsed.data.title,
          comment: parsed.data.comment,
          visit_date: parsed.data.visit_date,
          photo_urls: parsed.data.photo_urls,
        })
        .eq("id", existingUserReview.id)
        .select("*, profile:profiles(id, full_name, username, avatar_url)")
        .single();

      if (error || !data) {
        showToast(error?.message || "Could not update review.", "error");
      } else {
        setReviews((prev) =>
          prev.map((r) => (r.id === existingUserReview.id ? (data as Review) : r))
        );
        showToast("Your review was updated.", "success");
      }
    } else {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          ...parsed.data,
          user_id: user!.id,
          status: "published",
        })
        .select("*, profile:profiles(id, full_name, username, avatar_url)")
        .single();

      if (error || !data) {
        showToast(error?.message || "Could not submit review.", "error");
      } else {
        setReviews((prev) => [data as Review, ...prev]);
        showToast("Thank you for sharing your dining experience!", "success");
      }
    }

    setReviewBusy(false);
  };

  const requestDeleteReview = (review: Review) => {
    setConfirmState({
      title: "Delete your review?",
      description:
        "This permanently removes your rating, written review, and attached review photos.",
      onConfirm: async () => {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        const { error } = await supabase
          .from("reviews")
          .delete()
          .eq("id", review.id);
        if (error) {
          showToast(error.message, "error");
          return;
        }
        setReviews((prev) => prev.filter((r) => r.id !== review.id));
        setReviewRating(5);
        setReviewTitle("");
        setReviewComment("");
        setReviewVisitDate("");
        setReviewPhotos([]);
        showToast("Review deleted.", "info");
      },
    });
  };

  // Photos Gallery Upload / Delete
  const handleUploadGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !requireSignedIn("upload photos")) return;

    try {
      setPhotoUploading(true);
      const bucket = photoType === "gallery" ? "restaurant-photos" : "food-photos";
      const uploaded = await uploadImageToSupabase({
        file,
        bucket,
        userId: user!.id,
        folder: restaurant.id,
      });

      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from("photos")
        .insert({
          restaurant_id: restaurant.id,
          user_id: user!.id,
          url: uploaded.publicUrl,
          storage_path: uploaded.storagePath,
          caption: photoCaption.trim() || `${restaurant.name} photo`,
          photo_type: photoType,
          status: "approved",
        })
        .select("*, profile:profiles(id, full_name, avatar_url)")
        .single();

      if (error || !data) {
        showToast(error?.message || "Could not save photo record.", "error");
      } else {
        setPhotos((prev) => [data as Photo, ...prev]);
        setPhotoCaption("");
        showToast("Photo added to gallery.", "success");
      }
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setPhotoUploading(false);
    }
  };

  const requestDeletePhoto = (photo: Photo) => {
    setConfirmState({
      title: "Delete this photo?",
      description: "The photo will be permanently deleted from the gallery.",
      onConfirm: async () => {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        const { error } = await supabase.from("photos").delete().eq("id", photo.id);
        if (error) {
          showToast(error.message, "error");
          return;
        }
        if (photo.storage_path) {
          const bucket =
            photo.photo_type === "cover" || photo.photo_type === "gallery"
              ? "restaurant-photos"
              : "food-photos";
          await removeImageFromSupabase(bucket, photo.storage_path);
        }
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        if (lightboxPhoto?.id === photo.id) setLightboxPhoto(null);
        showToast("Photo removed.", "info");
      },
    });
  };

  // Restaurant Updates Submission
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSignedIn("submit a restaurant update")) return;

    const parsed = restaurantUpdateSchema.safeParse({
      restaurant_id: restaurant.id,
      update_type: updateType,
      title: updateTitle,
      notes: updateNotes,
      payload: {},
    });

    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Check update details.", "error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setUpdateBusy(true);
    const { data, error } = await supabase
      .from("restaurant_updates")
      .insert({
        ...parsed.data,
        submitted_by: user!.id,
        status: isAdmin ? "approved" : "pending",
      })
      .select("*, submitter:profiles!restaurant_updates_submitted_by_fkey(id, full_name, email)")
      .single();

    if (error || !data) {
      showToast(error?.message || "Failed to submit update.", "error");
    } else {
      setUpdates((prev) => [data as RestaurantUpdate, ...prev]);
      setUpdateTitle("");
      setUpdateNotes("");
      showToast(
        isAdmin
          ? "Announcement published."
          : "Update submitted for moderator approval.",
        "success"
      );
    }
    setUpdateBusy(false);
  };

  // Report submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget || !requireSignedIn("report content")) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setReportBusy(true);
    const { error } = await supabase.from("content_reports").insert({
      reporter_id: user!.id,
      target_type: reportTarget.type,
      target_id: reportTarget.id,
      reason: reportReason,
      details: reportDetails.trim(),
      status: "open",
    });
    setReportBusy(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }
    setReportDetails("");
    setReportTarget(null);
    showToast("Thank you. Moderators will review this report.", "success");
  };

  const reportTitleId = useId();
  const lightboxTitleId = useId();

  return (
    <div className="bg-white">
      {/* Restaurant Moderation Notice for owner/admin when not approved */}
      {restaurant.status !== "approved" && (
        <div className="border-b border-[#E8E8E8] bg-[#FFF0F1] px-4 py-3 text-sm text-[#1C1C1C]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              Status:{" "}
              <span className="font-bold uppercase text-[#C91D2B]">
                {restaurant.status}
              </span>
              {restaurant.rejection_reason && ` — ${restaurant.rejection_reason}`}
            </p>
            <Link
              href={`/contribute?edit=${restaurant.id}`}
              className="font-semibold text-[#E23744] underline"
            >
              Edit Submission
            </Link>
          </div>
        </div>
      )}

      {/* Cover Image Gallery Banner */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <button
            type="button"
            onClick={() => galleryPhotos[0] && setLightboxPhoto(galleryPhotos[0])}
            className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] md:col-span-7 md:aspect-[16/9]"
          >
            <img
              src={
                restaurant.cover_image_url ||
                galleryPhotos[0]?.url ||
                "/images/rest-indonesian-senopati.jpg"
              }
              alt={restaurant.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          </button>

          <div className="grid grid-cols-2 gap-3 md:col-span-5">
            {galleryPhotos.slice(1, 5).map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxPhoto(photo)}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA]"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `${restaurant.name} photo ${idx + 2}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                />
                {idx === 3 && galleryPhotos.length > 5 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white">
                    +{galleryPhotos.length - 5} Photos
                  </span>
                )}
              </button>
            ))}
            {galleryPhotos.length <= 1 && (
              <button
                type="button"
                onClick={() => selectTab("photos")}
                className="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-6 text-center text-sm text-[#696969] hover:border-[#E23744] hover:text-[#E23744]"
              >
                <Camera className="h-6 w-6" aria-hidden="true" />
                <span className="mt-2 font-semibold">Add Food &amp; Dining Photos</span>
              </button>
            )}
          </div>
        </div>

        {/* Restaurant Header Identity */}
        <div className="mt-6 flex flex-col justify-between gap-6 border-b border-[#E8E8E8] pb-6 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {restaurant.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F1] px-2.5 py-1 text-xs font-semibold text-[#C91D2B]">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified Spot
                </span>
              )}
              {restaurant.cuisines.map((c) => (
                <Link
                  key={c}
                  href={`/explore?category=${encodeURIComponent(c)}`}
                  className="rounded-full border border-[#E8E8E8] bg-[#FAFAFA] px-2.5 py-1 text-xs font-medium text-[#696969] hover:border-[#E23744] hover:text-[#E23744]"
                >
                  {c}
                </Link>
              ))}
            </div>

            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
              {restaurant.name}
            </h1>
            {restaurant.tagline && (
              <p className="mt-1 text-base font-medium text-[#696969]">
                {restaurant.tagline}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#696969]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#E23744]" aria-hidden="true" />
                <span>
                  {restaurant.district}, {restaurant.city}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#E23744]" aria-hidden="true" />
                <span>{restaurant.opening_hours?.mon_fri || "10:00 - 22:00"}</span>
              </span>
              <span className="font-semibold text-[#1C1C1C]">
                Avg. {formatIdr(restaurant.average_price_idr)} / person
              </span>
            </div>
          </div>

          {/* Right Header Rating + CTAs */}
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <div className="flex items-center gap-3 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] px-4 py-2.5">
              <div className="inline-flex items-center gap-1 rounded-lg bg-[#E23744] px-2.5 py-1 text-base font-bold text-white">
                <span>
                  {ratingSummary.totalShown > 0
                    ? ratingSummary.localAvg.toFixed(1)
                    : "New"}
                </span>
                <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1C1C]">
                  {ratingSummary.totalShown} Dining Reviews
                </p>
                <p className="text-[11px] text-[#696969]">Community Rating</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={isSaved}
                onClick={() => void toggleFavorite(restaurant.id)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
                  isSaved
                    ? "border-[#E23744] bg-[#E23744] text-white"
                    : "border-[#E8E8E8] bg-white text-[#1C1C1C] hover:border-[#E23744] hover:text-[#E23744]"
                )}
              >
                <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} aria-hidden="true" />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={() => setCollectionModalOpen(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-4 text-sm font-semibold text-[#1C1C1C] transition hover:border-[#E23744] hover:text-[#E23744]"
              >
                <FolderPlus className="h-4 w-4" aria-hidden="true" />
                <span>Add to List</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-4 text-sm font-semibold text-[#1C1C1C] transition hover:border-[#E23744] hover:text-[#E23744]"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                <span>Share</span>
              </button>

              <button
                type="button"
                aria-label="Report incorrect restaurant details"
                onClick={() =>
                  requireSignedIn("report listing issues") &&
                  setReportTarget({
                    type: "restaurant",
                    id: restaurant.id,
                    label: restaurant.name,
                  })
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#696969] hover:border-[#E23744] hover:text-[#E23744]"
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Restaurant sections"
          className="craver-tablist mt-2"
        >
          {TABS.map((tab, idx) => {
            const selected = activeTab === tab.key;
            const countSuffix =
              tab.key === "menu" && items.length > 0
                ? ` (${items.length})`
                : tab.key === "reviews" && publishedReviews.length > 0
                  ? ` (${publishedReviews.length})`
                  : tab.key === "photos" && galleryPhotos.length > 0
                    ? ` (${galleryPhotos.length})`
                    : "";

            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[tab.key] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(tab.key)}
                onKeyDown={(e) => {
                  let targetIdx = idx;
                  if (e.key === "ArrowRight") targetIdx = (idx + 1) % TABS.length;
                  else if (e.key === "ArrowLeft")
                    targetIdx = (idx - 1 + TABS.length) % TABS.length;
                  else if (e.key === "Home") targetIdx = 0;
                  else if (e.key === "End") targetIdx = TABS.length - 1;
                  else return;
                  e.preventDefault();
                  const nextKey = TABS[targetIdx].key;
                  selectTab(nextKey);
                  tabRefs.current[nextKey]?.focus();
                }}
                className="text-sm whitespace-nowrap"
              >
                {tab.label}
                {countSuffix}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab Panels */}
      <div
        ref={panelsContainerRef}
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        {/* TAB 1: OVERVIEW */}
        <div
          role="tabpanel"
          data-tab-key="overview"
          aria-labelledby="tab-overview"
          tabIndex={activeTab === "overview" ? 0 : undefined}
          {...(activeTab !== "overview"
            ? ({ hidden: "until-found" } as Record<string, unknown>)
            : {})}
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <div>
                <h2 className="font-display text-xl font-bold text-[#1C1C1C]">
                  About {restaurant.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#1C1C1C] sm:text-base">
                  {restaurant.description}
                </p>
              </div>

              {/* Popular Dishes Teaser */}
              {items.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
                      Community Favorite Dishes
                    </h3>
                    <button
                      type="button"
                      onClick={() => selectTab("menu")}
                      className="text-xs font-semibold text-[#E23744] hover:underline"
                    >
                      Open full menu →
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {items
                      .filter((i) => i.is_popular || i.is_featured_dish)
                      .slice(0, 4)
                      .map((dish) => (
                        <div
                          key={dish.id}
                          className="flex items-center gap-3.5 rounded-xl border border-[#E8E8E8] p-3"
                        >
                          <img
                            src={dish.photo_url || "/images/dish-nasi-goreng.jpg"}
                            alt={dish.name}
                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-[#1C1C1C]">
                              {dish.name}
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-[#E23744]">
                              {formatIdr(dish.price_idr)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Info Card */}
            <aside className="space-y-5 lg:col-span-4">
              <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-6 space-y-4">
                <h3 className="font-display text-base font-bold text-[#1C1C1C]">
                  Location &amp; Contact
                </h3>
                <div className="space-y-3 text-sm text-[#1C1C1C]">
                  <p className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E23744]" aria-hidden="true" />
                    <span>{restaurant.address}</span>
                  </p>
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#E23744]" aria-hidden="true" />
                    <div className="space-y-0.5 text-xs sm:text-sm">
                      <p>Mon–Fri: {restaurant.opening_hours?.mon_fri || "10:00 - 22:00"}</p>
                      <p>Sat–Sun: {restaurant.opening_hours?.sat_sun || "10:00 - 23:00"}</p>
                      {restaurant.opening_hours?.notes && (
                        <p className="text-xs text-[#696969]">
                          {restaurant.opening_hours.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {restaurant.phone && (
                    <p className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 shrink-0 text-[#E23744]" aria-hidden="true" />
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="hover:text-[#E23744]"
                      >
                        {restaurant.phone}
                      </a>
                    </p>
                  )}
                  {restaurant.email && (
                    <p className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 shrink-0 text-[#E23744]" aria-hidden="true" />
                      <a
                        href={`mailto:${restaurant.email}`}
                        className="truncate hover:text-[#E23744]"
                      >
                        {restaurant.email}
                      </a>
                    </p>
                  )}
                  {restaurant.website && (
                    <p className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 shrink-0 text-[#E23744]" aria-hidden="true" />
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[#E23744] hover:underline"
                      >
                        {restaurant.website}
                      </a>
                    </p>
                  )}
                </div>

                <div className="border-t border-[#E8E8E8] pt-4">
                  <button
                    type="button"
                    onClick={() => selectTab("updates")}
                    className="w-full rounded-lg border border-[#E8E8E8] bg-white px-4 py-2 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744] hover:text-[#E23744]"
                  >
                    Suggest an Info or Hours Correction
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* TAB 2: COMPLETE DIGITAL MENU */}
        <div
          role="tabpanel"
          data-tab-key="menu"
          aria-labelledby="tab-menu"
          tabIndex={activeTab === "menu" ? 0 : undefined}
          {...(activeTab !== "menu"
            ? ({ hidden: "until-found" } as Record<string, unknown>)
            : {})}
        >
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#1C1C1C]">
                  Digital Food &amp; Beverage Menu
                </h2>
                <p className="mt-1 text-sm text-[#696969]">
                  Browse dishes organized by course or contribute missing menu items.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    requireSignedIn("add a menu category") &&
                    setShowAddCategory((v) => !v)
                  }
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E8E8E8] bg-white px-3.5 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744] hover:text-[#E23744]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Category</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAddDish()}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#E23744] px-4 text-xs font-semibold text-white hover:bg-[#C91D2B]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Dish</span>
                </button>
              </div>
            </div>

            {/* Category filter chips */}
            {sortedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMenuCategoryFilter("all")}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    menuCategoryFilter === "all"
                      ? "bg-[#1C1C1C] text-white"
                      : "border border-[#E8E8E8] bg-[#FAFAFA] text-[#696969] hover:text-[#1C1C1C]"
                  )}
                >
                  All Sections ({items.length})
                </button>
                {sortedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMenuCategoryFilter(cat.id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                      menuCategoryFilter === cat.id
                        ? "bg-[#E23744] text-white"
                        : "border border-[#E8E8E8] bg-[#FAFAFA] text-[#696969] hover:text-[#1C1C1C]"
                    )}
                  >
                    {cat.name} ({itemsByCategory.get(cat.id)?.length ?? 0})
                    {cat.status !== "approved" && ` · ${cat.status}`}
                  </button>
                ))}
              </div>
            )}

            {/* Inline Add Category Form */}
            {showAddCategory && (
              <form
                onSubmit={handleCreateCategory}
                className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-[#1C1C1C]">
                    Add Menu Category
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    aria-label="Close category form"
                  >
                    <X className="h-4 w-4 text-[#696969]" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="menu-cat-name"
                      className="block text-xs font-semibold text-[#1C1C1C]"
                    >
                      Category Name
                    </label>
                    <input
                      id="menu-cat-name"
                      list="preset-category-options"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                    />
                    <datalist id="preset-category-options">
                      {MENU_CATEGORY_PRESETS.map((preset) => (
                        <option key={preset} value={preset} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label
                      htmlFor="menu-cat-desc"
                      className="block text-xs font-semibold text-[#1C1C1C]"
                    >
                      Short Description
                    </label>
                    <input
                      id="menu-cat-desc"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      placeholder="e.g. Slow-brewed single-origin drinks"
                      className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#E23744] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C91D2B]"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            )}

            {/* Inline Add / Edit Dish Form */}
            {showDishForm && (
              <form
                onSubmit={handleSaveDish}
                className="rounded-2xl border border-[#E23744]/30 bg-[#FFF0F1]/30 p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
                    {editingDish ? `Edit "${editingDish.name}"` : "Add Menu Dish"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDishForm(false);
                      setEditingDish(null);
                    }}
                    aria-label="Close dish form"
                  >
                    <X className="h-4 w-4 text-[#696969]" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="dish-cat" className="block text-xs font-semibold">
                      Category *
                    </label>
                    <select
                      id="dish-cat"
                      value={dishCategoryId}
                      onChange={(e) => setDishCategoryId(e.target.value)}
                      required
                      className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                    >
                      {sortedCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dish-name" className="block text-xs font-semibold">
                      Dish Name *
                    </label>
                    <input
                      id="dish-name"
                      type="text"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="e.g. Truffle Gyudon"
                      required
                      minLength={2}
                      className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="dish-price" className="block text-xs font-semibold">
                      Price (IDR) *
                    </label>
                    <input
                      id="dish-price"
                      type="text"
                      inputMode="numeric"
                      pattern="\d+"
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value.replace(/\D/g, ""))}
                      required
                      className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dish-desc" className="block text-xs font-semibold">
                    Description
                  </label>
                  <textarea
                    id="dish-desc"
                    rows={2}
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    placeholder="Key ingredients, portion note, or preparation style..."
                    className="mt-1 w-full rounded-lg border border-[#E8E8E8] bg-white p-3 text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dishPopular}
                        onChange={(e) => setDishPopular(e.target.checked)}
                        className="accent-[#E23744]"
                      />
                      <span>Popular / Best Seller badge</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dishAvailable}
                        onChange={(e) => setDishAvailable(e.target.checked)}
                        className="accent-[#E23744]"
                      />
                      <span>Available on menu</span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-semibold hover:border-[#E23744]">
                      <Upload className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
                      <span>{dishPhotoUrl ? "Replace Photo" : "Upload Food Photo"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(e) => void handleDishImageUpload(e.target.files?.[0])}
                        className="visually-hidden"
                      />
                    </label>
                    {dishPhotoUrl && (
                      <img
                        src={dishPhotoUrl}
                        alt="Uploaded dish preview"
                        className="h-10 w-10 rounded-lg object-cover border border-[#E8E8E8]"
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={dishBusy}
                    className="min-h-11 rounded-lg bg-[#E23744] px-5 text-sm font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
                  >
                    {dishBusy ? "Saving..." : editingDish ? "Update Dish" : "Save Dish"}
                  </button>
                </div>
              </form>
            )}

            {/* Menu Categorized Listing */}
            {sortedCategories.length === 0 ? (
              <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center">
                <p className="font-display text-lg font-bold text-[#1C1C1C]">
                  No digital menu cataloged yet
                </p>
                <p className="mt-1 text-sm text-[#696969]">
                  Help diners by creating a section like Best Sellers or Main Course.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {sortedCategories
                  .filter(
                    (cat) => menuCategoryFilter === "all" || cat.id === menuCategoryFilter
                  )
                  .map((cat) => {
                    const catItems = itemsByCategory.get(cat.id) ?? [];
                    return (
                      <section key={cat.id} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-display text-xl font-bold text-[#1C1C1C]">
                                {cat.name}
                              </h3>
                              {cat.status !== "approved" && (
                                <span className="rounded-full bg-[#FFF0F1] px-2 py-0.5 text-[11px] font-semibold text-[#C91D2B]">
                                  {cat.status}
                                </span>
                              )}
                            </div>
                            {cat.description && (
                              <p className="text-xs text-[#696969]">{cat.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openAddDish(cat.id)}
                            className="text-xs font-semibold text-[#E23744] hover:underline"
                          >
                            + Add dish here
                          </button>
                        </div>

                        {catItems.length === 0 ? (
                          <p className="text-sm text-[#696969]">
                            No items in this category yet.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {catItems.map((item) => {
                              const canModify =
                                isAdmin || (user && item.created_by === user.id);
                              return (
                                <article
                                  key={item.id}
                                  className="flex gap-4 rounded-2xl border border-[#E8E8E8] bg-white p-4 transition hover:border-[#d5d5d5]"
                                >
                                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#FAFAFA] sm:h-28 sm:w-28">
                                    <img
                                      src={
                                        item.photo_url || "/images/dish-nasi-goreng.jpg"
                                      }
                                      alt={item.name}
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                  </div>

                                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-display text-base font-bold text-[#1C1C1C]">
                                          {item.name}
                                        </h4>
                                        {item.is_popular && (
                                          <span className="inline-flex items-center gap-1 rounded bg-[#FFF0F1] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#E23744]">
                                            <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                                            Best Seller
                                          </span>
                                        )}
                                        {item.status !== "approved" && (
                                          <span className="rounded bg-[#FAFAFA] border border-[#E8E8E8] px-1.5 py-0.5 text-[10px] font-semibold text-[#696969]">
                                            {item.status}
                                          </span>
                                        )}
                                        {!item.is_available && (
                                          <span className="rounded bg-[#FAFAFA] px-1.5 py-0.5 text-[10px] font-semibold text-[#696969]">
                                            Unavailable
                                          </span>
                                        )}
                                      </div>

                                      {item.description && (
                                        <p className="mt-1 text-xs leading-relaxed text-[#696969] line-clamp-2">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-2">
                                      <span className="text-sm font-bold text-[#1C1C1C]">
                                        {formatIdr(item.price_idr)}
                                      </span>
                                      {canModify && (
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => openEditDish(item)}
                                            aria-label={`Edit ${item.name}`}
                                            className="rounded p-1 text-[#696969] hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
                                          >
                                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => requestDeleteDish(item)}
                                            aria-label={`Delete ${item.name}`}
                                            className="rounded p-1 text-[#696969] hover:bg-[#FFF0F1] hover:text-[#C91D2B]"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* TAB 3: REVIEWS */}
        <div
          role="tabpanel"
          data-tab-key="reviews"
          aria-labelledby="tab-reviews"
          tabIndex={activeTab === "reviews" ? 0 : undefined}
          {...(activeTab !== "reviews"
            ? ({ hidden: "until-found" } as Record<string, unknown>)
            : {})}
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Rating Breakdown + Composer */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-[#E23744] text-white">
                    <span className="font-display text-2xl font-extrabold">
                      {ratingSummary.totalShown > 0
                        ? ratingSummary.localAvg.toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
                      Overall Rating
                    </h2>
                    <p className="text-xs text-[#696969]">
                      Based on {ratingSummary.totalShown} dining experiences
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingSummary.counts[star] || 0;
                    const pct =
                      ratingSummary.localCount > 0
                        ? Math.round((count / ratingSummary.localCount) * 100)
                        : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-8 font-semibold text-[#1C1C1C]">
                          {star} ★
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8E8E8]">
                          <div
                            className="h-full rounded-full bg-[#E23744]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[#696969]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Single-Review Create/Edit Composer */}
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
                <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
                  {existingUserReview ? "Update Your Review" : "Share Your Experience"}
                </h3>
                {!user ? (
                  <div className="mt-3 rounded-xl bg-[#FAFAFA] p-4 text-sm text-[#696969]">
                    <p>Sign in to rate dishes, attach food photography, and post a review.</p>
                    <Link
                      href={`/auth/login?next=${encodeURIComponent(`/restaurants/${restaurant.slug}?tab=reviews`)}`}
                      className="mt-3 inline-flex rounded-lg bg-[#E23744] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C91D2B]"
                    >
                      Sign In to Review
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSaveReview} className="mt-4 space-y-4">
                    <fieldset>
                      <legend className="text-xs font-semibold text-[#1C1C1C]">
                        Your Rating *
                      </legend>
                      <div className="mt-2 flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <label
                            key={star}
                            className={cn(
                              "flex min-h-10 cursor-pointer items-center gap-1 rounded-lg border px-3 text-sm font-semibold transition",
                              reviewRating === star
                                ? "border-[#E23744] bg-[#FFF0F1] text-[#E23744]"
                                : "border-[#E8E8E8] text-[#696969]"
                            )}
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={star}
                              checked={reviewRating === star}
                              onChange={() => setReviewRating(star)}
                              className="visually-hidden"
                            />
                            <span>{star}</span>
                            <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div>
                      <label htmlFor="review-title" className="block text-xs font-semibold">
                        Headline (optional)
                      </label>
                      <input
                        id="review-title"
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="e.g. Memorable charred flavor and calm courtyard"
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="review-comment" className="block text-xs font-semibold">
                        Review *
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="What did you order? How were the textures, atmosphere, and pacing?"
                        minLength={10}
                        required
                        className="mt-1 w-full rounded-lg border border-[#E8E8E8] p-3 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="review-date" className="block text-xs font-semibold">
                          Visit Date
                        </label>
                        <input
                          id="review-date"
                          type="date"
                          value={reviewVisitDate}
                          onChange={(e) => setReviewVisitDate(e.target.value)}
                          className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-3 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]">
                          <Camera className="h-4 w-4 text-[#E23744]" aria-hidden="true" />
                          <span>
                            {uploadingReviewPhoto ? "Uploading..." : "Attach Food Photo"}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            disabled={uploadingReviewPhoto}
                            onChange={(e) =>
                              void handleReviewPhotoUpload(e.target.files?.[0])
                            }
                            className="visually-hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {reviewPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reviewPhotos.map((url, idx) => (
                          <div key={url} className="relative">
                            <img
                              src={url}
                              alt={`Review attachment ${idx + 1}`}
                              className="h-14 w-14 rounded-lg object-cover border border-[#E8E8E8]"
                            />
                            <button
                              type="button"
                              aria-label="Remove attached photo"
                              onClick={() =>
                                setReviewPhotos((prev) => prev.filter((u) => u !== url))
                              }
                              className="absolute -right-1.5 -top-1.5 rounded-full bg-[#1C1C1C] p-0.5 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2">
                      {existingUserReview && (
                        <button
                          type="button"
                          onClick={() => requestDeleteReview(existingUserReview)}
                          className="text-xs font-semibold text-[#C91D2B] hover:underline"
                        >
                          Delete Review
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={reviewBusy}
                        className="ml-auto min-h-11 rounded-lg bg-[#E23744] px-5 text-sm font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
                      >
                        {reviewBusy
                          ? "Saving..."
                          : existingUserReview
                            ? "Update Review"
                            : "Post Review"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Review Feed */}
            <div className="space-y-4 lg:col-span-7">
              {publishedReviews.length === 0 ? (
                <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center text-sm text-[#696969]">
                  No written community reviews yet. Share the first review for {restaurant.name}.
                </div>
              ) : (
                publishedReviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="rounded-2xl border border-[#E8E8E8] bg-white p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {rev.profile?.avatar_url ? (
                          <img
                            src={rev.profile.avatar_url}
                            alt={rev.profile.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0F1] text-sm font-bold text-[#E23744]">
                            {(rev.profile?.full_name || "D").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <p className="text-sm font-bold text-[#1C1C1C]">
                            {rev.profile?.full_name || "Community Diner"}
                          </p>
                          <p className="text-xs text-[#696969]">
                            {formatDate(rev.visit_date || rev.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#E23744] px-2 py-0.5 text-xs font-bold text-white">
                          {rev.rating}
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                        </span>
                        <button
                          type="button"
                          aria-label="Report review"
                          onClick={() =>
                            requireSignedIn("report reviews") &&
                            setReportTarget({
                              type: "review",
                              id: rev.id,
                              label: rev.title || "Community review",
                            })
                          }
                          className="rounded p-1 text-[#696969] hover:text-[#E23744]"
                        >
                          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {rev.title && (
                      <h4 className="mt-3 font-display text-base font-bold text-[#1C1C1C]">
                        {rev.title}
                      </h4>
                    )}
                    <p className="mt-2 text-sm leading-relaxed text-[#1C1C1C]">
                      {rev.comment}
                    </p>

                    {rev.photo_urls?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {rev.photo_urls.map((url) => (
                          <img
                            key={url}
                            src={url}
                            alt="Dish from diner review"
                            className="h-24 w-24 rounded-xl object-cover border border-[#E8E8E8]"
                          />
                        ))}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        {/* TAB 4: PHOTO GALLERY */}
        <div
          role="tabpanel"
          data-tab-key="photos"
          aria-labelledby="tab-photos"
          tabIndex={activeTab === "photos" ? 0 : undefined}
          {...(activeTab !== "photos"
            ? ({ hidden: "until-found" } as Record<string, unknown>)
            : {})}
        >
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-5 lg:flex-row lg:items-end">
              <div>
                <h2 className="font-display text-xl font-bold text-[#1C1C1C]">
                  Food &amp; Dining Gallery
                </h2>
                <p className="mt-1 text-sm text-[#696969]">
                  High-resolution plates, interiors, and menu shots contributed by diners.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label htmlFor="gallery-type" className="block text-xs font-semibold">
                    Category
                  </label>
                  <select
                    id="gallery-type"
                    value={photoType}
                    onChange={(e) =>
                      setPhotoType(e.target.value as "food" | "gallery" | "menu")
                    }
                    className="mt-1 min-h-10 rounded-lg border border-[#E8E8E8] bg-white px-3 text-xs font-medium"
                  >
                    <option value="food">Food Plate</option>
                    <option value="gallery">Interior / Ambience</option>
                    <option value="menu">Printed Menu Page</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gallery-caption" className="block text-xs font-semibold">
                    Caption
                  </label>
                  <input
                    id="gallery-caption"
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Optional caption"
                    className="mt-1 min-h-10 rounded-lg border border-[#E8E8E8] bg-white px-3 text-xs"
                  />
                </div>
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-[#E23744] px-4 text-xs font-semibold text-white hover:bg-[#C91D2B]">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{photoUploading ? "Uploading..." : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={photoUploading}
                    onChange={handleUploadGalleryPhoto}
                    className="visually-hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {galleryPhotos.map((photo) => {
                const canDelete =
                  photo.id !== "cover-hero" &&
                  (isAdmin || (user && photo.user_id === user.id));
                return (
                  <figure
                    key={photo.id}
                    className="group relative overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxPhoto(photo)}
                      className="block aspect-[4/3] w-full overflow-hidden bg-[#FAFAFA]"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || restaurant.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        aria-label="Delete photo"
                        onClick={() => requestDeletePhoto(photo)}
                        className="absolute right-2.5 top-2.5 rounded-full bg-white/95 p-1.5 text-[#C91D2B] shadow-xs hover:bg-[#FFF0F1]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                    <figcaption className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs">
                      <span className="truncate font-medium text-[#1C1C1C]">
                        {photo.caption || restaurant.name}
                      </span>
                      <span className="shrink-0 rounded bg-[#FAFAFA] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#696969]">
                        {photo.photo_type}
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </div>

        {/* TAB 5: UPDATES */}
        <div
          role="tabpanel"
          data-tab-key="updates"
          aria-labelledby="tab-updates"
          tabIndex={activeTab === "updates" ? 0 : undefined}
          {...(activeTab !== "updates"
            ? ({ hidden: "until-found" } as Record<string, unknown>)
            : {})}
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <h2 className="font-display text-xl font-bold text-[#1C1C1C]">
                Restaurant Announcements &amp; Hours Updates
              </h2>

              {updates.length === 0 ? (
                <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-8 text-center text-sm text-[#696969]">
                  No announcements or verified changes recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {updates.map((upd) => (
                    <article
                      key={upd.id}
                      className="rounded-2xl border border-[#E8E8E8] bg-white p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-[#FFF0F1] px-2.5 py-1 text-[11px] font-semibold uppercase text-[#C91D2B]">
                          {upd.update_type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-[#696969]">
                          {formatDate(upd.created_at)}
                          {upd.status !== "approved" && ` · Pending moderation`}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-base font-bold text-[#1C1C1C]">
                        {upd.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#696969]">{upd.notes}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <form
                onSubmit={handleSubmitUpdate}
                className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-6 space-y-4"
              >
                <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
                  Submit Restaurant Update
                </h3>
                <p className="text-xs text-[#696969]">
                  Spotted new opening hours, a seasonal menu launch, or a phone correction?
                </p>

                <div>
                  <label htmlFor="upd-type" className="block text-xs font-semibold">
                    Update Category
                  </label>
                  <select
                    id="upd-type"
                    value={updateType}
                    onChange={(e) =>
                      setUpdateType(
                        e.target.value as
                          | "info_correction"
                          | "hours"
                          | "menu_update"
                          | "announcement"
                          | "closure_report"
                      )
                    }
                    className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                  >
                    <option value="info_correction">Info Correction</option>
                    <option value="hours">Opening Hours Change</option>
                    <option value="menu_update">Menu Addition / Price Change</option>
                    <option value="announcement">Seasonal Announcement</option>
                    <option value="closure_report">Permanent Closure Report</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="upd-title" className="block text-xs font-semibold">
                    Summary Title *
                  </label>
                  <input
                    id="upd-title"
                    type="text"
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    placeholder="e.g. Updated Saturday hours till 23:30"
                    required
                    minLength={3}
                    className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="upd-notes" className="block text-xs font-semibold">
                    Details *
                  </label>
                  <textarea
                    id="upd-notes"
                    rows={3}
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Provide details so moderators can verify quickly..."
                    required
                    minLength={5}
                    className="mt-1 w-full rounded-lg border border-[#E8E8E8] bg-white p-3 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateBusy}
                  className="min-h-11 w-full rounded-lg bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
                >
                  {updateBusy ? "Submitting..." : "Submit Update"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Save to Collection Modal */}
      <SaveToCollectionModal
        restaurant={collectionModalOpen ? restaurant : null}
        onClose={() => setCollectionModalOpen(false)}
      />

      {/* Photo Lightbox Native Modal */}
      <dialog
        ref={lightboxRef}
        data-size="wide"
        aria-labelledby={lightboxTitleId}
        {...({ closedby: "any" } as Record<string, string>)}
        className="w-full"
      >
        {lightboxPhoto && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4 pb-3">
              <h2 id={lightboxTitleId} className="font-display text-base font-bold text-[#1C1C1C]">
                {lightboxPhoto.caption || restaurant.name}
              </h2>
              <button
                type="button"
                onClick={() => lightboxRef.current?.close()}
                aria-label="Close photo lightbox"
                className="rounded-lg p-1.5 text-[#696969] hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption || restaurant.name}
              className="max-h-[70dvh] w-full rounded-xl object-contain bg-[#FAFAFA]"
            />
          </div>
        )}
      </dialog>

      {/* Content Report Native Modal */}
      <dialog
        ref={reportDialogRef}
        aria-labelledby={reportTitleId}
        {...({ closedby: "any" } as Record<string, string>)}
        className="w-full"
      >
        <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#E23744]" aria-hidden="true" />
              <h2 id={reportTitleId} className="font-display text-lg font-bold text-[#1C1C1C]">
                Report Content
              </h2>
            </div>
            <button
              type="button"
              onClick={() => reportDialogRef.current?.close()}
              aria-label="Close report dialog"
            >
              <X className="h-4 w-4 text-[#696969]" />
            </button>
          </div>
          {reportTarget && (
            <p className="text-xs text-[#696969]">
              Target: <strong className="text-[#1C1C1C]">{reportTarget.label}</strong>
            </p>
          )}

          <div>
            <label htmlFor="report-reason" className="block text-xs font-semibold">
              Reason
            </label>
            <select
              id="report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
            >
              <option value="Inaccurate information">Inaccurate information</option>
              <option value="Spam or promotional content">Spam or promotional content</option>
              <option value="Inappropriate photo or language">
                Inappropriate photo or language
              </option>
              <option value="Duplicate listing">Duplicate listing</option>
              <option value="Closed permanently">Closed permanently</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-details" className="block text-xs font-semibold">
              Additional Context
            </label>
            <textarea
              id="report-details"
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Explain what should be reviewed..."
              className="mt-1 w-full rounded-lg border border-[#E8E8E8] p-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => reportDialogRef.current?.close()}
              className="min-h-10 rounded-lg border border-[#E8E8E8] px-4 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reportBusy}
              className="min-h-10 rounded-lg bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
            >
              {reportBusy ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </dialog>

      {/* Reusable Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ""}
        description={confirmState?.description || ""}
        confirmLabel="Delete"
        destructive
        busy={confirmBusy}
        onConfirm={async () => {
          if (!confirmState) return;
          setConfirmBusy(true);
          await confirmState.onConfirm();
          setConfirmBusy(false);
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}

