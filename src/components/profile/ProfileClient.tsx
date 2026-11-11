"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  Camera,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  LogOut,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { SaveToCollectionModal } from "@/components/restaurants/SaveToCollectionModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCraver } from "@/components/providers/CraverProviders";
import { formatT, translateCategory } from "@/lib/i18n/dictionary";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { removeImageFromSupabase, uploadImageToSupabase } from "@/lib/supabase/storage";
import { profileSchema } from "@/lib/validation/schemas";
import { cn, formatDate, JAKARTA_AREAS } from "@/lib/utils";
import type {
  NotificationItem,
  Photo,
  Profile,
  Restaurant,
  Review,
} from "@/types/database";

type ProfileTabKey =
  | "saved"
  | "submissions"
  | "reviews"
  | "photos"
  | "notifications"
  | "settings";

const PROFILE_TAB_KEYS: ProfileTabKey[] = [
  "saved",
  "submissions",
  "reviews",
  "photos",
  "notifications",
  "settings",
];

interface ProfileClientProps {
  configured: boolean;
  userEmail: string | null;
  initialProfile: Profile | null;
  initialFavorites: Restaurant[];
  initialSubmissions: Restaurant[];
  initialReviews: Review[];
  initialPhotos: Photo[];
  initialNotifications: NotificationItem[];
}

