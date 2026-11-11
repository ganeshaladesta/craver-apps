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
import { formatT, translateCategory } from "@/lib/i18n/dictionary";
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

const ADMIN_TAB_KEYS: AdminTab[] = [
  "restaurants",
  "menu",
  "updates",
  "reviews_photos",
  "reports",
  "users",
  "audit",
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
  const { showToast, locale, t } = useCraver();
  const adminTabs = ADMIN_TAB_KEYS.map((key) => ({
    key,
    label: t.admin.tabs[key],
  }));
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
      if (key && ADMIN_TAB_KEYS.includes(key)) {
        setActiveTab(key);
      }
    };
    container.addEventListener("beforematch", onBeforeMatch);
    return () => container.removeEventListener("beforematch", onBeforeMatch);
  }, []);

  if (!configured || !serviceRoleConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E8E8E8] bg-[#FFF6E9] p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-[#E23744]" aria-hidden="true" />
          <h1 className="mt-3 font-display text-2xl font-bold text-[#1C1C1C]">
            {t.admin.setupTitle}
          </h1>
          <p className="mt-2 text-sm text-[#696969]">{t.admin.setupDesc}</p>
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
            {t.admin.accessDeniedTitle}
          </h1>
          <p className="mt-2 text-sm text-[#696969]">{t.admin.accessDeniedDesc}</p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-[#E23744] px-4 text-sm font-semibold text-white hover:bg-[#C91D2B]"
          >
            {t.admin.returnHome}
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
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % ADMIN_TAB_KEYS.length;
    else if (e.key === "ArrowLeft")
      nextIdx = (idx - 1 + ADMIN_TAB_KEYS.length) % ADMIN_TAB_KEYS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = ADMIN_TAB_KEYS.length - 1;
    if (nextIdx >= 0) {
      e.preventDefault();
      const targetKey = ADMIN_TAB_KEYS[nextIdx];
      selectTab(targetKey);
      tabRefs.current[targetKey]?.focus();
    }
  };

  const getStatusLabel = (status: string) =>
    t.common.statusLabels[status as keyof typeof t.common.statusLabels] ?? status;

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
    <div className="bg-white">
      <div className="border-b border-[#EEEEEE] bg-[#FFF6E9] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E23744]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {t.admin.eyebrow}
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
                {t.admin.title}
              </h1>
              <p className="mt-1 text-sm text-[#696969]">{t.admin.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => void reloadOverview()}
              disabled={refreshing}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#EEEEEE] bg-white px-4 text-sm font-medium text-[#1C1C1C] transition hover:border-[#E23744] disabled:opacity-60"
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
                aria-hidden="true"
              />
              {t.admin.refreshQueues}
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
              className="rounded-2xl border border-[#EEEEEE] bg-white p-4 text-left transition hover:border-[#E23744]/40"
            >
              <p className="text-xs font-medium text-[#696969]">{t.admin.kpiPendingRest}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-[#E23744]">
                {pendingRestaurantsCount}
              </p>
            </button>
            <button
              type="button"
              onClick={() => selectTab("menu")}
              className="rounded-2xl border border-[#EEEEEE] bg-white p-4 text-left transition hover:border-[#E23744]/40"
            >
              <p className="text-xs font-medium text-[#696969]">{t.admin.kpiPendingMenu}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-[#1C1C1C]">
                {pendingMenuCount}
              </p>
            </button>
            <button
              type="button"
              onClick={() => selectTab("updates")}
              className="rounded-2xl border border-[#EEEEEE] bg-white p-4 text-left transition hover:border-[#E23744]/40"
            >
              <p className="text-xs font-medium text-[#696969]">{t.admin.kpiPendingUpdates}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-[#1C1C1C]">
                {pendingUpdatesCount}
              </p>
            </button>
            <button
              type="button"
              onClick={() => selectTab("reports")}
              className="rounded-2xl border border-[#EEEEEE] bg-white p-4 text-left transition hover:border-[#E23744]/40"
            >
              <p className="text-xs font-medium text-[#696969]">{t.admin.kpiOpenReports}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-[#C91D2B]">
                {openReportsCount}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Queues */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div role="tablist" aria-label={t.admin.tabsAria} className="craver-tablist">
          {adminTabs.map((tab, idx) => (
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
                        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                        restaurantFilter === status
                          ? "border-[#E23744] bg-[#E23744] text-white"
                          : "border-[#E8E8E8] bg-white text-[#1C1C1C] hover:border-[#E23744]/50"
                      )}
                    >
                      {status === "all" ? t.admin.all : getStatusLabel(status)} (
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
                    {t.admin.tabs.restaurants}
                  </caption>
                  <thead>
                    <tr>
                      <th>{t.admin.headers.restaurant}</th>
                      <th>{t.admin.headers.areaCuisine}</th>
                      <th>{t.admin.headers.status}</th>
                      <th>{t.admin.headers.highlights}</th>
                      <th>{t.admin.headers.submitted}</th>
                      <th>{t.admin.headers.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-sm text-[#696969] py-8">
                          {t.admin.empty.noRestaurants}
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
                                {formatIdr(rest.average_price_idr)} {t.common.perPerson}
                              </p>
                            </div>
                          </th>
                          <td data-label={t.admin.headers.areaCuisine}>
                            <p className="font-medium text-[#1C1C1C]">{rest.district}</p>
                            <p className="text-xs text-[#696969]">
                              {translateCategory(rest.primary_cuisine, locale)}
                            </p>
                          </td>
                          <td data-label={t.admin.headers.status}>
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                statusPill(rest.status)
                              )}
                            >
                              {getStatusLabel(rest.status)}
                            </span>
                          </td>
                          <td data-label={t.admin.headers.highlights}>
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
                                    `${t.admin.badges.verified}: ${rest.name}`
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
                                {t.admin.badges.verified}
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
                                    `${t.admin.badges.trending}: ${rest.name}`
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
                                {t.admin.badges.trending}
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
                                    `${t.admin.badges.featured}: ${rest.name}`
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
                                {t.admin.badges.featured}
                              </button>
                            </div>
                          </td>
                          <td data-label={t.admin.headers.submitted} className="text-xs text-[#696969]">
                            {formatDate(rest.created_at, locale)}
                          </td>
                          <td data-label={t.admin.headers.actions}>
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
                                      `${rest.name} — ${getStatusLabel("approved")}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                                >
                                  <Check className="h-3 w-3" aria-hidden="true" />
                                  {t.admin.approve}
                                </button>
                              )}
                              {rest.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNoteModal({
                                      title: formatT(t.admin.modals.rejectRestTitle, {
                                        name: rest.name,
                                      }),
                                      label: t.admin.modals.rejectRestLabel,
                                      placeholder: t.admin.modals.rejectRestPlaceholder,
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
                                          `${rest.name} — ${getStatusLabel("rejected")}`
                                        );
                                      },
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#E8E8E8] bg-white px-2.5 py-1 text-xs font-semibold text-[#C91D2B] hover:bg-[#FFF0F1]"
                                >
                                  <X className="h-3 w-3" aria-hidden="true" />
                                  {t.admin.reject}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    title: formatT(t.admin.modals.deleteRestTitle, {
                                      name: rest.name,
                                    }),
                                    description: t.admin.modals.deleteRestDesc,
                                    confirmLabel: t.admin.modals.deleteRestBtn,
                                    destructive: true,
                                    onConfirm: async () => {
                                      await apiMutate(
                                        `/api/admin/restaurants/${rest.id}`,
                                        "DELETE",
                                        undefined,
                                        `del-${rest.id}`,
                                        `${rest.name} — ${t.common.delete}`
                                      );
                                    },
                                  })
                                }
                                aria-label={`${t.common.delete} ${rest.name}`}
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
                  {t.admin.sections.menuItemsQueue}
                </h2>
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="menu-items-caption"
                  className="table-wrapper"
                >
                  <table className="craver-table">
                    <caption id="menu-items-caption" className="visually-hidden">
                      {t.admin.sections.menuItemsQueue}
                    </caption>
                    <thead>
                      <tr>
                        <th>{t.admin.headers.dish}</th>
                        <th>{t.admin.headers.restaurant}</th>
                        <th>{t.admin.headers.price}</th>
                        <th>{t.admin.headers.status}</th>
                        <th>{t.admin.headers.discovery}</th>
                        <th>{t.admin.headers.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.menuItems.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">{item.name}</th>
                          <td data-label={t.admin.headers.restaurant}>
                            <Link
                              href={`/restaurants/${item.restaurant?.slug || ""}?tab=menu`}
                              className="font-medium text-[#1C1C1C] hover:text-[#E23744]"
                            >
                              {item.restaurant?.name || t.admin.headers.restaurant}
                            </Link>
                          </td>
                          <td data-label={t.admin.headers.price}>{formatIdr(item.price_idr)}</td>
                          <td data-label={t.admin.headers.status}>
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                                statusPill(item.status)
                              )}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td data-label={t.admin.headers.discovery}>
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
                                  `${t.admin.badges.homepagePick}: ${item.name}`
                                )
                              }
                              className={cn(
                                "rounded border px-2 py-0.5 text-[11px] font-semibold",
                                item.is_featured_dish
                                  ? "border-[#E23744]/30 bg-[#FFF0F1] text-[#E23744]"
                                  : "border-[#E8E8E8] bg-white text-[#696969]"
                              )}
                            >
                              {t.admin.badges.homepagePick}
                            </button>
                          </td>
                          <td data-label={t.admin.headers.actions}>
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
                                      `${item.name} — ${getStatusLabel("approved")}`
                                    )
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  {t.admin.approve}
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
                                      `${item.name} — ${getStatusLabel("rejected")}`
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-[#C91D2B]"
                                >
                                  {t.admin.reject}
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
                                    `${item.name} — ${t.common.delete}`
                                  )
                                }
                                aria-label={`${t.common.delete} ${item.name}`}
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
                  {t.admin.sections.pendingMenuCats}
                </h2>
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="menu-cats-caption"
                  className="table-wrapper"
                >
                  <table className="craver-table">
                    <caption id="menu-cats-caption" className="visually-hidden">
                      {t.admin.sections.pendingMenuCats}
                    </caption>
                    <thead>
                      <tr>
                        <th>{t.admin.headers.category}</th>
                        <th>{t.admin.headers.restaurant}</th>
                        <th>{t.admin.headers.status}</th>
                        <th>{t.admin.headers.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.menuCategories
                        .filter((c) => c.status !== "approved")
                        .map((cat) => (
                          <tr key={cat.id}>
                            <th scope="row">{cat.name}</th>
                            <td data-label={t.admin.headers.restaurant}>
                              {cat.restaurant?.name || "—"}
                            </td>
                            <td data-label={t.admin.headers.status}>
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                                  statusPill(cat.status)
                                )}
                              >
                                {getStatusLabel(cat.status)}
                              </span>
                            </td>
                            <td data-label={t.admin.headers.actions}>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      "/api/admin/menu",
                                      "PATCH",
                                      { kind: "category", id: cat.id, status: "approved" },
                                      `mc-app-${cat.id}`,
                                      `${cat.name} — ${getStatusLabel("approved")}`
                                    )
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  {t.admin.approve}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      "/api/admin/menu",
                                      "PATCH",
                                      { kind: "category", id: cat.id, status: "rejected" },
                                      `mc-rej-${cat.id}`,
                                      `${cat.name} — ${getStatusLabel("rejected")}`
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-[#C91D2B]"
                                >
                                  {t.admin.reject}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {data.menuCategories.every((c) => c.status === "approved") && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-sm text-[#696969]">
                            {t.admin.empty.noCategories}
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
                    {t.admin.tabs.updates}
                  </caption>
                  <thead>
                    <tr>
                      <th>{t.admin.headers.updateTitle}</th>
                      <th>{t.admin.headers.restaurant}</th>
                      <th>{t.admin.headers.type}</th>
                      <th>{t.admin.headers.contributor}</th>
                      <th>{t.admin.headers.status}</th>
                      <th>{t.admin.headers.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.updates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-[#696969]">
                          {t.admin.empty.noUpdates}
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
                          <td data-label={t.admin.headers.restaurant}>
                            <Link
                              href={`/restaurants/${upd.restaurant?.slug || ""}?tab=updates`}
                              className="font-medium hover:text-[#E23744]"
                            >
                              {upd.restaurant?.name || "—"}
                            </Link>
                          </td>
                          <td data-label={t.admin.headers.type}>
                            {t.restaurant.updateTypes[
                              upd.update_type as keyof typeof t.restaurant.updateTypes
                            ] ?? upd.update_type.replace("_", " ")}
                          </td>
                          <td data-label={t.admin.headers.contributor} className="text-xs text-[#696969]">
                            {upd.submitter?.full_name ||
                              upd.submitter?.email ||
                              t.admin.headers.member}
                          </td>
                          <td data-label={t.admin.headers.status}>
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                                statusPill(upd.status)
                              )}
                            >
                              {getStatusLabel(upd.status)}
                            </span>
                          </td>
                          <td data-label={t.admin.headers.actions}>
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
                                      `${upd.title} — ${getStatusLabel("approved")}`
                                    )
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  {t.admin.approve}
                                </button>
                              )}
                              {upd.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNoteModal({
                                      title: t.admin.modals.rejectUpdateTitle,
                                      label: t.admin.modals.modNoteLabel,
                                      placeholder: t.admin.modals.modNotePlaceholder,
                                      onSubmit: async (note) => {
                                        await apiMutate(
                                          `/api/admin/updates/${upd.id}`,
                                          "PATCH",
                                          { status: "rejected", review_notes: note },
                                          `upd-rej-${upd.id}`,
                                          `${upd.title} — ${getStatusLabel("rejected")}`
                                        );
                                      },
                                    })
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-[#C91D2B]"
                                >
                                  {t.admin.reject}
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
                  {t.admin.sections.recentReviews}
                </h2>
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="reviews-table-caption"
                  className="table-wrapper"
                >
                  <table className="craver-table">
                    <caption id="reviews-table-caption" className="visually-hidden">
                      {t.admin.sections.recentReviews}
                    </caption>
                    <thead>
                      <tr>
                        <th>{t.admin.headers.restaurant}</th>
                        <th>{t.admin.headers.author}</th>
                        <th>{t.admin.headers.ratingExcerpt}</th>
                        <th>{t.admin.headers.status}</th>
                        <th>{t.admin.headers.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reviews.map((rev) => (
                        <tr key={rev.id}>
                          <th scope="row">
                            {rev.restaurant?.name || t.admin.headers.restaurant}
                          </th>
                          <td data-label={t.admin.headers.author}>
                            {rev.profile?.full_name || t.restaurant.dinerFallback}
                          </td>
                          <td data-label={t.admin.headers.ratingExcerpt}>
                            <p className="font-semibold text-[#E23744]">{rev.rating}/5 ★</p>
                            <p className="max-w-xs truncate text-xs text-[#696969]">
                              {rev.comment}
                            </p>
                          </td>
                          <td data-label={t.admin.headers.status}>
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                                statusPill(rev.status)
                              )}
                            >
                              {getStatusLabel(rev.status)}
                            </span>
                          </td>
                          <td data-label={t.admin.headers.actions}>
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
                                      getStatusLabel("published")
                                    )
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  {t.admin.publish}
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
                                      getStatusLabel("hidden")
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-[#1C1C1C]"
                                >
                                  {t.admin.hide}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    title: t.admin.modals.deleteReviewTitle,
                                    description: t.admin.modals.deleteReviewDesc,
                                    confirmLabel: t.admin.modals.deleteReviewBtn,
                                    destructive: true,
                                    onConfirm: async () => {
                                      await apiMutate(
                                        `/api/admin/reviews/${rev.id}`,
                                        "DELETE",
                                        undefined,
                                        `rev-del-${rev.id}`,
                                        t.common.delete
                                      );
                                    },
                                  })
                                }
                                aria-label={t.admin.modals.deleteReviewBtn}
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
                  {t.admin.sections.uploadedPhotos}
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
                          alt={photo.caption || t.admin.sections.uploadedPhotos}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-semibold text-[#1C1C1C]">
                          {photo.restaurant?.name || t.admin.headers.restaurant}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              statusPill(photo.status)
                            )}
                          >
                            {getStatusLabel(photo.status)}
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
                                    getStatusLabel("approved")
                                  )
                                }
                                className="rounded bg-[#1F7A4C] px-2 py-0.5 text-[11px] font-semibold text-white"
                              >
                                {t.admin.approve}
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
                                  t.common.delete
                                )
                              }
                              aria-label={t.common.delete}
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
                    {t.admin.tabs.reports}
                  </caption>
                  <thead>
                    <tr>
                      <th>{t.admin.headers.target}</th>
                      <th>{t.admin.headers.reasonDetails}</th>
                      <th>{t.admin.headers.status}</th>
                      <th>{t.admin.headers.reported}</th>
                      <th>{t.admin.headers.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-[#696969]">
                          {t.admin.empty.noReports}
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
                          <td data-label={t.admin.headers.reasonDetails}>
                            <p className="font-medium text-[#1C1C1C]">{rep.reason}</p>
                            {rep.details && (
                              <p className="max-w-xs truncate text-xs text-[#696969]">
                                {rep.details}
                              </p>
                            )}
                          </td>
                          <td data-label={t.admin.headers.status}>
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                                statusPill(rep.status)
                              )}
                            >
                              {getStatusLabel(rep.status)}
                            </span>
                          </td>
                          <td data-label={t.admin.headers.reported} className="text-xs text-[#696969]">
                            {formatDate(rep.created_at, locale)}
                          </td>
                          <td data-label={t.admin.headers.actions}>
                            {rep.status === "open" ? (
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNoteModal({
                                      title: t.admin.modals.resolveTitle,
                                      label: t.admin.modals.resolveLabel,
                                      placeholder: t.admin.modals.resolvePlaceholder,
                                      onSubmit: async (note) => {
                                        await apiMutate(
                                          `/api/admin/reports/${rep.id}`,
                                          "PATCH",
                                          { status: "resolved", resolution_note: note },
                                          `rep-res-${rep.id}`,
                                          getStatusLabel("resolved")
                                        );
                                      },
                                    })
                                  }
                                  className="rounded-lg bg-[#1F7A4C] px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                  {t.admin.resolve}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      `/api/admin/reports/${rep.id}`,
                                      "PATCH",
                                      { status: "dismissed" },
                                      `rep-dis-${rep.id}`,
                                      getStatusLabel("dismissed")
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-medium text-[#696969]"
                                >
                                  {t.admin.dismiss}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-[#696969]">
                                {rep.resolution_note || t.admin.badges.closed}
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
                    {t.admin.tabs.users}
                  </caption>
                  <thead>
                    <tr>
                      <th>{t.admin.headers.member}</th>
                      <th>{t.admin.headers.city}</th>
                      <th>{t.admin.headers.role}</th>
                      <th>{t.admin.headers.state}</th>
                      <th>{t.admin.headers.joined}</th>
                      <th>{t.admin.headers.controls}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => {
                      const isSelf = u.id === currentAdminId;
                      return (
                        <tr key={u.id}>
                          <th scope="row">
                            <p className="font-semibold text-[#1C1C1C]">
                              {u.full_name || t.admin.headers.member}
                            </p>
                            <p className="text-xs font-normal text-[#696969]">{u.email}</p>
                          </th>
                          <td data-label={t.admin.headers.city}>{u.city}</td>
                          <td data-label={t.admin.headers.role}>
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                                u.role === "admin"
                                  ? "border-[#E23744]/30 bg-[#FFF0F1] text-[#C91D2B]"
                                  : "border-[#E8E8E8] bg-[#FAFAFA] text-[#1C1C1C]"
                              )}
                            >
                              {u.role === "admin"
                                ? t.admin.badges.adminRole
                                : t.admin.badges.userRole}
                            </span>
                          </td>
                          <td data-label={t.admin.headers.state}>
                            {u.is_suspended ? (
                              <span className="text-xs font-semibold text-[#C91D2B]">
                                {t.admin.badges.suspended}
                              </span>
                            ) : (
                              <span className="text-xs text-[#1F7A4C]">
                                {t.admin.badges.active}
                              </span>
                            )}
                          </td>
                          <td data-label={t.admin.headers.joined} className="text-xs text-[#696969]">
                            {formatDate(u.created_at, locale)}
                          </td>
                          <td data-label={t.admin.headers.controls}>
                            {isSelf ? (
                              <span className="text-xs text-[#696969]">
                                {t.admin.badges.currentAdmin}
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmState({
                                      title: formatT(
                                        u.role === "admin"
                                          ? t.admin.modals.demoteTitle
                                          : t.admin.modals.promoteTitle,
                                        { name: u.full_name || u.email }
                                      ),
                                      description: t.admin.modals.roleDesc,
                                      confirmLabel: t.admin.modals.updateRoleBtn,
                                      onConfirm: async () => {
                                        await apiMutate(
                                          `/api/admin/users/${u.id}`,
                                          "PATCH",
                                          {
                                            role: u.role === "admin" ? "user" : "admin",
                                          },
                                          `usr-role-${u.id}`,
                                          t.admin.modals.updateRoleBtn
                                        );
                                      },
                                    })
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-medium text-[#1C1C1C] hover:border-[#E23744]"
                                >
                                  {u.role === "admin" ? t.admin.makeUser : t.admin.makeAdmin}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void apiMutate(
                                      `/api/admin/users/${u.id}`,
                                      "PATCH",
                                      { is_suspended: !u.is_suspended },
                                      `usr-susp-${u.id}`,
                                      u.is_suspended ? t.admin.unsuspend : t.admin.suspend
                                    )
                                  }
                                  className="rounded-lg border border-[#E8E8E8] px-2.5 py-1 text-xs font-medium text-[#C91D2B] hover:bg-[#FFF0F1]"
                                >
                                  {u.is_suspended ? t.admin.unsuspend : t.admin.suspend}
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
                    {t.admin.tabs.audit}
                  </caption>
                  <thead>
                    <tr>
                      <th>{t.admin.headers.action}</th>
                      <th>{t.admin.headers.actor}</th>
                      <th>{t.admin.headers.entity}</th>
                      <th>{t.admin.headers.details}</th>
                      <th>{t.admin.headers.when}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-[#696969]">
                          {t.admin.empty.noAudit}
                        </td>
                      </tr>
                    ) : (
                      data.auditLogs.map((log) => (
                        <tr key={log.id}>
                          <th scope="row" className="font-mono text-xs">
                            {log.action}
                          </th>
                          <td data-label={t.admin.headers.actor}>
                            {log.actor?.full_name || log.actor?.email || "System"}
                          </td>
                          <td data-label={t.admin.headers.entity} className="capitalize">
                            {log.entity_type}
                          </td>
                          <td
                            data-label={t.admin.headers.details}
                            className="max-w-xs truncate font-mono text-xs text-[#696969]"
                          >
                            {JSON.stringify(log.metadata)}
                          </td>
                          <td data-label={t.admin.headers.when} className="text-xs text-[#696969]">
                            {formatDate(log.created_at, locale)}
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
                {noteModal?.title || t.admin.modals.modNoteLabel}
              </h2>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="moderation-note-input" className="text-sm font-medium text-[#1C1C1C]">
              {noteModal?.label || t.admin.modals.modNoteLabel}
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
              {t.common.cancel}
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
              {noteBusy ? t.common.saving : t.admin.saveDecision}
            </button>
          </form>
        </div>
      </dialog>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel ?? t.common.confirm}
        cancelLabel={t.common.cancel}
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

