"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  ChevronDown,
  LogOut,
  MapPin,
  PlusCircle,
  ShieldCheck,
  User,
} from "lucide-react";
import { MorphingMegaMenu, MotionMinimalNavs } from "@/components/framer/FramerImports";
import { CraverLogo } from "@/components/ui/CraverLogo";
import { useCraver } from "@/components/providers/CraverProviders";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, JAKARTA_AREAS } from "@/lib/utils";

const PRIMARY_LINKS = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Collections", href: "/collections" },
  { label: "Contribute", href: "/contribute" },
] as const;

function isPathMatch(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    profile,
    selectedArea,
    setSelectedArea,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    showToast,
    refreshSessionData,
  } = useCraver();

  const [areaOpen, setAreaOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const minimalNavHostRef = useRef<HTMLDivElement>(null);

  const isActivePath = (href: string) => isPathMatch(pathname, href);

  const closeMinimalNavIfOpen = () => {
    const host = minimalNavHostRef.current;
    if (!host) return;
    const isOpen = Boolean(host.querySelector('[data-framer-name="Toggle Label Close"]'));
    const toggle = host.querySelector('[data-framer-name="Menu Toggle"]') as HTMLElement | null;
    if (isOpen && toggle) {
      toggle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, isPrimary: true }));
      toggle.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, isPrimary: true }));
      toggle.click();
    }
  };

  // Close popovers on outside click or route transition
  useEffect(() => {
    setAreaOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setAreaOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
      if (!minimalNavHostRef.current?.contains(e.target as Node)) {
        closeMinimalNavIfOpen();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAreaOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
        closeMinimalNavIfOpen();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Synchronize Framer MotionMinimalNavs internal MenuLink & LegalLink nodes to CRAVER routes
  useEffect(() => {
    const host = minimalNavHostRef.current;
    if (!host) return;

    const menuMap = [
      { container: "Menu Link 1", label: "Home", href: "/" },
      { container: "Menu Link 2", label: "Explore", href: "/explore" },
      { container: "Menu Link 3", label: "Collections", href: "/collections" },
      { container: "Menu Link 4", label: "Contribute", href: "/contribute" },
      { container: "Legal Link 1", label: "Privacy Policy", href: "/privacy" },
      { container: "Legal Link 2", label: "Terms of Service", href: "/terms" },
    ];

    const patchAnchorText = (anchor: HTMLAnchorElement, label: string) => {
      // Mutate only the existing leaf Text node inside <a> so React/Framer keeps its <p><a> child intact
      const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
      const firstText = walker.nextNode();
      if (firstText) {
        if (firstText.nodeValue !== label) {
          firstText.nodeValue = label;
        }
        let extra = walker.nextNode();
        while (extra) {
          if (extra.nodeValue !== "") extra.nodeValue = "";
          extra = walker.nextNode();
        }
      }
    };

    const patchDom = () => {
      for (const item of menuMap) {
        const container = host.querySelector(`[data-framer-name="${item.container}"]`);
        if (!container) continue;
        const anchors = container.querySelectorAll("a");
        const activeStr = isPathMatch(pathname, item.href) ? "true" : "false";
        anchors.forEach((anchor) => {
          if (anchor.getAttribute("href") !== item.href) {
            anchor.setAttribute("href", item.href);
          }
          if (anchor.hasAttribute("target")) {
            anchor.removeAttribute("target");
          }
          if (anchor.getAttribute("data-craver-active") !== activeStr) {
            anchor.setAttribute("data-craver-active", activeStr);
          }
          if (activeStr === "true") {
            if (anchor.getAttribute("aria-current") !== "page") {
              anchor.setAttribute("aria-current", "page");
            }
          } else if (anchor.hasAttribute("aria-current")) {
            anchor.removeAttribute("aria-current");
          }
          patchAnchorText(anchor, item.label);
        });
      }

      const socialAnchors = host.querySelectorAll(
        '[data-framer-name="Social Media Icons"] a'
      );
      const socialRoutes = [
        { href: "/about#social", label: "CRAVER on Instagram" },
        { href: "/about#social", label: "CRAVER on X" },
        { href: "/about#social", label: "CRAVER on TikTok" },
        { href: "/about#social", label: "CRAVER on YouTube" },
      ];
      socialAnchors.forEach((a, idx) => {
        const target = socialRoutes[idx];
        if (!target) return;
        if (a.getAttribute("href") !== target.href) {
          a.setAttribute("href", target.href);
        }
        if (a.getAttribute("aria-label") !== target.label) {
          a.setAttribute("aria-label", target.label);
        }
        if (a.hasAttribute("target")) {
          a.removeAttribute("target");
        }
      });
    };

    patchDom();
    const observer = new MutationObserver(patchDom);
    observer.observe(host, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname]);

  const handleMinimalNavClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (href && href.startsWith("/")) {
      e.preventDefault();
      e.stopPropagation();
      router.push(href);
      closeMinimalNavIfOpen();
    }
  };

  const handleMegaMenuClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (href && href.startsWith("/")) {
      e.preventDefault();
      e.stopPropagation();
      router.push(href);
    }
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    await refreshSessionData();
    setProfileOpen(false);
    showToast("Signed out of CRAVER.", "info");
    router.push("/");
    router.refresh();
  };

  const avatarInitials = (profile?.full_name || user?.email || "C")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-[#E8E8E8] bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 2xl:px-8">
        {/* Left: Logo + Jakarta Area Selector */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <CraverLogo />

          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                setAreaOpen((o) => !o);
                setNotifOpen(false);
                setProfileOpen(false);
              }}
              aria-expanded={areaOpen}
              aria-haspopup="listbox"
              aria-label="Select Jakarta area"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-[#FAFAFA] px-2.5 py-1.5 text-sm font-medium text-[#1C1C1C] transition hover:border-[#E23744]/40 hover:bg-white"
            >
              <MapPin className="h-4 w-4 shrink-0 text-[#E23744]" aria-hidden="true" />
              <span className="max-w-[92px] 2xl:max-w-[110px] truncate">{selectedArea}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-[#696969] transition-transform",
                  areaOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>

            {areaOpen && (
              <div
                role="listbox"
                aria-label="Jakarta areas"
                className="absolute left-0 mt-2 w-56 rounded-xl border border-[#E8E8E8] bg-white p-1.5 shadow-xl z-50"
              >
                <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#696969]">
                  Jakarta Neighborhoods
                </p>
                {JAKARTA_AREAS.map((area) => {
                  const selected = selectedArea === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectedArea(area);
                        setAreaOpen(false);
                        if (pathname === "/explore") {
                          const params = new URLSearchParams(window.location.search);
                          if (area === "All Jakarta") params.delete("area");
                          else params.set("area", area);
                          router.push(`/explore?${params.toString()}`);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
                        selected
                          ? "bg-[#FFF0F1] font-semibold text-[#E23744]"
                          : "text-[#1C1C1C] hover:bg-[#FAFAFA]"
                      )}
                    >
                      <span>{area}</span>
                      {selected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E23744]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center-Desktop: Primary Nav + Expanded Framer MorphingMegaMenu */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-3 2xl:gap-5">
          <ul className="flex items-center gap-3 xl:gap-3.5 2xl:gap-5">
            {PRIMARY_LINKS.map((link) => {
              const active = isActivePath(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className="craver-nav-link text-sm whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Framer Morphing Mega Menu integrated cleanly at xl (1280px+) where horizontal space allows 1:1 display */}
          <div
            onClickCapture={handleMegaMenuClickCapture}
            className="craver-mega-wrap hidden xl:flex items-center"
          >
            <MorphingMegaMenu
              projectsLabel="Cuisines"
              studioLabel="Areas"
              journalLabel="Cravings"
              contactLabel="Submit"
              contactLink="/contribute"
              project1Title="Indonesian"
              project1Text="Archipelago hearth & heritage classics"
              project1Image="/images/rest-indonesian-senopati.jpg"
              project1Link="/explore?category=Indonesian"
              project2Title="Japanese"
              project2Text="Broth ramen bars & izakaya counters"
              project2Image="/images/rest-japanese-scbd.jpg"
              project2Link="/explore?category=Japanese"
              project3Title="Italian & Western"
              project3Text="Hand-rolled pasta & dry-aged grill"
              project3Image="/images/rest-italian-trattoria.jpg"
              project3Link="/explore?category=Italian"
              project4Title="Coffee & Desserts"
              project4Text="Single-origin pour-overs & pastries"
              project4Image="/images/rest-coffee-roastery.jpg"
              project4Link="/explore?category=Coffee+%26+Tea"
              card1Title="Senopati & SCBD"
              card1Text="Flagship dining rooms & chef counters"
              card1Image="/images/rest-korean-bbq.jpg"
              card1Link="/explore?area=Senopati"
              card2Title="Menteng Heritage"
              card2Text="Timeless veranda eateries & pastas"
              card2Image="/images/dish-nasi-goreng.jpg"
              card2Link="/explore?area=Menteng"
              card3Title="Kemang & PIK"
              card3Text="Roasteries, dim sum & dessert salons"
              card3Image="/images/rest-chinese-dimsum.jpg"
              card3Link="/explore?area=Kemang"
              journalHeading="Popular Cravings"
              entry1Title="Beef Ramen"
              entry1Text="48-hour torched wagyu broth at Kuroshio"
              entry1Image="/images/dish-beef-ramen.jpg"
              entry1Link="/explore?q=Beef+Ramen"
              entry2Title="Pasta Carbonara"
              entry2Text="Roman Pecorino rigatoni at Osteria Sorella"
              entry2Image="/images/dish-pasta-carbonara.jpg"
              entry2Link="/explore?q=Carbonara"
              entry3Title="Matcha Latte"
              entry3Text="First-harvest Uji ceremonial matcha in Kemang"
              entry3Image="/images/dish-matcha-latte.jpg"
              entry3Link="/explore?q=Matcha+Latte"
              allEntriesLabel="Explore All Dishes"
              allEntriesLink="/explore"
            />
          </div>
        </nav>

        {/* Right: Notifications, Account Profile, and Mobile Framer MotionMinimalNavs */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={notifOpen}
              onClick={() => {
                setNotifOpen((o) => !o);
                setAreaOpen(false);
                setProfileOpen(false);
              }}
              className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#1C1C1C] transition hover:border-[#E23744]/40 hover:text-[#E23744]"
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E23744] px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-[#E8E8E8] bg-white p-3 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-2">
                  <span className="text-sm font-bold text-[#1C1C1C]">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllNotificationsRead()}
                      className="text-xs font-semibold text-[#E23744] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {!user ? (
                  <div className="py-5 text-center">
                    <p className="text-xs text-[#696969]">
                      Sign in to track submission approvals and community updates.
                    </p>
                    <Link
                      href="/auth/login"
                      className="mt-3 inline-flex rounded-lg bg-[#E23744] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#C91D2B]"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#696969]">
                    No notifications yet.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
                    {notifications.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!item.is_read) {
                              await markNotificationRead(item.id);
                            }
                            setNotifOpen(false);
                            if (item.link) router.push(item.link);
                          }}
                          className={cn(
                            "w-full rounded-lg p-2.5 text-left transition",
                            item.is_read
                              ? "bg-white hover:bg-[#FAFAFA]"
                              : "bg-[#FFF0F1]/70 hover:bg-[#FFF0F1]"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#1C1C1C]">
                              {item.title}
                            </span>
                            {!item.is_read && (
                              <span className="h-2 w-2 rounded-full bg-[#E23744]" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[#696969] line-clamp-2">
                            {item.body}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Profile / Auth */}
          <div className="relative">
            {user ? (
              <>
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                  onClick={() => {
                    setProfileOpen((o) => !o);
                    setAreaOpen(false);
                    setNotifOpen(false);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[#E8E8E8] bg-white pl-1.5 pr-3 transition hover:border-[#E23744]/40"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "User avatar"}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0F1] text-xs font-bold text-[#E23744]">
                      {avatarInitials}
                    </span>
                  )}
                  <span className="hidden sm:inline max-w-[96px] truncate text-sm font-medium text-[#1C1C1C]">
                    {profile?.full_name || "Member"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#696969]" aria-hidden="true" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E8E8E8] bg-white p-1.5 shadow-xl z-50">
                    <div className="border-b border-[#E8E8E8] px-3 py-2">
                      <p className="truncate text-sm font-semibold text-[#1C1C1C]">
                        {profile?.full_name || "Food Explorer"}
                      </p>
                      <p className="truncate text-xs text-[#696969]">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAFAFA]"
                    >
                      <User className="h-4 w-4 text-[#696969]" aria-hidden="true" />
                      My Profile & Saves
                    </Link>
                    <Link
                      href="/collections"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAFAFA]"
                    >
                      <Bookmark className="h-4 w-4 text-[#696969]" aria-hidden="true" />
                      Collections
                    </Link>
                    <Link
                      href="/contribute"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAFAFA]"
                    >
                      <PlusCircle className="h-4 w-4 text-[#E23744]" aria-hidden="true" />
                      Contribute Restaurant
                    </Link>
                    {profile?.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#E23744] hover:bg-[#FFF0F1]"
                      >
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        Admin Moderation
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-[#E8E8E8] px-3 py-2 text-left text-sm text-[#696969] hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-flex min-h-10 items-center whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-[#1C1C1C] transition hover:text-[#E23744]"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex h-9 sm:h-10 items-center whitespace-nowrap rounded-full bg-[#E23744] px-3 sm:px-3.5 2xl:px-4 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#C91D2B]"
                >
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">Join CRAVER</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile / Tablet Navigation: Framer MotionMinimalNavs (no duplicate hamburger menu) */}
          <div className="relative h-[44px] w-[124px] sm:h-[53px] sm:w-[148px] shrink-0 lg:hidden">
            <div
              ref={minimalNavHostRef}
              onClickCapture={handleMinimalNavClickCapture}
              className="craver-framer-minimal-wrap absolute right-0 top-0 z-50 origin-top-right scale-[0.65] sm:scale-[0.78]"
            >
              <MotionMinimalNavs showClock={false} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
