"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Bookmark,
  ChevronDown,
  Compass,
  LogIn,
  LogOut,
  MapPin,
  PlusCircle,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { MorphingMegaMenu, MotionMinimalNavs } from "@/components/framer/FramerImports";
import { CraverLogo } from "@/components/ui/CraverLogo";
import { useCraver } from "@/components/providers/CraverProviders";
import { translateAreaLabel } from "@/lib/i18n/dictionary";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, JAKARTA_AREAS } from "@/lib/utils";

type ExploreTab = "cuisines" | "areas" | "cravings";

const MOBILE_EXPLORE_HREFS: Record<ExploreTab, string[]> = {
  cuisines: [
    "/explore?category=Indonesian",
    "/explore?category=Japanese",
    "/explore?category=Italian",
    "/explore?category=Coffee+%26+Tea",
  ],
  areas: [
    "/explore?area=Senopati",
    "/explore?area=Menteng",
    "/explore?area=Kemang",
    "/explore",
  ],
  cravings: [
    "/explore?q=Beef+Ramen",
    "/explore?q=Nasi+Goreng",
    "/explore?q=Carbonara",
    "/explore?q=Matcha+Latte",
  ],
};

function isPathMatch(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    locale,
    setLocale,
    t,
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

  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [exploreTab, setExploreTab] = useState<ExploreTab>("cuisines");
  const [megaVariantAlt, setMegaVariantAlt] = useState<0 | 1>(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExploreTab, setMobileExploreTab] = useState<ExploreTab>("cuisines");

  const headerRef = useRef<HTMLElement>(null);
  const areaWrapRef = useRef<HTMLDivElement>(null);
  const exploreWrapRef = useRef<HTMLLIElement>(null);
  const exploreTriggerRef = useRef<HTMLButtonElement>(null);
  const exploreMegaBodyRef = useRef<HTMLDivElement>(null);
  const exploreTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const notifWrapRef = useRef<HTMLDivElement>(null);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const minimalNavHostRef = useRef<HTMLDivElement>(null);

  const isHomePage = pathname === "/";
  const anyOverlayOpen =
    areaOpen || exploreOpen || notifOpen || profileOpen || mobileMenuOpen;
  const isHeroTransparent = isHomePage && !scrolledPastHero && !anyOverlayOpen;

  const isActivePath = (href: string) => isPathMatch(pathname, href);

  const exploreTabs = useMemo(
    () => [
      { id: "cuisines" as const, label: t.nav.cuisines },
      { id: "areas" as const, label: t.nav.areas },
      { id: "cravings" as const, label: t.nav.cravings },
    ],
    [t.nav.areas, t.nav.cravings, t.nav.cuisines]
  );

  const mobileExploreLinks = useMemo(
    () =>
      t.nav.mobileLinks[mobileExploreTab].map((label, idx) => ({
        label,
        href: MOBILE_EXPLORE_HREFS[mobileExploreTab][idx] || "/explore",
      })),
    [mobileExploreTab, t.nav.mobileLinks]
  );

  // Adaptive navbar appearance over fullscreen hero on /
  useEffect(() => {
    const syncScroll = () => {
      setScrolledPastHero(window.scrollY > 40);
    };
    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncScroll);
  }, [pathname]);

  const megaMenuVariant = useMemo(() => {
    if (exploreTab === "cuisines") {
      return megaVariantAlt === 0 ? "Desktop · Projects" : "Tablet · Projects";
    }
    if (exploreTab === "areas") {
      return megaVariantAlt === 0 ? "Desktop · Studio" : "Tablet · Studio";
    }
    return megaVariantAlt === 0 ? "Desktop · Journal" : "Tablet · Journal";
  }, [exploreTab, megaVariantAlt]);

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

  // Close popovers on route transitions
  useEffect(() => {
    setAreaOpen(false);
    setExploreOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
    closeMinimalNavIfOpen();
  }, [pathname]);

  // Outside clicks, outside focus, and Escape key handling
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!areaWrapRef.current?.contains(target)) setAreaOpen(false);
      if (!exploreWrapRef.current?.contains(target)) setExploreOpen(false);
      if (!notifWrapRef.current?.contains(target)) setNotifOpen(false);
      if (!profileWrapRef.current?.contains(target)) setProfileOpen(false);
      if (!minimalNavHostRef.current?.contains(target)) closeMinimalNavIfOpen();
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as Node | null;
      if (target && !exploreWrapRef.current?.contains(target)) {
        setExploreOpen(false);
      }
      if (target && !areaWrapRef.current?.contains(target)) {
        setAreaOpen(false);
      }
      if (target && !notifWrapRef.current?.contains(target)) {
        setNotifOpen(false);
      }
      if (target && !profileWrapRef.current?.contains(target)) {
        setProfileOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const wasExploreOpen = exploreOpen;
        setAreaOpen(false);
        setExploreOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
        closeMinimalNavIfOpen();
        if (wasExploreOpen) {
          exploreTriggerRef.current?.focus();
        }
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [exploreOpen]);

  // Keep MorphingMegaMenu locked on the active Explore panel while dropdown is open
  useEffect(() => {
    if (!exploreOpen) return;
    const host = exploreMegaBodyRef.current;
    if (!host) return;

    const ensurePanelOpen = () => {
      const root = host.querySelector(".framer-nnFU8") as HTMLElement | null;
      const framerName = root?.getAttribute("data-framer-name");
      if (framerName === "Desktop" || framerName === "Tablet") {
        setMegaVariantAlt((prev) => (prev === 0 ? 1 : 0));
      }
    };

    const observer = new MutationObserver(ensurePanelOpen);
    observer.observe(host, {
      attributes: true,
      attributeFilter: ["data-framer-name"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [exploreOpen]);

  // Synchronize Framer MotionMinimalNavs internal MenuLink & LegalLink nodes + open state
  useEffect(() => {
    const host = minimalNavHostRef.current;
    if (!host) return;

    const menuMap = [
      { container: "Menu Link 1", label: t.nav.home, href: "/" },
      { container: "Menu Link 2", label: t.nav.explore, href: "/explore" },
      { container: "Menu Link 3", label: t.nav.collections, href: "/collections" },
      { container: "Menu Link 4", label: t.nav.contribute, href: "/contribute" },
      { container: "Legal Link 1", label: t.footer.privacyPolicy, href: "/privacy" },
      { container: "Legal Link 2", label: t.footer.termsOfService, href: "/terms" },
    ];

    const patchLeafText = (rootEl: Element, label: string) => {
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
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
      const isOpen = Boolean(host.querySelector('[data-framer-name="Toggle Label Close"]'));
      setMobileMenuOpen(isOpen);

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
          patchLeafText(anchor, item.label);
        });
      }

      const closeLabelEl = host.querySelector('[data-framer-name="Toggle Label Close"]');
      if (closeLabelEl) {
        patchLeafText(closeLabelEl, locale === "id" ? "Tutup" : "Close");
      }

      const menuToggleEl = host.querySelector(
        '[data-framer-name="Menu Toggle"]'
      ) as HTMLElement | null;
      if (menuToggleEl) {
        if (menuToggleEl.getAttribute("role") !== "button") {
          menuToggleEl.setAttribute("role", "button");
        }
        if (menuToggleEl.getAttribute("tabindex") !== "0") {
          menuToggleEl.setAttribute("tabindex", "0");
        }
        const expandedStr = isOpen ? "true" : "false";
        if (menuToggleEl.getAttribute("aria-expanded") !== expandedStr) {
          menuToggleEl.setAttribute("aria-expanded", expandedStr);
        }
        const toggleLabel = isOpen
          ? locale === "id"
            ? "Tutup menu navigasi"
            : "Close navigation menu"
          : locale === "id"
            ? "Buka menu navigasi"
            : "Open navigation menu";
        if (menuToggleEl.getAttribute("aria-label") !== toggleLabel) {
          menuToggleEl.setAttribute("aria-label", toggleLabel);
        }
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
    observer.observe(host, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-framer-name"],
    });
    return () => observer.disconnect();
  }, [locale, pathname, t]);

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

  const handleMinimalNavKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const target = e.target as HTMLElement | null;
    const toggle = target?.closest('[data-framer-name="Menu Toggle"]') as HTMLElement | null;
    if (!toggle) return;
    e.preventDefault();
    toggle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, isPrimary: true }));
    toggle.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, isPrimary: true }));
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
      setExploreOpen(false);
      router.push(href);
    }
  };

  const getVisibleMegaLinks = () => {
    const body = exploreMegaBodyRef.current;
    if (!body) return [];
    const selector =
      exploreTab === "cuisines"
        ? '[data-framer-name="Panel · Projects"] a'
        : exploreTab === "areas"
          ? '[data-framer-name="Panel · Studio"] a'
          : '[data-framer-name="Panel · Journal"] a';
    return Array.from(body.querySelectorAll<HTMLAnchorElement>(selector));
  };

  const focusExploreTab = (index: number) => {
    const tab = exploreTabs[index];
    if (!tab) return;
    setExploreTab(tab.id);
    exploreTabRefs.current[index]?.focus();
  };

  const handleExploreTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!exploreOpen) {
        setExploreOpen(true);
        setAreaOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
      requestAnimationFrame(() => {
        const currentIdx = exploreTabs.findIndex((tab) => tab.id === exploreTab);
        exploreTabRefs.current[Math.max(0, currentIdx)]?.focus();
      });
    }
  };

  const handleExploreTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusExploreTab((idx + 1) % exploreTabs.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusExploreTab((idx - 1 + exploreTabs.length) % exploreTabs.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusExploreTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusExploreTab(exploreTabs.length - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const links = getVisibleMegaLinks();
      links[0]?.focus();
    }
  };

  const handleMegaBodyKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const links = getVisibleMegaLinks();
    if (!links.length) return;
    const currentIdx = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (currentIdx === -1) return;

    e.preventDefault();
    if (e.key === "ArrowDown") {
      links[(currentIdx + 1) % links.length]?.focus();
    } else if (currentIdx === 0) {
      const tabIdx = exploreTabs.findIndex((tab) => tab.id === exploreTab);
      exploreTabRefs.current[Math.max(0, tabIdx)]?.focus();
    } else {
      links[currentIdx - 1]?.focus();
    }
  };

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setAreaOpen(false);
    if (pathname === "/explore") {
      const params = new URLSearchParams(window.location.search);
      if (area === "All Jakarta") params.delete("area");
      else params.set("area", area);
      router.push(`/explore?${params.toString()}`);
    }
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    await refreshSessionData();
    setProfileOpen(false);
    showToast(t.common.toasts.signedOut, "info");
    router.push("/");
    router.refresh();
  };

  const avatarInitials = (profile?.full_name || user?.email || "C")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const megaStageHeight =
    exploreTab === "cuisines"
      ? "h-[324px]"
      : exploreTab === "areas"
        ? "h-[252px]"
        : "h-[234px]";

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-40 h-[72px] transition-colors duration-200",
        isHeroTransparent
          ? "craver-header-hero border-b border-white/15 bg-gradient-to-b from-[#16080A]/85 via-[#16080A]/55 to-transparent backdrop-blur-xs"
          : "border-b border-[#EEEEEE] bg-white"
      )}
    >
      <a
        href="#main-content"
        className="visually-hidden focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#E23744] focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        {t.common.skipToContent}
      </a>

      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-1.5 sm:gap-3 px-2 min-[360px]:px-2.5 sm:px-6 lg:px-8">
        {/* LEFT: CRAVER Logo & Brand Name + Location Selector */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <CraverLogo tone={isHeroTransparent ? "light" : "dark"} />

          <div ref={areaWrapRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                setAreaOpen((o) => !o);
                setExploreOpen(false);
                setNotifOpen(false);
                setProfileOpen(false);
              }}
              aria-expanded={areaOpen}
              aria-haspopup="listbox"
              aria-label={t.nav.selectArea}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs xl:text-sm font-medium transition",
                isHeroTransparent
                  ? "border-white/25 bg-white/12 text-white hover:bg-white/20"
                  : "border-[#EEEEEE] bg-[#FAFAFA] text-[#1C1C1C] hover:border-[#E23744]/40 hover:bg-white"
              )}
            >
              <MapPin
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isHeroTransparent ? "text-[#FFB800]" : "text-[#E23744]"
                )}
                aria-hidden="true"
              />
              <span className="max-w-[92px] xl:max-w-[116px] truncate">
                {translateAreaLabel(selectedArea, locale)}
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-150",
                  isHeroTransparent ? "text-white/80" : "text-[#696969]",
                  areaOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>

            {areaOpen && (
              <div
                role="listbox"
                aria-label={t.nav.jakartaNeighborhoods}
                className="craver-dropdown-panel absolute left-0 mt-2 w-56 rounded-xl border border-[#EEEEEE] bg-white p-1.5 shadow-[0_14px_32px_-12px_rgba(28,28,28,0.14)] z-50"
              >
                <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#696969]">
                  {t.nav.jakartaNeighborhoods}
                </p>
                {JAKARTA_AREAS.map((area) => {
                  const selected = selectedArea === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => handleAreaSelect(area)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
                        selected
                          ? "bg-[#FFF0F1] font-semibold text-[#E23744]"
                          : "text-[#1C1C1C] hover:bg-[#FAFAFA]"
                      )}
                    >
                      <span>{translateAreaLabel(area, locale)}</span>
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

        {/* CENTER: Unified Desktop Primary Navigation */}
        <nav aria-label={t.nav.primaryLabel} className="hidden lg:flex items-center">
          <ul className="flex items-center gap-4 xl:gap-6">
            <li>
              <Link
                href="/"
                aria-current={isActivePath("/") ? "page" : undefined}
                className="craver-nav-link text-sm whitespace-nowrap"
              >
                {t.nav.home}
              </Link>
            </li>

            <li ref={exploreWrapRef} className="relative">
              <button
                ref={exploreTriggerRef}
                type="button"
                aria-expanded={exploreOpen}
                aria-haspopup="true"
                aria-controls="craver-explore-megamenu"
                data-active={exploreOpen || isActivePath("/explore") ? "true" : undefined}
                onClick={() => {
                  setExploreOpen((o) => !o);
                  setAreaOpen(false);
                  setNotifOpen(false);
                  setProfileOpen(false);
                }}
                onKeyDown={handleExploreTriggerKeyDown}
                className="craver-nav-link text-sm whitespace-nowrap"
              >
                <span>{t.nav.explore}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-current transition-transform duration-150",
                    exploreOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>

              {exploreOpen && (
                <div
                  id="craver-explore-megamenu"
                  role="region"
                  aria-label={t.nav.explore}
                  className="craver-dropdown-panel absolute left-1/2 top-[calc(100%+12px)] z-50 w-[716px] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-2xl border border-[#EEEEEE] bg-white p-5 shadow-[0_18px_40px_-14px_rgba(28,28,28,0.16)]"
                >
                  {/* Explore Submenu Switcher */}
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#EEEEEE] pb-3">
                    <div
                      role="tablist"
                      aria-label={t.nav.exploreCategories}
                      className="flex items-center gap-1.5"
                    >
                      {exploreTabs.map((tab, idx) => {
                        const selected = exploreTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            ref={(el) => {
                              exploreTabRefs.current[idx] = el;
                            }}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setExploreTab(tab.id)}
                            onKeyDown={(e) => handleExploreTabKeyDown(e, idx)}
                            className={cn(
                              "rounded-full px-3.5 py-1.5 text-sm transition cursor-pointer",
                              selected
                                ? "bg-[#FFF0F1] font-semibold text-[#E23744]"
                                : "font-medium text-[#696969] hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
                            )}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <Link
                      href="/explore"
                      onClick={() => setExploreOpen(false)}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-[#E23744] transition hover:bg-[#FFF0F1] hover:text-[#C91D2B]"
                    >
                      <span>{t.nav.exploreAll}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>

                  <div
                    ref={exploreMegaBodyRef}
                    data-explore-tab={exploreTab}
                    onClickCapture={handleMegaMenuClickCapture}
                    onKeyDown={handleMegaBodyKeyDown}
                    className={cn(
                      "craver-explore-mega relative overflow-hidden transition-[height] duration-200 ease-out",
                      megaStageHeight
                    )}
                  >
                    <MorphingMegaMenu
                      variant={megaMenuVariant}
                      projectsLabel={t.nav.cuisines}
                      studioLabel={t.nav.areas}
                      journalLabel={t.nav.cravings}
                      contactLabel={t.nav.submitRestaurant}
                      contactLink="/contribute"
                      project1Title={t.nav.mega.p1Title}
                      project1Text={t.nav.mega.p1Text}
                      project1Image="/images/rest-indonesian-senopati.jpg"
                      project1Link="/explore?category=Indonesian"
                      project2Title={t.nav.mega.p2Title}
                      project2Text={t.nav.mega.p2Text}
                      project2Image="/images/rest-japanese-scbd.jpg"
                      project2Link="/explore?category=Japanese"
                      project3Title={t.nav.mega.p3Title}
                      project3Text={t.nav.mega.p3Text}
                      project3Image="/images/rest-italian-trattoria.jpg"
                      project3Link="/explore?category=Italian"
                      project4Title={t.nav.mega.p4Title}
                      project4Text={t.nav.mega.p4Text}
                      project4Image="/images/rest-coffee-roastery.jpg"
                      project4Link="/explore?category=Coffee+%26+Tea"
                      card1Title={t.nav.mega.a1Title}
                      card1Text={t.nav.mega.a1Text}
                      card1Image="/images/rest-korean-bbq.jpg"
                      card1Link="/explore?area=Senopati"
                      card2Title={t.nav.mega.a2Title}
                      card2Text={t.nav.mega.a2Text}
                      card2Image="/images/dish-nasi-goreng.jpg"
                      card2Link="/explore?area=Menteng"
                      card3Title={t.nav.mega.a3Title}
                      card3Text={t.nav.mega.a3Text}
                      card3Image="/images/rest-chinese-dimsum.jpg"
                      card3Link="/explore?area=Kemang"
                      journalHeading={t.nav.popularCravings}
                      entry1Title={t.nav.mega.e1Title}
                      entry1Text={t.nav.mega.e1Text}
                      entry1Image="/images/dish-beef-ramen.jpg"
                      entry1Link="/explore?q=Beef+Ramen"
                      entry2Title={t.nav.mega.e2Title}
                      entry2Text={t.nav.mega.e2Text}
                      entry2Image="/images/dish-pasta-carbonara.jpg"
                      entry2Link="/explore?q=Carbonara"
                      entry3Title={t.nav.mega.e3Title}
                      entry3Text={t.nav.mega.e3Text}
                      entry3Image="/images/dish-matcha-latte.jpg"
                      entry3Link="/explore?q=Matcha+Latte"
                      allEntriesLabel={t.nav.exploreAllDishes}
                      allEntriesLink="/explore?view=dishes"
                    />
                  </div>
                </div>
              )}
            </li>

            <li>
              <Link
                href="/collections"
                aria-current={isActivePath("/collections") ? "page" : undefined}
                className="craver-nav-link text-sm whitespace-nowrap"
              >
                {t.nav.collections}
              </Link>
            </li>

            <li>
              <Link
                href="/contribute"
                aria-current={isActivePath("/contribute") ? "page" : undefined}
                className="craver-nav-link text-sm whitespace-nowrap"
              >
                {t.nav.contribute}
              </Link>
            </li>
          </ul>
        </nav>

        {/* RIGHT: Bilingual Switcher + Submit CTA + Notifications + Profile + Mobile Drawer */}
        <div className="flex items-center gap-1 min-[375px]:gap-1.5 sm:gap-2 shrink-0">
          {/* Animated Bilingual Segmented Switcher (ID | EN) */}
          <div
            role="group"
            aria-label={t.nav.languageSwitcherLabel}
            className={cn(
              "inline-flex h-7 min-[375px]:h-8 sm:h-9 items-center rounded-full border p-0.5 text-[10px] min-[375px]:text-[11px] font-bold tracking-wide transition-colors",
              isHeroTransparent
                ? "border-white/25 bg-white/12"
                : "border-[#EEEEEE] bg-[#FAFAFA]"
            )}
          >
            {(["id", "en"] as const).map((code) => {
              const active = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  aria-pressed={active}
                  aria-label={code === "id" ? t.nav.switchToId : t.nav.switchToEn}
                  className={cn(
                    "relative z-10 inline-flex h-6 min-[375px]:h-7 sm:h-8 items-center justify-center rounded-full px-1.5 min-[375px]:px-2 sm:px-2.5 transition-colors cursor-pointer",
                    active
                      ? isHeroTransparent
                        ? "text-[#1C1C1C]"
                        : "text-white"
                      : isHeroTransparent
                        ? "text-white/85 hover:text-white"
                        : "text-[#696969] hover:text-[#1C1C1C]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="craver-lang-slider"
                      transition={{ type: "spring", stiffness: 460, damping: 34 }}
                      className={cn(
                        "absolute inset-0 -z-10 rounded-full shadow-xs",
                        isHeroTransparent ? "bg-[#FFB800]" : "bg-[#E23744]"
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span>{code.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Primary CRAVER Red CTA (sm+ inline, inside mobile drawer for <640px) */}
          <Link
            href="/contribute"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E23744] px-3 xl:px-4 text-xs xl:text-sm font-semibold text-white transition hover:bg-[#C91D2B]"
          >
            <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="xl:hidden">{t.nav.submitShort}</span>
            <span className="hidden xl:inline">{t.nav.submitRestaurant}</span>
          </Link>

          {/* Notification Icon */}
          <div ref={notifWrapRef} className="relative">
            <button
              type="button"
              aria-label={t.nav.notifications}
              aria-expanded={notifOpen}
              onClick={() => {
                setNotifOpen((o) => !o);
                setAreaOpen(false);
                setExploreOpen(false);
                setProfileOpen(false);
              }}
              className={cn(
                "relative inline-flex h-7 w-7 min-[375px]:h-8 min-[375px]:w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border transition",
                isHeroTransparent
                  ? "border-white/25 bg-white/12 text-white hover:bg-white/20"
                  : "border-[#EEEEEE] bg-white text-[#1C1C1C] hover:border-[#E23744]/40 hover:text-[#E23744]"
              )}
            >
              <Bell className="h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E23744] px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="craver-dropdown-panel absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-[#EEEEEE] bg-white p-3 shadow-[0_14px_32px_-12px_rgba(28,28,28,0.14)] z-50">
                <div className="flex items-center justify-between border-b border-[#EEEEEE] pb-2">
                  <span className="text-sm font-bold text-[#1C1C1C]">
                    {t.nav.notifications}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllNotificationsRead()}
                      className="text-xs font-semibold text-[#E23744] hover:underline"
                    >
                      {t.nav.markAllRead}
                    </button>
                  )}
                </div>

                {!user ? (
                  <div className="py-5 text-center">
                    <p className="text-xs text-[#696969]">{t.nav.signInToTrack}</p>
                    <Link
                      href="/auth/login"
                      onClick={() => setNotifOpen(false)}
                      className="mt-3 inline-flex rounded-full bg-[#E23744] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#C91D2B]"
                    >
                      {t.nav.signIn}
                    </Link>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#696969]">
                    {t.nav.noNotifs}
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

          {/* User Profile Dropdown (Member & Guest) */}
          <div ref={profileWrapRef} className="relative">
            {user ? (
              <>
                <button
                  type="button"
                  aria-label={t.nav.accountMenu}
                  aria-expanded={profileOpen}
                  onClick={() => {
                    setProfileOpen((o) => !o);
                    setAreaOpen(false);
                    setExploreOpen(false);
                    setNotifOpen(false);
                  }}
                  className={cn(
                    "inline-flex h-7 w-7 min-[375px]:h-8 min-[375px]:w-8 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full border sm:pl-1.5 sm:pr-2.5 transition",
                    isHeroTransparent
                      ? "border-white/25 bg-white/12 text-white hover:bg-white/20"
                      : "border-[#EEEEEE] bg-white text-[#1C1C1C] hover:border-[#E23744]/40"
                  )}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "User avatar"}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF0F1] text-[11px] font-bold text-[#E23744]">
                      {avatarInitials}
                    </span>
                  )}
                  <span className="hidden xl:inline max-w-[92px] truncate text-sm font-medium">
                    {profile?.full_name || t.nav.member}
                  </span>
                  <ChevronDown
                    className={cn(
                      "hidden sm:block h-3.5 w-3.5 transition-transform duration-150",
                      isHeroTransparent ? "text-white/80" : "text-[#696969]",
                      profileOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {profileOpen && (
                  <div className="craver-dropdown-panel absolute right-0 mt-2 w-56 rounded-xl border border-[#EEEEEE] bg-white p-1.5 shadow-[0_14px_32px_-12px_rgba(28,28,28,0.14)] z-50">
                    <div className="border-b border-[#EEEEEE] px-3 py-2">
                      <p className="truncate text-sm font-semibold text-[#1C1C1C]">
                        {profile?.full_name || t.nav.foodExplorer}
                      </p>
                      <p className="truncate text-xs text-[#696969]">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAFAFA]"
                    >
                      <User className="h-4 w-4 text-[#696969]" aria-hidden="true" />
                      {t.nav.profileSaves}
                    </Link>
                    <Link
                      href="/collections"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAFAFA]"
                    >
                      <Bookmark className="h-4 w-4 text-[#696969]" aria-hidden="true" />
                      {t.nav.collections}
                    </Link>
                    <Link
                      href="/contribute"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAFAFA]"
                    >
                      <PlusCircle className="h-4 w-4 text-[#E23744]" aria-hidden="true" />
                      {t.nav.submitRestaurant}
                    </Link>
                    {profile?.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#E23744] hover:bg-[#FFF0F1]"
                      >
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        {t.nav.adminModeration}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-[#EEEEEE] px-3 py-2 text-left text-sm text-[#696969] hover:bg-[#FAFAFA] hover:text-[#1C1C1C]"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      {t.nav.signOut}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label={t.nav.accountMenu}
                  aria-expanded={profileOpen}
                  onClick={() => {
                    setProfileOpen((o) => !o);
                    setAreaOpen(false);
                    setExploreOpen(false);
                    setNotifOpen(false);
                  }}
                  className={cn(
                    "inline-flex h-7 w-7 min-[375px]:h-8 min-[375px]:w-8 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full border sm:px-2.5 text-sm font-medium transition",
                    isHeroTransparent
                      ? "border-white/25 bg-white/12 text-white hover:bg-white/20"
                      : "border-[#EEEEEE] bg-white text-[#1C1C1C] hover:border-[#E23744]/40"
                  )}
                >
                  <User
                    className={cn(
                      "h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4",
                      isHeroTransparent ? "text-white" : "text-[#696969]"
                    )}
                    aria-hidden="true"
                  />
                  <span className="hidden xl:inline">{t.nav.account}</span>
                  <ChevronDown
                    className={cn(
                      "hidden sm:block h-3.5 w-3.5 transition-transform duration-150",
                      isHeroTransparent ? "text-white/80" : "text-[#696969]",
                      profileOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {profileOpen && (
                  <div className="craver-dropdown-panel absolute right-0 mt-2 w-60 rounded-xl border border-[#EEEEEE] bg-white p-1.5 shadow-[0_14px_32px_-12px_rgba(28,28,28,0.14)] z-50">
                    <div className="border-b border-[#EEEEEE] px-3 py-2">
                      <p className="text-sm font-semibold text-[#1C1C1C]">
                        {t.nav.joinCommunity}
                      </p>
                      <p className="text-xs text-[#696969]">{t.nav.joinSubtitle}</p>
                    </div>
                    <Link
                      href="/auth/login"
                      onClick={() => setProfileOpen(false)}
                      className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#1C1C1C] hover:bg-[#FAFAFA]"
                    >
                      <LogIn className="h-4 w-4 text-[#696969]" aria-hidden="true" />
                      {t.nav.logIn}
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#E23744] hover:bg-[#FFF0F1]"
                    >
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      {t.nav.createAccount}
                    </Link>
                    <div className="mt-1 border-t border-[#EEEEEE] pt-1">
                      <Link
                        href="/collections"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#1C1C1C] hover:bg-[#FAFAFA]"
                      >
                        <Bookmark className="h-4 w-4 text-[#696969]" aria-hidden="true" />
                        {t.nav.browseCollections}
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile & Tablet Navigation Drawer: Framer MotionMinimalNavs */}
          <div className="relative h-7 w-[74px] min-[375px]:h-8 min-[375px]:w-[82px] sm:h-9 sm:w-[88px] shrink-0 lg:hidden">
            <div
              ref={minimalNavHostRef}
              onClickCapture={handleMinimalNavClickCapture}
              onKeyDown={handleMinimalNavKeyDown}
              className="craver-framer-minimal-wrap absolute right-0 top-0 z-50 flex flex-col items-end"
            >
              <MotionMinimalNavs showClock={false} />

              {mobileMenuOpen && (
                <div className="craver-mobile-drawer-footer w-[min(340px,calc(100vw-20px))] rounded-b-2xl border border-t-0 border-[#EEEEEE] bg-white px-4 pb-4 pt-2 text-[#1C1C1C]">
                  {/* Location selector inside mobile drawer when top bar hides it */}
                  <div className="mb-3 sm:hidden">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#696969]">
                      {t.nav.jakartaNeighborhoods}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {JAKARTA_AREAS.slice(0, 5).map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => {
                            handleAreaSelect(area);
                            closeMinimalNavIfOpen();
                          }}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                            selectedArea === area
                              ? "border-[#E23744] bg-[#FFF0F1] text-[#E23744]"
                              : "border-[#EEEEEE] bg-[#FAFAFA] text-[#1C1C1C]"
                          )}
                        >
                          {translateAreaLabel(area, locale)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Explore categories (Cuisines, Areas, Cravings) inside mobile drawer */}
                  <div className="border-t border-[#EEEEEE] pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#696969]">
                        <Compass className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
                        {t.nav.exploreCategories}
                      </span>
                    </div>

                    <div className="mb-2.5 flex gap-1.5">
                      {exploreTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setMobileExploreTab(tab.id)}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition",
                            mobileExploreTab === tab.id
                              ? "bg-[#FFF0F1] font-semibold text-[#E23744]"
                              : "bg-[#FAFAFA] text-[#696969]"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {mobileExploreLinks.map((item) => (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={() => closeMinimalNavIfOpen()}
                          className="rounded-lg border border-[#EEEEEE] bg-[#FAFAFA] px-2.5 py-1.5 text-xs font-medium text-[#1C1C1C] transition hover:border-[#E23744]/40 hover:bg-[#FFF0F1] hover:text-[#E23744]"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Accessible Submit Restaurant CTA inside drawer */}
                  <div className="mt-3 border-t border-[#EEEEEE] pt-3">
                    <Link
                      href="/contribute"
                      onClick={() => closeMinimalNavIfOpen()}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E23744] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C91D2B]"
                    >
                      <PlusCircle className="h-4 w-4" aria-hidden="true" />
                      {t.nav.submitRestaurant}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
