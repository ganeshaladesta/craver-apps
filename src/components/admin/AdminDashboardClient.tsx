"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Flag,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCraver } from "@/components/providers/CraverProviders";
import { cn, formatDate, formatIdr } from "@/lib/utils";
import type {
  AuditLog,
  ContentReport,
  MenuCategory,
  MenuItem,
  Photo,
  Profile,
  Restaurant,
  RestaurantUpdate,
  Review,
} from "@/types/database";

type AdminTab =
  | "restaurants"
  | "menu"
  | "updates"
  | "reviews_photos"
  | "reports"
  | "users"
  | "audit";

const ADMIN_TABS: Array<{ key: AdminTab; label: string }> = [
  { key: "restaurants", label: "Restaurants" },
  { key: "menu", label: "Menu Queue" },
  { key: "updates", label: "Updates" },
  { key: "reviews_photos", label: "Reviews & Photos" },
  { key: "reports", label: "Reports" },
  { key: "users", label: "Users" },
  { key: "audit", label: "Audit Logs" },
];

export interface AdminOverviewData {
  restaurants: Restaurant[];
  menuCategories: Array<
    MenuCategory & { restaurant?: { id: string; slug: string; name: string } }
  >;
  menuItems: Array<
    MenuItem & { restaurant?: { id: string; slug: string; name: string } }
  >;
  updates: RestaurantUpdate[];
  reviews: Review[];
  photos: Photo[];
  reports: ContentReport[];
  users: Profile[];
  auditLogs: AuditLog[];
}

interface AdminDashboardClientProps {
  configured: boolean;
  serviceRoleConfigured: boolean;
  accessDenied: boolean;
  currentAdminId: string | null;
  initialData: AdminOverviewData | null;
}