export function ProfileClient({
  configured,
  userEmail,
  initialProfile,
  initialFavorites,
  initialSubmissions,
  initialReviews,
  initialPhotos,
  initialNotifications,
}: ProfileClientProps) {
  const router = useRouter();
  const {
    user,
    favoriteIds,
    markNotificationRead,
    markAllNotificationsRead,
    refreshSessionData,
    showToast,
    locale,
    t,
  } = useCraver();

  const profileTabs = PROFILE_TAB_KEYS.map((key) => ({
    key,
    label: t.profile.tabs[key],
  }));

  const [activeTab, setActiveTab] = useState<ProfileTabKey>("saved");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelsRef = useRef<HTMLDivElement>(null);

  const [profileState, setProfileState] = useState<Profile | null>(initialProfile);
  const [favorites, setFavorites] = useState<Restaurant[]>(initialFavorites);
  const [submissions, setSubmissions] = useState<Restaurant[]>(initialSubmissions);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);

  // Sync saved list if user unbookmarks via RestaurantCard
  useEffect(() => {
    setFavorites((prev) => prev.filter((r) => favoriteIds.includes(r.id)));
  }, [favoriteIds]);

  useEffect(() => {
    const container = panelsRef.current;
    if (!container) return;
    const onBeforeMatch = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const panel = target?.closest('[role="tabpanel"]') as HTMLElement | null;
      const key = panel?.dataset.tabKey as ProfileTabKey | undefined;
      if (key && PROFILE_TAB_KEYS.includes(key)) {
        setActiveTab(key);
      }
    };
    container.addEventListener("beforematch", onBeforeMatch);
    return () => container.removeEventListener("beforematch", onBeforeMatch);
  }, []);

  const selectTab = (key: ProfileTabKey) => {
    setActiveTab(key);
    tabRefs.current[key]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let nextIdx = -1;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % PROFILE_TAB_KEYS.length;
    else if (e.key === "ArrowLeft")
      nextIdx = (idx - 1 + PROFILE_TAB_KEYS.length) % PROFILE_TAB_KEYS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = PROFILE_TAB_KEYS.length - 1;
    if (nextIdx >= 0) {
      e.preventDefault();
      const targetKey = PROFILE_TAB_KEYS[nextIdx];
      selectTab(targetKey);
      tabRefs.current[targetKey]?.focus();
    }
  };

  // Profile form state
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [city, setCity] = useState(initialProfile?.city ?? "Jakarta");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Review inline editor
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState("");
  const [revComment, setRevComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // Collection modal & confirmation dialog
  const [collectionRestaurant, setCollectionRestaurant] = useState<Restaurant | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  if (!configured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E8E8E8] bg-[#FFF6E9] p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-[#1C1C1C]">
            {t.profile.connectTitle}
          </h1>
          <p className="mt-2 text-sm text-[#696969]">{t.profile.connectDesc}</p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#E23744] px-5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
          >
            {t.profile.backHome}
          </Link>
        </div>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const { publicUrl } = await uploadImageToSupabase({
        file,
        bucket: "avatars",
        userId: user.id,
        folder: "profile",
      });
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase client unavailable.");
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
      setAvatarUrl(publicUrl);
      setProfileState((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
      await refreshSessionData();
      showToast("Profile avatar updated.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed.", "error");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = profileSchema.safeParse({
      full_name: fullName,
      username: username.toLowerCase(),
      city,
      bio,
      avatar_url: avatarUrl || null,
    });
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || "Check profile inputs.", "error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setSavingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(parsed.data)
        .eq("id", user.id)
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          showToast("That username is already taken. Choose another.", "error");
        } else {
          showToast(error.message, "error");
        }
        return;
      }
      setProfileState(data as Profile);
      await refreshSessionData();
      showToast("Profile updated.", "success");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveReview = async (reviewId: string) => {
    if (revComment.trim().length < 10) {
      showToast("Review comment must be at least 10 characters.", "error");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !user) return;
    setSavingReview(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          rating: revRating,
          title: revTitle.trim(),
          comment: revComment.trim(),
        })
        .eq("id", reviewId)
        .eq("user_id", user.id)
        .select("*, restaurant:restaurants(id, slug, name)")
        .single();
      if (error) {
        showToast(error.message, "error");
        return;
      }
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? (data as Review) : r)));
      setEditingReviewId(null);
      showToast("Review updated.", "success");
      router.refresh();
    } finally {
      setSavingReview(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    await refreshSessionData();
    router.push("/");
    router.refresh();
  };

  const initials = (profileState?.full_name || userEmail || "C")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const statusBadgeClass = (status: Restaurant["status"]) => {
    if (status === "approved") return "bg-emerald-50 text-[#1F7A4C] border-emerald-200";
    if (status === "pending") return "bg-amber-50 text-amber-800 border-amber-200";
    if (status === "rejected") return "bg-[#FFF0F1] text-[#C91D2B] border-[#E23744]/30";
    return "bg-[#FAFAFA] text-[#696969] border-[#E8E8E8]";
  };

  return (
    <div className="bg-white">
      <div className="border-b border-[#EEEEEE] bg-[#FFF6E9] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header Profile Card */}
          <section className="rounded-3xl border border-[#EEEEEE] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-start gap-4 sm:items-center">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profileState?.full_name || "Profile photo"}
                      className="h-20 w-20 rounded-full border border-[#E8E8E8] object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF0F1] font-display text-2xl font-extrabold text-[#E23744]">
                      {initials}
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#1C1C1C] shadow-sm transition hover:border-[#E23744] hover:text-[#E23744]"
                    title={t.profile.replaceAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Camera className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="visually-hidden">{t.profile.replaceAvatar}</span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="visually-hidden"
                    />
                  </label>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-extrabold text-[#1C1C1C]">
                      {profileState?.full_name || t.profile.explorerFallback}
                    </h1>
                    {profileState?.role === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F1] px-2.5 py-0.5 text-xs font-semibold text-[#C91D2B]">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.profile.adminRoleBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#696969]">
                    {profileState?.username ? `@${profileState.username} · ` : ""}
                    {userEmail}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#696969]">
                    <MapPin className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
                    {profileState?.city || "Jakarta"}
                  </p>
                  {profileState?.bio && (
                    <p className="mt-2 max-w-xl text-sm text-[#1C1C1C]">{profileState.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/contribute"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#E23744] px-4 text-sm font-semibold text-white transition hover:bg-[#C91D2B]"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  {t.profile.addRestaurant}
                </Link>
                {profileState?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#E23744]/30 bg-[#FFF0F1] px-4 text-sm font-semibold text-[#C91D2B] transition hover:bg-[#E23744] hover:text-white"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    {t.profile.moderationQueue}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#E8E8E8] bg-white px-4 text-sm font-medium text-[#696969] transition hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t.profile.signOutBtn}
                </button>
              </div>
            </div>

            {/* Summary Counters */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#E8E8E8] pt-5 sm:grid-cols-4">
              <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                <p className="text-xs font-medium text-[#696969]">{t.profile.counters.saved}</p>
                <p className="mt-1 font-display text-xl font-bold text-[#1C1C1C]">
                  {favorites.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                <p className="text-xs font-medium text-[#696969]">{t.profile.counters.submissions}</p>
                <p className="mt-1 font-display text-xl font-bold text-[#1C1C1C]">
                  {submissions.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                <p className="text-xs font-medium text-[#696969]">{t.profile.counters.reviews}</p>
                <p className="mt-1 font-display text-xl font-bold text-[#1C1C1C]">
                  {reviews.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                <p className="text-xs font-medium text-[#696969]">{t.profile.counters.photos}</p>
                <p className="mt-1 font-display text-xl font-bold text-[#1C1C1C]">
                  {photos.length}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div role="tablist" aria-label={t.profile.tabsAria} className="craver-tablist">
          {profileTabs.map((tab, idx) => (
            <button
              key={tab.key}
              id={`profile-tab-${tab.key}`}
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              tabIndex={activeTab === tab.key ? 0 : -1}
              onClick={() => selectTab(tab.key)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className="whitespace-nowrap text-sm"
            >
              {tab.label}
              {tab.key === "notifications" &&
                notifications.some((n) => !n.is_read) && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E23744] px-1.5 text-[11px] font-bold text-white">
                    {notifications.filter((n) => !n.is_read).length}
                  </span>
                )}
            </button>
          ))}
        </div>

        <div ref={panelsRef}>
          {/* Tab 1: Saved Restaurants */}
          <div
            role="tabpanel"
            aria-labelledby="profile-tab-saved"
            data-tab-key="saved"
            hidden={activeTab !== "saved" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="pt-6">
              {favorites.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center">
                  <Bookmark className="mx-auto h-8 w-8 text-[#696969]" aria-hidden="true" />
                  <h2 className="mt-3 font-display text-lg font-bold text-[#1C1C1C]">
                    {t.profile.noSavedTitle}
                  </h2>
                  <p className="mt-1 text-sm text-[#696969]">{t.profile.noSavedDesc}</p>
                  <Link
                    href="/explore"
                    className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B]"
                  >
                    {t.profile.exploreRestaurants}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onSaveToCollection={(r) => setCollectionRestaurant(r)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab 2: My Submissions */}
          <div
            role="tabpanel"
            aria-labelledby="profile-tab-submissions"
            data-tab-key="submissions"
            hidden={
              activeTab !== "submissions" ? ("until-found" as unknown as boolean) : undefined
            }
          >
            <div className="pt-6">
              {submissions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center">
                  <p className="text-sm text-[#696969]">{t.profile.noSubmissions}</p>
                  <Link
                    href="/contribute"
                    className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B]"
                  >
                    {t.profile.submitRestaurant}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => {
                    const editable = ["draft", "pending", "rejected"].includes(sub.status);
                    const statusLabel =
                      t.common.statusLabels[
                        sub.status as keyof typeof t.common.statusLabels
                      ] ?? sub.status;
                    return (
                      <article
                        key={sub.id}
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E8E8E8] bg-white p-5 sm:flex-row sm:items-center"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
                              {sub.name}
                            </h2>
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                                statusBadgeClass(sub.status)
                              )}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#696969]">
                            {translateCategory(sub.primary_cuisine, locale)} · {sub.district},{" "}
                            {sub.city} · {t.profile.updatedPrefix}{" "}
                            {formatDate(sub.updated_at, locale)}
                          </p>
                          {sub.status === "rejected" && sub.rejection_reason && (
                            <p className="mt-2 rounded-lg bg-[#FFF0F1] px-3 py-1.5 text-xs text-[#C91D2B]">
                              {t.profile.moderatorNote} {sub.rejection_reason}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {sub.status === "approved" && (
                            <Link
                              href={`/restaurants/${sub.slug}`}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E8E8E8] px-3.5 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]"
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                              {t.profile.viewPage}
                            </Link>
                          )}
                          {editable && (
                            <Link
                              href={`/contribute?edit=${sub.id}`}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E8E8E8] px-3.5 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]"
                            >
                              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                              {t.profile.editResubmit}
                            </Link>
                          )}
                          {editable && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  title: formatT(t.profile.deleteSubTitle, { name: sub.name }),
                                  description: t.profile.deleteSubDesc,
                                  onConfirm: async () => {
                                    const supabase = createSupabaseBrowserClient();
                                    if (!supabase || !user) return;
                                    const { error } = await supabase
                                      .from("restaurants")
                                      .delete()
                                      .eq("id", sub.id)
                                      .eq("created_by", user.id);
                                    if (error) {
                                      showToast(error.message, "error");
                                      return;
                                    }
                                    setSubmissions((prev) =>
                                      prev.filter((item) => item.id !== sub.id)
                                    );
                                    showToast("Submission removed.", "info");
                                  },
                                })
                              }
                              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#E8E8E8] px-3 text-xs font-medium text-[#C91D2B] hover:bg-[#FFF0F1]"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {t.common.delete}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tab 3: My Reviews */}
          <div
            role="tabpanel"
            aria-labelledby="profile-tab-reviews"
            data-tab-key="reviews"
            hidden={activeTab !== "reviews" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="pt-6">
              {reviews.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center text-sm text-[#696969]">
                  {t.profile.noReviews}
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const isEditing = editingReviewId === review.id;
                    return (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-[#E8E8E8] bg-white p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Link
                              href={`/restaurants/${review.restaurant?.slug || ""}`}
                              className="font-display text-base font-bold text-[#1C1C1C] hover:text-[#E23744]"
                            >
                              {review.restaurant?.name || "Restaurant"}
                            </Link>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[#696969]">
                              <span className="inline-flex items-center gap-1 rounded bg-[#E23744] px-1.5 py-0.5 font-bold text-white">
                                <Star className="h-3 w-3 fill-white" aria-hidden="true" />
                                {review.rating}
                              </span>
                              <span>{formatDate(review.created_at, locale)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingReviewId(null);
                                } else {
                                  setEditingReviewId(review.id);
                                  setRevRating(review.rating);
                                  setRevTitle(review.title);
                                  setRevComment(review.comment);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E8E8E8] px-3 py-1.5 text-xs font-medium text-[#1C1C1C] hover:border-[#E23744]"
                            >
                              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                              {isEditing ? t.common.cancel : t.common.edit}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  title: t.profile.deleteRevTitle,
                                  description: t.profile.deleteRevDesc,
                                  onConfirm: async () => {
                                    const supabase = createSupabaseBrowserClient();
                                    if (!supabase || !user) return;
                                    const { error } = await supabase
                                      .from("reviews")
                                      .delete()
                                      .eq("id", review.id)
                                      .eq("user_id", user.id);
                                    if (error) {
                                      showToast(error.message, "error");
                                      return;
                                    }
                                    setReviews((prev) =>
                                      prev.filter((r) => r.id !== review.id)
                                    );
                                    showToast("Review deleted.", "info");
                                    router.refresh();
                                  },
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E8E8E8] px-3 py-1.5 text-xs font-medium text-[#C91D2B] hover:bg-[#FFF0F1]"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {t.common.delete}
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-4 space-y-3 border-t border-[#E8E8E8] pt-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-[#1C1C1C]">
                                {t.profile.ratingPrefix}
                              </span>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRevRating(star)}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold",
                                    revRating === star
                                      ? "border-[#E23744] bg-[#E23744] text-white"
                                      : "border-[#E8E8E8] bg-white text-[#1C1C1C]"
                                  )}
                                >
                                  {star} ★
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={revTitle}
                              onChange={(e) => setRevTitle(e.target.value)}
                              placeholder={t.profile.headlinePlaceholder}
                              className="min-h-10 w-full rounded-xl border border-[#E8E8E8] px-3 py-2 text-sm"
                            />
                            <textarea
                              rows={3}
                              value={revComment}
                              onChange={(e) => setRevComment(e.target.value)}
                              className="w-full rounded-xl border border-[#E8E8E8] px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              disabled={savingReview}
                              onClick={() => handleSaveReview(review.id)}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#E23744] px-4 text-xs font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              {savingReview ? t.common.saving : t.profile.saveReview}
                            </button>
                          </div>
                        ) : (
                          <>
                            {review.title && (
                              <h3 className="mt-3 text-sm font-semibold text-[#1C1C1C]">
                                {review.title}
                              </h3>
                            )}
                            <p className="mt-1 text-sm leading-relaxed text-[#696969]">
                              {review.comment}
                            </p>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tab 4: My Photos */}
          <div
            role="tabpanel"
            aria-labelledby="profile-tab-photos"
            data-tab-key="photos"
            hidden={activeTab !== "photos" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="pt-6">
              {photos.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center text-sm text-[#696969]">
                  {t.profile.noPhotos}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-[#FAFAFA]">
                        <img
                          src={photo.url}
                          alt={photo.caption || "Uploaded restaurant photo"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3.5">
                        <div className="min-w-0">
                          <Link
                            href={`/restaurants/${photo.restaurant?.slug || ""}?tab=photos`}
                            className="block truncate text-sm font-semibold text-[#1C1C1C] hover:text-[#E23744]"
                          >
                            {photo.restaurant?.name || "Restaurant"}
                          </Link>
                          <p className="truncate text-xs text-[#696969]">
                            {photo.caption || photo.photo_type}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmState({
                              title: t.profile.deletePhotoTitle,
                              description: t.profile.deletePhotoDesc,
                              onConfirm: async () => {
                                const supabase = createSupabaseBrowserClient();
                                if (!supabase || !user) return;
                                const { error } = await supabase
                                  .from("photos")
                                  .delete()
                                  .eq("id", photo.id)
                                  .eq("user_id", user.id);
                                if (error) {
                                  showToast(error.message, "error");
                                  return;
                                }
                                if (photo.storage_path) {
                                  const bucket =
                                    photo.photo_type === "food"
                                      ? "food-photos"
                                      : "restaurant-photos";
                                  await removeImageFromSupabase(bucket, photo.storage_path);
                                }
                                setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
                                showToast("Photo removed.", "info");
                              },
                            })
                          }
                          aria-label={t.common.delete}
                          className="rounded-lg border border-[#E8E8E8] p-2 text-[#C91D2B] hover:bg-[#FFF0F1]"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab 5: Notifications */}
          <div
            role="tabpanel"
            aria-labelledby="profile-tab-notifications"
            data-tab-key="notifications"
            hidden={
              activeTab !== "notifications"
                ? ("until-found" as unknown as boolean)
                : undefined
            }
          >
            <div className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
                  {t.profile.activityHeading}
                </h2>
                {notifications.some((n) => !n.is_read) && (
                  <button
                    type="button"
                    onClick={async () => {
                      await markAllNotificationsRead();
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, is_read: true }))
                      );
                    }}
                    className="text-xs font-semibold text-[#E23744] hover:underline"
                  >
                    {t.nav.markAllRead}
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-10 text-center">
                  <Bell className="mx-auto h-7 w-7 text-[#696969]" aria-hidden="true" />
                  <p className="mt-2 text-sm text-[#696969]">{t.profile.noNotifs}</p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        "flex flex-col justify-between gap-2 rounded-xl border p-4 sm:flex-row sm:items-center",
                        n.is_read
                          ? "border-[#E8E8E8] bg-white"
                          : "border-[#E23744]/30 bg-[#FFF0F1]/40"
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1C1C1C]">{n.title}</p>
                        <p className="mt-0.5 text-xs text-[#696969]">{n.body}</p>
                        <p className="mt-1 text-[11px] text-[#696969]">
                          {formatDate(n.created_at, locale)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={async () => {
                              await markNotificationRead(n.id);
                              setNotifications((prev) =>
                                prev.map((item) =>
                                  item.id === n.id ? { ...item, is_read: true } : item
                                )
                              );
                            }}
                            className="rounded-lg border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1C1C] hover:border-[#E23744]"
                          >
                            {t.profile.markRead}
                          </button>
                        )}
                        {n.link && (
                          <Link
                            href={n.link}
                            className="rounded-lg bg-[#E23744] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#C91D2B]"
                          >
                            {t.common.open}
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Tab 6: Account Settings */}
          <div
            role="tabpanel"
            aria-labelledby="profile-tab-settings"
            data-tab-key="settings"
            hidden={activeTab !== "settings" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="max-w-2xl pt-6">
              <form
                onSubmit={handleSaveProfile}
                className="space-y-4 rounded-2xl border border-[#E8E8E8] bg-white p-6"
              >
                <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
                  {t.profile.editPublicProfile}
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="profile-full-name"
                      className="text-sm font-medium text-[#1C1C1C]"
                    >
                      {t.profile.fullName}
                    </label>
                    <input
                      id="profile-full-name"
                      name="full_name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="min-h-11 rounded-xl border border-[#E8E8E8] px-3.5 py-2 text-[#1C1C1C]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="profile-username"
                      className="text-sm font-medium text-[#1C1C1C]"
                    >
                      {t.profile.username}
                    </label>
                    <input
                      id="profile-username"
                      name="username"
                      type="text"
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_]+"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="min-h-11 rounded-xl border border-[#E8E8E8] px-3.5 py-2 text-[#1C1C1C]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="profile-city"
                    className="text-sm font-medium text-[#1C1C1C]"
                  >
                    {t.profile.homeArea}
                  </label>
                  <select
                    id="profile-city"
                    name="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="min-h-11 rounded-xl border border-[#E8E8E8] bg-white px-3.5 py-2 text-[#1C1C1C]"
                  >
                    <option value="Jakarta">Jakarta</option>
                    {JAKARTA_AREAS.filter((a) => a !== "All Jakarta").map((area) => (
                      <option key={area} value={area}>
                        {area}, Jakarta
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="profile-bio"
                    className="text-sm font-medium text-[#1C1C1C]"
                  >
                    {t.profile.shortBio}
                  </label>
                  <textarea
                    id="profile-bio"
                    name="bio"
                    rows={3}
                    maxLength={300}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t.profile.bioPlaceholder}
                    className="rounded-xl border border-[#E8E8E8] px-3.5 py-2 text-[#1C1C1C]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label
                    htmlFor="avatar-upload-inline"
                    className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#696969] hover:text-[#E23744]"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {t.profile.replaceAvatar}
                    <input
                      id="avatar-upload-inline"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="visually-hidden"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#E23744] px-5 text-sm font-semibold text-white transition hover:bg-[#C91D2B] disabled:opacity-60"
                  >
                    {savingProfile && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    {t.profile.saveChanges}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <SaveToCollectionModal
        restaurant={collectionRestaurant}
        onClose={() => setCollectionRestaurant(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={t.common.delete}
        destructive
        busy={confirmBusy}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          if (!confirmState) return;
          setConfirmBusy(true);
          try {
            await confirmState.onConfirm();
          } finally {
            setConfirmBusy(false);
            setConfirmState(null);
          }
        }}
      />
    </div>
  );
}
