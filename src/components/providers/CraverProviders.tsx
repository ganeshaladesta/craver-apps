"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { UnframerProvider } from "unframer";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { NotificationItem, Profile } from "@/types/database";

type ToastKind = "success" | "error" | "info";

interface ToastEntry {
  id: number;
  message: string;
  kind: ToastKind;
}

interface CraverContextValue {
  configured: boolean;
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  favoriteIds: string[];
  toggleFavorite: (restaurantId: string) => Promise<boolean>;
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  showToast: (message: string, kind?: ToastKind) => void;
  refreshSessionData: () => Promise<void>;
}

const CraverContext = createContext<CraverContextValue | null>(null);

interface CraverProvidersProps {
  children: ReactNode;
  initialConfigured: boolean;
  initialUser: { id: string; email: string | null } | null;
  initialProfile: Profile | null;
  initialFavoriteIds: string[];
  initialNotifications: NotificationItem[];
}

export function CraverProviders({
  children,
  initialConfigured,
  initialUser,
  initialProfile,
  initialFavoriteIds,
  initialNotifications,
}: CraverProvidersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [selectedArea, setSelectedAreaState] = useState("All Jakarta");
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => {
    setUser(initialUser);
    setProfile(initialProfile);
    setFavoriteIds(initialFavoriteIds);
    setNotifications(initialNotifications);
  }, [initialUser, initialProfile, initialFavoriteIds, initialNotifications]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("craver:area");
      if (saved) setSelectedAreaState(saved);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setSelectedArea = useCallback((area: string) => {
    setSelectedAreaState(area);
    try {
      window.localStorage.setItem("craver:area", area);
    } catch {
      // ignore storage errors
    }
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const refreshSessionData = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const {
      data: { user: activeUser },
    } = await supabase.auth.getUser();

    if (!activeUser) {
      setUser(null);
      setProfile(null);
      setFavoriteIds([]);
      setNotifications([]);
      return;
    }

    setUser({ id: activeUser.id, email: activeUser.email ?? null });

    const [profileRes, favoritesRes, notificationsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", activeUser.id).maybeSingle(),
      supabase
        .from("favorites")
        .select("restaurant_id")
        .eq("user_id", activeUser.id),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", activeUser.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    setProfile((profileRes.data ?? null) as Profile | null);
    setFavoriteIds(
      (favoritesRes.data ?? []).map((row: { restaurant_id: string }) => row.restaurant_id)
    );
    setNotifications((notificationsRes.data ?? []) as NotificationItem[]);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSessionData();
    });
    return () => subscription.unsubscribe();
  }, [refreshSessionData]);

  const toggleFavorite = useCallback(
    async (restaurantId: string): Promise<boolean> => {
      if (!initialConfigured) {
        showToast(
          "Configure Supabase credentials in .env.local to save favorites.",
          "info"
        );
        return false;
      }

      if (!user) {
        showToast("Sign in to save favorite restaurants.", "info");
        router.push(`/auth/login?next=${encodeURIComponent(pathname || "/")}`);
        return false;
      }

      const supabase = createSupabaseBrowserClient();
      if (!supabase) return false;

      const currentlySaved = favoriteIds.includes(restaurantId);
      setFavoriteIds((prev) =>
        currentlySaved
          ? prev.filter((id) => id !== restaurantId)
          : [...prev, restaurantId]
      );

      if (currentlySaved) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurantId);
        if (error) {
          setFavoriteIds((prev) => [...prev, restaurantId]);
          showToast(error.message, "error");
          return false;
        }
        showToast("Removed from saved restaurants.", "info");
        return false;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, restaurant_id: restaurantId });
        if (error) {
          setFavoriteIds((prev) => prev.filter((id) => id !== restaurantId));
          showToast(error.message, "error");
          return false;
        }
        showToast("Saved to your favorite places.", "success");
        return true;
      }
    },
    [favoriteIds, initialConfigured, pathname, router, showToast, user]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase || !user) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", user.id);
    },
    [user]
  );

  const markAllNotificationsRead = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const value = useMemo<CraverContextValue>(
    () => ({
      configured: initialConfigured,
      user,
      profile,
      selectedArea,
      setSelectedArea,
      favoriteIds,
      toggleFavorite,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      showToast,
      refreshSessionData,
    }),
    [
      initialConfigured,
      user,
      profile,
      selectedArea,
      setSelectedArea,
      favoriteIds,
      toggleFavorite,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      showToast,
      refreshSessionData,
    ]
  );

  return (
    <UnframerProvider navigate={(path: string) => router.push(path)}>
      <CraverContext.Provider value={value}>
        {children}

        {/* Accessible toast notifications */}
        <div
          aria-live="polite"
          role="status"
          className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)]"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[#E8E8E8] bg-white px-4 py-3 shadow-lg"
            >
              {toast.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1F7A4C]" aria-hidden="true" />
              ) : toast.kind === "error" ? (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#C91D2B]" aria-hidden="true" />
              ) : (
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#E23744]" aria-hidden="true" />
              )}
              <p className="flex-1 text-sm font-medium text-[#1C1C1C]">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() =>
                  setToasts((prev) => prev.filter((item) => item.id !== toast.id))
                }
                aria-label="Dismiss notification"
                className="rounded p-0.5 text-[#696969] hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </CraverContext.Provider>
    </UnframerProvider>
  );
}

export function useCraver() {
  const ctx = useContext(CraverContext);
  if (!ctx) {
    throw new Error("useCraver must be used inside CraverProviders");
  }
  return ctx;
}