export function AdminDashboardClient({
  configured,
  serviceRoleConfigured,
  accessDenied,
  currentAdminId,
  initialData,
}: AdminDashboardClientProps) {
  const { showToast } = useCraver();
  const [data, setData] = useState<AdminOverviewData>(
    initialData ?? {
      restaurants: [],
      menuCategories: [],
      menuItems: [],
      updates: [],
      reviews: [],
      photos: [],
      reports: [],
      users: [],
      auditLogs: [],
    }
  );

  const [activeTab, setActiveTab] = useState<AdminTab>("restaurants");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelsRef = useRef<HTMLDivElement>(null);
  const [restaurantFilter, setRestaurantFilter] = useState<string>("pending");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Reject / resolution note native <dialog>
  const noteDialogRef = useRef<HTMLDialogElement>(null);
  const noteHeadingId = useId();
  const [noteModal, setNoteModal] = useState<{
    title: string;
    label: string;
    placeholder: string;
    onSubmit: (note: string) => Promise<void>;
  } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);

  // Confirm destructive dialog
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    const dialog = noteDialogRef.current;
    if (!dialog) return;
    if (noteModal && !dialog.open) {
      dialog.returnValue = "";
      dialog.showModal();
    } else if (!noteModal && dialog.open) {
      dialog.close();
    }
  }, [noteModal]);

  useEffect(() => {
    const dialog = noteDialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      dialog.returnValue = "";
      setNoteModal(null);
      setNoteText("");
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  useEffect(() => {
    const container = panelsRef.current;
    if (!container) return;
    const onBeforeMatch = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const panel = target?.closest('[role="tabpanel"]') as HTMLElement | null;
      const key = panel?.dataset.tabKey as AdminTab | undefined;
      if (key && ADMIN_TABS.some((t) => t.key === key)) {
        setActiveTab(key);
      }
    };
    container.addEventListener("beforematch", onBeforeMatch);
    return () => container.removeEventListener("beforematch", onBeforeMatch);
  }, []);

  if (!configured || !serviceRoleConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-[#E23744]" aria-hidden="true" />
          <h1 className="mt-3 font-display text-2xl font-bold text-[#1C1C1C]">
            Admin Dashboard Setup Required
          </h1>
          <p className="mt-2 text-sm text-[#696969]">
            Server-side moderation routes require{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{" "}
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
            <code className="font-mono">.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E23744]/25 bg-[#FFF0F1]/50 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-[#C91D2B]" aria-hidden="true" />
          <h1 className="mt-3 font-display text-2xl font-bold text-[#1C1C1C]">
            Administrator Access Required
          </h1>
          <p className="mt-2 text-sm text-[#696969]">
            Your account does not currently have moderation privileges. Promote a user to{" "}
            <code className="font-mono">role = &apos;admin&apos;</code> in Supabase SQL Editor.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B]"
          >
            Return to CRAVER
          </Link>
        </div>
      </div>
    );
  }

  const reloadOverview = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(body.error || "Failed to refresh overview.", "error");
        return;
      }
      const next = (await res.json()) as AdminOverviewData;
      setData(next);
    } finally {
      setRefreshing(false);
    }
  };

  const apiMutate = async (
    url: string,
    method: "PATCH" | "DELETE",
    body?: Record<string, unknown>,
    key?: string,
    successMsg?: string
  ) => {
    if (key) setBusyKey(key);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(payload.error || "Moderation request failed.", "error");
        return false;
      }
      if (successMsg) showToast(successMsg, "success");
      await reloadOverview();
      return true;
    } finally {
      if (key) setBusyKey(null);
    }
  };

  const pendingRestaurantsCount = data.restaurants.filter(
    (r) => r.status === "pending"
  ).length;
  const pendingMenuCount =
    data.menuCategories.filter((c) => c.status === "pending").length +
    data.menuItems.filter((i) => i.status === "pending").length;
  const pendingUpdatesCount = data.updates.filter((u) => u.status === "pending").length;
  const openReportsCount = data.reports.filter((r) => r.status === "open").length;

  const filteredRestaurants =
    restaurantFilter === "all"
      ? data.restaurants
      : data.restaurants.filter((r) => r.status === restaurantFilter);

  const selectTab = (key: AdminTab) => {
    setActiveTab(key);
    tabRefs.current[key]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let nextIdx = -1;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % ADMIN_TABS.length;
    else if (e.key === "ArrowLeft")
      nextIdx = (idx - 1 + ADMIN_TABS.length) % ADMIN_TABS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = ADMIN_TABS.length - 1;
    if (nextIdx >= 0) {
      e.preventDefault();
      const targetKey = ADMIN_TABS[nextIdx].key;
      selectTab(targetKey);
      tabRefs.current[targetKey]?.focus();
    }
  };

  const statusPill = (status: string) => {
    if (status === "approved" || status === "published" || status === "resolved") {
      return "bg-emerald-50 text-[#1F7A4C] border-emerald-200";
    }
    if (status === "pending" || status === "open") {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (status === "rejected" || status === "flagged" || status === "hidden") {
      return "bg-[#FFF0F1] text-[#C91D2B] border-[#E23744]/30";
    }
    return "bg-[#FAFAFA] text-[#696969] border-[#E8E8E8]";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#E8E8E8] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E23744]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Administrator Console
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
            CRAVER Moderation Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#696969]">
            Review restaurant submissions, menu updates, flagged reviews, and user reports.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reloadOverview()}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E8E8E8] bg-white px-4 text-sm font-medium text-[#1C1C1C] transition hover:border-[#E23744] disabled:opacity-60"
        >
          <RefreshCw
            className={cn("h-4 w-4", refreshing && "animate-spin")}
            aria-hidden="true"
          />
          Refresh Queues
        </button>
      </div>

      {/* KPI Strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            selectTab("restaurants");
            setRestaurantFilter("pending");
          }}
          className="rounded-2xl border border-[#E8E8E8] bg-white p-4 text-left transition hover:border-[#E23744]/40"
        >
          <p className="text-xs font-medium text-[#696969]">Pending Restaurants</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#E23744]">
            {pendingRestaurantsCount}
          </p>
        </button>
        <button
          type="button"
          onClick={() => selectTab("menu")}
          className="rounded-2xl border border-[#E8E8E8] bg-white p-4 text-left transition hover:border-[#E23744]/40"
        >
          <p className="text-xs font-medium text-[#696969]">Pending Menu Entries</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#1C1C1C]">
            {pendingMenuCount}
          </p>
        </button>
        <button
          type="button"
          onClick={() => selectTab("updates")}
          className="rounded-2xl border border-[#E8E8E8] bg-white p-4 text-left transition hover:border-[#E23744]/40"
        >
          <p className="text-xs font-medium text-[#696969]">Pending Updates</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#1C1C1C]">
            {pendingUpdatesCount}
          </p>
        </button>
        <button
          type="button"
          onClick={() => selectTab("reports")}
          className="rounded-2xl border border-[#E8E8E8] bg-white p-4 text-left transition hover:border-[#E23744]/40"
        >
          <p className="text-xs font-medium text-[#696969]">Open Reports</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#C91D2B]">
            {openReportsCount}
          </p>
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div role="tablist" aria-label="Moderation queues" className="craver-tablist">
          {ADMIN_TABS.map((tab, idx) => (
            <button
              key={tab.key}
              id={`admin-tab-${tab.key}`}
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              tabIndex={activeTab === tab.key ? 0 : -1}
              onClick={() => selectTab(tab.key)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className="text-sm whitespace-nowrap"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div ref={panelsRef}>
          {/* 1. Restaurants Queue */}
          <div
            role="tabpanel"
            aria-labelledby="admin-tab-restaurants"
            data-tab-key="restaurants"
            hidden={
              activeTab !== "restaurants" ? ("until-found" as unknown as boolean) : undefined
            }
          >
            <div className="pt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {["pending", "approved", "rejected", "archived", "all"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setRestaurantFilter(status)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition",
                        restaurantFilter === status
                          ? "border-[#E23744] bg-[#E23744] text-white"
                          : "border-[#E8E8E8] bg-white text-[#1C1C1C] hover:border-[#E23744]/50"
                      )}
                    >
                      {status} (
                      {status === "all"
                        ? data.restaurants.length
                        : data.restaurants.filter((r) => r.status === status).length}
                      )
                    </button>
                  ))}
                </div>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-labelledby="restaurants-table-caption"
                className="table-wrapper"
              >
                <table className="craver-table">
                  <caption id="restaurants-table-caption" className="visually-hidden">
                    Restaurant moderation queue
                  </caption>
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th>Area &amp; Cuisine</th>
                      <th>Status</th>
                      <th>Highlights</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-sm text-[#696969] py-8">
                          No restaurants in this status filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRestaurants.map((rest) => (
                        <tr key={rest.id}>
                          <th scope="row">
                            <div className="min-w-[170px]">
                              <Link
                                href={`/restaurants/${rest.slug}`}
                                className="inline-flex items-center gap-1 font-semibold text-[#1C1C1C] hover:text-[#E23744]"
                              >
                                {rest.name}
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </Link>
                              <p className="text-xs font-normal text-[#696969]">
                                {formatIdr(rest.average_price_idr)}/person
                              </p>
                            </div>
                          </th>
                          <td data-label="Area & Cuisine">
                            <p className="font-medium text-[#1C1C1C]">{rest.district}</p>
                            <p className="text-xs text-[#696969]">{rest.primary_cuisine}</p>
                          </td>
                          <td data-label="Status">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                                statusPill(rest.status)
                              )}
                            >
                              {rest.status}
                            </span>
                          </td>
                          <td data-label="Highlights">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                disabled={busyKey === `ver-${rest.id}`}
                                onClick={() =>
                                  void apiMutate(
                                    `/api/admin/restaurants/${rest.id}`,
                                    "PATCH",
                                    { is_verified: !rest.is_verified },
                                    `ver-${rest.id}`,
                                    `Updated verified state for ${rest.name}.`
                                  )
                                }
                                className={cn(
                                  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold",
                                  rest.is_verified
                                    ? "border-emerald-200 bg-emerald-50 text-[#1F7A4C]"
                                    : "border-[#E8E8E8] bg-white text-[#696969]"
                                )}
                              >
                                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                                Verified
                              </button>
                              <button
                                type="button"
                                disabled={busyKey === `tr-${rest.id}`}
                                onClick={() =>
                                  void apiMutate(
                                    `/api/admin/restaurants/${rest.id}`,
                                    "PATCH",
                                    { is_trending: !rest.is_trending },
                                    `tr-${rest.id}`,
                                    `Updated trending flag for ${rest.name}.`
                                  )
                                }
                                className={cn(
                                  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold",
                                  rest.is_trending
                                    ? "border-[#E23744]/30 bg-[#FFF0F1] text-[#E23744]"
                                    : "border-[#E8E8E8] bg-white text-[#696969]"
                                )}
                              >
                                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                                Trending
                              </button>
                              <button
                                type="button"
                                disabled={busyKey === `feat-${rest.id}`}
                                onClick={() =>
                                  void apiMutate(
                                    `/api/admin/restaurants/${rest.id}`,
                                    "PATCH",
                                    { is_featured: !rest.is_featured },
                                    `feat-${rest.id}`,
                                    `Updated featured flag for ${rest.name}.`
                                  )
                                }
                                className={cn(
                                  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold",
                                  rest.is_featured
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-[#E8E8E8] bg-white text-[#696969]"
                                )}
                              >
                                <Sparkles className="h-3 w-3" aria-hidden="true" />
                                Featured
                              </button>
                            </div>
                          </td>
                          <td data-label="Submitted" className="text-xs text-[#696969]">
                            {formatDate(rest.created_at)}
                          </td>
                          <td data-label="Actions">
                            <div className="flex flex-wrap gap-1.5">
                              {rest.status !== "approved" && (
                                <button
                                  type="button"
                                  disabled={busyKey === `app-${rest.id}`}
                                  onClick={() =>
                                    void apiMutate(
                                      `/api/admin/restaurants/${rest.id}`,
                                      "PATCH",
                                      { status: "approved", is_verified: true },
                                      `app-${rest.id}`,
                                      `${rest.name} approved and published.`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                                >
                                  <Check className="h-3 w-3" aria-hidden="true" />
                                  Approve
                                </button>
                              )}
                              {rest.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNoteModal({
                                      title: `Reject "${rest.name}"`,
                                      label: "Reason for rejection (visible to contributor)",
                                      placeholder:
                                        "e.g. Address incomplete or duplicate listing.",
                                      onSubmit: async (reason) => {
                                        await apiMutate(
                                          `/api/admin/restaurants/${rest.id}`,
                                          "PATCH",
                                          {
                                            status: "rejected",
                                            rejection_reason:
                                              reason || "Submission needs updates.",
                                          },
                                          `rej-${rest.id}`,
                                          `${rest.name} marked rejected.`
                                        );
                                      },
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#E8E8E8] bg-white px-2.5 py-1 text-xs font-semibold text-[#C91D2B] hover:bg-[#FFF0F1]"
                                >
                                  <X className="h-3 w-3" aria-hidden="true" />
                                  Reject
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    title: `Permanently delete "${rest.name}"?`,
                                    description:
                                      "This cascades and removes all associated menus, reviews, and gallery rows.",
                                    confirmLabel: "Delete Restaurant",
                                    destructive: true,
                                    onConfirm: async () => {
                                      await apiMutate(
                                        `/api/admin/restaurants/${rest.id}`,
                                        "DELETE",
                                        undefined,
                                        `del-${rest.id}`,
                                        `${rest.name} deleted.`
                                      );
                                    },
                                  })
                                }
                                aria-label={`Delete ${rest.name}`}
                                className="rounded-lg border border-[#E8E8E8] p-1 text-[#696969] hover:border-[#C91D2B] hover:text-[#C91D2B]"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. Menu Queue */}
          <div
            role="tabpanel"
            aria-labelledby="admin-tab-menu"
            data-tab-key="menu"
            hidden={activeTab !== "menu" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="pt-6 space-y-6">
              <div>
                <h2 className="mb-3 font-display text-lg font-bold text-[#1C1C1C]">
                  Menu Items Queue
                </h2>
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="menu-items-caption"
                  className="table-wrapper"
                >
                  <table className="craver-table">
                    <caption id="menu-items-caption" className="visually-hidden">
                      Community menu items moderation table
                    </caption>
                    <thead>
                      <tr>
                        <th>Dish</th>
                        <th>Restaurant</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Discovery</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.menuItems.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">{item.name}</th>
                          <td data-label="Restaurant">
                            <Link
                              href={`/restaurants/${item.restaurant?.slug || ""}?tab=menu`}
                              className="font-medium text-[#1C1C1C] hover:text-[#E23744]"
                            >
                              {item.restaurant?.name || "Restaurant"}
                            </Link>
                          </td>
                          <td data-label="Price">{formatIdr(item.price_idr)}</td>
                          <td data-label="Status">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                                statusPill(item.status)
                              )}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td data-label="Discovery">
                            <button
                              type="button"
                              onClick={() =>
                                void apiMutate(
                                  "/api/admin/menu",
                                  "PATCH",
                                  {
                                    kind: "item",
                                    id: item.id,
                                    is_featured_dish: !item.is_featured_dish,
                                  },
                                  `dish-feat-${item.id}`,
                                  "Updated home discovery dish flag."
                                )
                              }
                              className={cn(
                                "rounded border px-2 py-0.5 text-[11px] font-semibold",
                                item.is_featured_dish
                                  ? "border-[#E23744]/30 bg-[#FFF0F1] text-[#E23744]"
                                  : "border-[#E8E8E8] bg-white text-[#696969]"
                              )}
                            >
                              Homepage Pick
                            </button>
                          </td>
                          <td data-label="Actions">
                            <div className="flex flex-wrap gap-1.5">
                              {item.status !== "approved" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      "/api/admin/menu",
                                      "PATCH",
                                      { kind: "item", id: item.id, status: "approved" },
                                      `mi-app-${item.id}`,
                                      `${item.name} approved.`
                                    )
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  Approve
                                </button>
                              )}
                              {item.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      "/api/admin/menu",
                                      "PATCH",
                                      { kind: "item", id: item.id, status: "rejected" },
                                      `mi-rej-${item.id}`,
                                      `${item.name} rejected.`
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-[#C91D2B]"
                                >
                                  Reject
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  void apiMutate(
                                    "/api/admin/menu",
                                    "DELETE",
                                    { kind: "item", id: item.id },
                                    `mi-del-${item.id}`,
                                    `${item.name} deleted.`
                                  )
                                }
                                aria-label={`Delete ${item.name}`}
                                className="rounded-lg border border-[#E8E8E8] p-1 text-[#696969] hover:text-[#C91D2B]"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="mb-3 font-display text-lg font-bold text-[#1C1C1C]">
                  Pending Menu Categories
                </h2>
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="menu-cats-caption"
                  className="table-wrapper"
                >
                  <table className="craver-table">
                    <caption id="menu-cats-caption" className="visually-hidden">
                      Menu categories moderation table
                    </caption>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Restaurant</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.menuCategories
                        .filter((c) => c.status !== "approved")
                        .map((cat) => (
                          <tr key={cat.id}>
                            <th scope="row">{cat.name}</th>
                            <td data-label="Restaurant">{cat.restaurant?.name || "—"}</td>
                            <td data-label="Status">
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                                  statusPill(cat.status)
                                )}
                              >
                                {cat.status}
                              </span>
                            </td>
                            <td data-label="Actions">
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      "/api/admin/menu",
                                      "PATCH",
                                      { kind: "category", id: cat.id, status: "approved" },
                                      `mc-app-${cat.id}`,
                                      `Category "${cat.name}" approved.`
                                    )
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      "/api/admin/menu",
                                      "PATCH",
                                      { kind: "category", id: cat.id, status: "rejected" },
                                      `mc-rej-${cat.id}`,
                                      `Category "${cat.name}" rejected.`
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-[#C91D2B]"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {data.menuCategories.every((c) => c.status === "approved") && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-sm text-[#696969]">
                            No pending menu categories.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Updates Queue */}
          <div
            role="tabpanel"
            aria-labelledby="admin-tab-updates"
            data-tab-key="updates"
            hidden={activeTab !== "updates" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="pt-6">
              <div
                tabIndex={0}
                role="region"
                aria-labelledby="updates-table-caption"
                className="table-wrapper"
              >
                <table className="craver-table">
                  <caption id="updates-table-caption" className="visually-hidden">
                    Community restaurant updates moderation table
                  </caption>
                  <thead>
                    <tr>
                      <th>Update Title</th>
                      <th>Restaurant</th>
                      <th>Type</th>
                      <th>Contributor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.updates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-[#696969]">
                          No restaurant updates submitted.
                        </td>
                      </tr>
                    ) : (
                      data.updates.map((upd) => (
                        <tr key={upd.id}>
                          <th scope="row">
                            <p className="font-semibold text-[#1C1C1C]">{upd.title}</p>
                            <p className="mt-0.5 max-w-xs truncate text-xs font-normal text-[#696969]">
                              {upd.notes}
                            </p>
                          </th>
                          <td data-label="Restaurant">
                            <Link
                              href={`/restaurants/${upd.restaurant?.slug || ""}?tab=updates`}
                              className="font-medium hover:text-[#E23744]"
                            >
                              {upd.restaurant?.name || "—"}
                            </Link>
                          </td>
                          <td data-label="Type" className="capitalize">
                            {upd.update_type.replace("_", " ")}
                          </td>
                          <td data-label="Contributor" className="text-xs text-[#696969]">
                            {upd.submitter?.full_name || upd.submitter?.email || "Member"}
                          </td>
                          <td data-label="Status">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                                statusPill(upd.status)
                              )}
                            >
                              {upd.status}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <div className="flex gap-1.5">
                              {upd.status !== "approved" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      `/api/admin/updates/${upd.id}`,
                                      "PATCH",
                                      { status: "approved" },
                                      `upd-app-${upd.id}`,
                                      "Update approved."
                                    )
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  Approve
                                </button>
                              )}
                              {upd.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNoteModal({
                                      title: "Reject restaurant update",
                                      label: "Moderator note",
                                      placeholder: "Reason or clarification needed...",
                                      onSubmit: async (note) => {
                                        await apiMutate(
                                          `/api/admin/updates/${upd.id}`,
                                          "PATCH",
                                          { status: "rejected", review_notes: note },
                                          `upd-rej-${upd.id}`,
                                          "Update rejected."
                                        );
                                      },
                                    })
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-[#C91D2B]"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. Reviews & Photos */}
          <div
            role="tabpanel"
            aria-labelledby="admin-tab-reviews_photos"
            data-tab-key="reviews_photos"
            hidden={
              activeTab !== "reviews_photos"
                ? ("until-found" as unknown as boolean)
                : undefined
            }
          >
            <div className="pt-6 space-y-6">
              <div>
                <h2 className="mb-3 font-display text-lg font-bold text-[#1C1C1C]">
                  Recent &amp; Flagged Reviews
                </h2>
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="reviews-table-caption"
                  className="table-wrapper"
                >
                  <table className="craver-table">
                    <caption id="reviews-table-caption" className="visually-hidden">
                      Reviews moderation table
                    </caption>
                    <thead>
                      <tr>
                        <th>Restaurant</th>
                        <th>Author</th>
                        <th>Rating &amp; Excerpt</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reviews.map((rev) => (
                        <tr key={rev.id}>
                          <th scope="row">{rev.restaurant?.name || "Restaurant"}</th>
                          <td data-label="Author">
                            {rev.profile?.full_name || "Reviewer"}
                          </td>
                          <td data-label="Rating & Excerpt">
                            <p className="font-semibold text-[#E23744]">{rev.rating}/5 ★</p>
                            <p className="max-w-xs truncate text-xs text-[#696969]">
                              {rev.comment}
                            </p>
                          </td>
                          <td data-label="Status">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                                statusPill(rev.status)
                              )}
                            >
                              {rev.status}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <div className="flex flex-wrap gap-1.5">
                              {rev.status !== "published" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      `/api/admin/reviews/${rev.id}`,
                                      "PATCH",
                                      { status: "published" },
                                      `rev-pub-${rev.id}`,
                                      "Review restored to published."
                                    )
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  Publish
                                </button>
                              )}
                              {rev.status !== "hidden" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      `/api/admin/reviews/${rev.id}`,
                                      "PATCH",
                                      { status: "hidden" },
                                      `rev-hide-${rev.id}`,
                                      "Review hidden."
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-[#1C1C1C]"
                                >
                                  Hide
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    title: "Delete review permanently?",
                                    description:
                                      "The review will be removed and the restaurant's rating recalculated.",
                                    confirmLabel: "Delete Review",
                                    destructive: true,
                                    onConfirm: async () => {
                                      await apiMutate(
                                        `/api/admin/reviews/${rev.id}`,
                                        "DELETE",
                                        undefined,
                                        `rev-del-${rev.id}`,
                                        "Review deleted."
                                      );
                                    },
                                  })
                                }
                                aria-label="Delete review"
                                className="rounded-lg border border-[#E8E8E8] p-1 text-[#C91D2B] hover:bg-[#FFF0F1]"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="mb-3 font-display text-lg font-bold text-[#1C1C1C]">
                  Uploaded Photos
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {data.photos.slice(0, 16).map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-white"
                    >
                      <div className="aspect-[4/3] bg-[#FAFAFA]">
                        <img
                          src={photo.url}
                          alt={photo.caption || "Uploaded photo"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-semibold text-[#1C1C1C]">
                          {photo.restaurant?.name || "Restaurant"}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                              statusPill(photo.status)
                            )}
                          >
                            {photo.status}
                          </span>
                          <div className="flex gap-1">
                            {photo.status !== "approved" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void apiMutate(
                                    `/api/admin/photos/${photo.id}`,
                                    "PATCH",
                                    { status: "approved" },
                                    `ph-app-${photo.id}`,
                                    "Photo approved."
                                  )
                                }
                                className="rounded bg-[#1F7A4C] px-2 py-0.5 text-[11px] font-semibold text-white"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                void apiMutate(
                                  `/api/admin/photos/${photo.id}`,
                                  "DELETE",
                                  undefined,
                                  `ph-del-${photo.id}`,
                                  "Photo removed."
                                )
                              }
                              aria-label="Remove photo"
                              className="rounded border border-[#E8E8E8] p-1 text-[#C91D2B] hover:bg-[#FFF0F1]"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Content Reports */}
          <div
            role="tabpanel"
            aria-labelledby="admin-tab-reports"
            data-tab-key="reports"
            hidden={activeTab !== "reports" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="pt-6">
              <div
                tabIndex={0}
                role="region"
                aria-labelledby="reports-table-caption"
                className="table-wrapper"
              >
                <table className="craver-table">
                  <caption id="reports-table-caption" className="visually-hidden">
                    Reported content queue
                  </caption>
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Reason &amp; Details</th>
                      <th>Status</th>
                      <th>Reported</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-[#696969]">
                          No reported content at this time.
                        </td>
                      </tr>
                    ) : (
                      data.reports.map((rep) => (
                        <tr key={rep.id}>
                          <th scope="row" className="capitalize">
                            <span className="inline-flex items-center gap-1">
                              <Flag className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
                              {rep.target_type}
                            </span>
                          </th>
                          <td data-label="Reason & Details">
                            <p className="font-medium text-[#1C1C1C]">{rep.reason}</p>
                            {rep.details && (
                              <p className="max-w-xs truncate text-xs text-[#696969]">
                                {rep.details}
                              </p>
                            )}
                          </td>
                          <td data-label="Status">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                                statusPill(rep.status)
                              )}
                            >
                              {rep.status}
                            </span>
                          </td>
                          <td data-label="Reported" className="text-xs text-[#696969]">
                            {formatDate(rep.created_at)}
                          </td>
                          <td data-label="Actions">
                            {rep.status === "open" ? (
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNoteModal({
                                      title: "Resolve Content Report",
                                      label: "Resolution note",
                                      placeholder: "Action taken...",
                                      onSubmit: async (note) => {
                                        await apiMutate(
                                          `/api/admin/reports/${rep.id}`,
                                          "PATCH",
                                          { status: "resolved", resolution_note: note },
                                          `rep-res-${rep.id}`,
                                          "Report resolved."
                                        );
                                      },
                                    })
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  Resolve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      `/api/admin/reports/${rep.id}`,
                                      "PATCH",
                                      { status: "dismissed" },
                                      `rep-dis-${rep.id}`,
                                      "Report dismissed."
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-medium text-[#696969]"
                                >
                                  Dismiss
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-[#696969]">
                                {rep.resolution_note || "Closed"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 6. Users */}
          <div
            role="tabpanel"
            aria-labelledby="admin-tab-users"
            data-tab-key="users"
            hidden={activeTab !== "users" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="pt-6">
              <div
                tabIndex={0}
                role="region"
                aria-labelledby="users-table-caption"
                className="table-wrapper"
              >
                <table className="craver-table">
                  <caption id="users-table-caption" className="visually-hidden">
                    Registered community accounts
                  </caption>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>City</th>
                      <th>Role</th>
                      <th>State</th>
                      <th>Joined</th>
                      <th>Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => {
                      const isSelf = u.id === currentAdminId;
                      return (
                        <tr key={u.id}>
                          <th scope="row">
                            <p className="font-semibold text-[#1C1C1C]">
                              {u.full_name || "Member"}
                            </p>
                            <p className="text-xs font-normal text-[#696969]">{u.email}</p>
                          </th>
                          <td data-label="City">{u.city}</td>
                          <td data-label="Role">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                                u.role === "admin"
                                  ? "border-[#E23744]/30 bg-[#FFF0F1] text-[#C91D2B]"
                                  : "border-[#E8E8E8] bg-[#FAFAFA] text-[#1C1C1C]"
                              )}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td data-label="State">
                            {u.is_suspended ? (
                              <span className="text-xs font-semibold text-[#C91D2B]">
                                Suspended
                              </span>
                            ) : (
                              <span className="text-xs text-[#1F7A4C]">Active</span>
                            )}
                          </td>
                          <td data-label="Joined" className="text-xs text-[#696969]">
                            {formatDate(u.created_at)}
                          </td>
                          <td data-label="Controls">
                            {isSelf ? (
                              <span className="text-xs text-[#696969]">Current admin</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmState({
                                      title:
                                        u.role === "admin"
                                          ? `Demote ${u.full_name || u.email} to user?`
                                          : `Promote ${u.full_name || u.email} to admin?`,
                                      description:
                                        "Administrator role grants access to the server-side moderation console.",
                                      confirmLabel: "Update Role",
                                      onConfirm: async () => {
                                        await apiMutate(
                                          `/api/admin/users/${u.id}`,
                                          "PATCH",
                                          {
                                            role: u.role === "admin" ? "user" : "admin",
                                          },
                                          `usr-role-${u.id}`,
                                          "User role updated."
                                        );
                                      },
                                    })
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-medium text-[#1C1C1C] hover:border-[#E23744]"
                                >
                                  {u.role === "admin" ? "Make User" : "Make Admin"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      `/api/admin/users/${u.id}`,
                                      "PATCH",
                                      { is_suspended: !u.is_suspended },
                                      `usr-susp-${u.id}`,
                                      u.is_suspended
                                        ? "User unsuspended."
                                        : "User suspended."
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-medium text-[#C91D2B] hover:bg-[#FFF0F1]"
                                >
                                  {u.is_suspended ? "Unsuspend" : "Suspend"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 7. Audit Logs */}
          <div
            role="tabpanel"
            aria-labelledby="admin-tab-audit"
            data-tab-key="audit"
            hidden={activeTab !== "audit" ? ("until-found" as unknown as boolean) : undefined}
          >
            <div className="pt-6">
              <div
                tabIndex={0}
                role="region"
                aria-labelledby="audit-table-caption"
                className="table-wrapper"
              >
                <table className="craver-table">
                  <caption id="audit-table-caption" className="visually-hidden">
                    Administrator moderation audit log
                  </caption>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Entity</th>
                      <th>Details</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-[#696969]">
                          Moderation audit events will be recorded here automatically.
                        </td>
                      </tr>
                    ) : (
                      data.auditLogs.map((log) => (
                        <tr key={log.id}>
                          <th scope="row" className="font-mono text-xs">
                            {log.action}
                          </th>
                          <td data-label="Actor">
                            {log.actor?.full_name || log.actor?.email || "System"}
                          </td>
                          <td data-label="Entity" className="capitalize">
                            {log.entity_type}
                          </td>
                          <td data-label="Details" className="max-w-xs truncate font-mono text-xs text-[#696969]">
                            {JSON.stringify(log.metadata)}
                          </td>
                          <td data-label="When" className="text-xs text-[#696969]">
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Native <dialog> for moderation rejection / resolution note */}
      <dialog
        ref={noteDialogRef}
        aria-labelledby={noteHeadingId}
        {...({ closedby: "any" } as Record<string, string>)}
        className="w-full"
      >
        <div className="p-6">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
            <div>
              <h2
                id={noteHeadingId}
                className="font-display text-lg font-bold text-[#1C1C1C]"
              >
                {noteModal?.title || "Moderation Note"}
              </h2>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="moderation-note-input" className="text-sm font-medium text-[#1C1C1C]">
              {noteModal?.label || "Note"}
            </label>
            <textarea
              id="moderation-note-input"
              rows={3}
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={noteModal?.placeholder}
              className="w-full rounded-xl border border-[#E8E8E8] p-3 text-sm text-[#1C1C1C]"
            />
          </div>

          <form method="dialog" className="mt-6 flex justify-end gap-3">
            <button
              type="submit"
              value="cancel"
              disabled={noteBusy}
              className="min-h-10 rounded-lg border border-[#E8E8E8] px-4 text-sm font-medium text-[#1C1C1C] hover:bg-[#FAFAFA]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={noteBusy}
              onClick={async () => {
                if (!noteModal) return;
                setNoteBusy(true);
                try {
                  await noteModal.onSubmit(noteText.trim());
                  noteDialogRef.current?.close("confirm");
                } finally {
                  setNoteBusy(false);
                }
              }}
              className="min-h-10 rounded-lg bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
            >
              {noteBusy ? "Saving..." : "Save Decision"}
            </button>
          </form>
        </div>
      </dialog>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel ?? "Confirm"}
        destructive={confirmState?.destructive}
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

