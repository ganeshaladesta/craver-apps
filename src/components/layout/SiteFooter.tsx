"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Share2 } from "lucide-react";
import { BrandMarkRights, NudgeFooter } from "@/components/framer/FramerImports";
import { CraverLogo } from "@/components/ui/CraverLogo";
import { useCraver } from "@/components/providers/CraverProviders";

export function SiteFooter() {
  const { locale, t, profile } = useCraver();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="border-t border-[#2E2A29] bg-[#1C1C1C] text-[#FFF6E9]">
      {/* Framer NudgeFooter interactive editorial wordmark canvas */}
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-[#FFB800]/30 bg-[#FFF6E9] px-4 pt-6 pb-4 sm:px-8 shadow-sm">
          <NudgeFooter
            key={`nudge-${locale}`}
            wordmark="CRAVER"
            color="#E23744"
            aspectRatio={3.2}
            mobileRatio={1.9}
            font={{
              fontFamily: "var(--font-manrope), Manrope, sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.055em",
              lineHeight: "0.9em",
            }}
            decorations={[
              {
                name: "Discover",
                kind: "badge",
                text: t.footer.badgeDiscover,
                color: "#F7A8C4",
                ink: "#1C1C1C",
                x: 11,
                y: 26,
                size: 8.2,
                rotation: -11,
                layer: "front",
                mobileX: 14,
                mobileY: 22,
                mobileSize: 15,
                response: 1.15,
              },
              {
                name: "Real Menus",
                kind: "badge",
                text: t.footer.badgeMenus,
                color: "#1C1C1C",
                ink: "#FFF6E9",
                x: 50,
                y: 22,
                size: 7.5,
                rotation: 6,
                layer: "front",
                mobileX: 52,
                mobileY: 18,
                mobileSize: 14,
                response: 1.05,
              },
              {
                name: "Jakarta Picks",
                kind: "badge",
                text: t.footer.badgeJakarta,
                color: "#FFB800",
                ink: "#1C1C1C",
                x: 88,
                y: 28,
                size: 8.5,
                rotation: 12,
                layer: "front",
                mobileX: 86,
                mobileY: 22,
                mobileSize: 15,
                response: 1.2,
              },
            ]}
          />
        </div>
      </div>

      {/* Main Footer Navigation & Editorial Identity */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <CraverLogo size="lg" tone="light" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#D6CEC6]">
              {t.footer.description}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/about#social"
                aria-label="CRAVER Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#FFF6E9] transition hover:border-[#FFB800] hover:bg-[#FFB800] hover:text-[#1C1C1C]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link
                href="/about#social"
                aria-label="CRAVER YouTube"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#FFF6E9] transition hover:border-[#FFB800] hover:bg-[#FFB800] hover:text-[#1C1C1C]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3v6Z" />
                </svg>
              </Link>
              <Link
                href="/about#social"
                aria-label="Share CRAVER"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#FFF6E9] transition hover:border-[#FFB800] hover:bg-[#FFB800] hover:text-[#1C1C1C]"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFB800]">
              {t.footer.exploreHeading}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#D6CEC6]">
              <li>
                <Link href="/explore" className="transition hover:text-white">
                  {t.footer.exploreRestaurants}
                </Link>
              </li>
              <li>
                <Link href="/explore?view=dishes" className="transition hover:text-white">
                  {t.footer.discoverFood}
                </Link>
              </li>
              <li>
                <Link href="/collections" className="transition hover:text-white">
                  {t.footer.curatedCollections}
                </Link>
              </li>
              <li>
                <Link href="/explore?area=Senopati" className="transition hover:text-white">
                  {t.footer.senopatiScbd}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7A8C4]">
              {t.footer.communityHeading}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#D6CEC6]">
              <li>
                <Link href="/contribute" className="transition hover:text-white">
                  {t.footer.communityContrib}
                </Link>
              </li>
              <li>
                <Link href="/contribute" className="transition hover:text-white">
                  {t.footer.addRestaurant}
                </Link>
              </li>
              <li>
                <Link href="/profile" className="transition hover:text-white">
                  {t.footer.savedAndReviews}
                </Link>
              </li>
              {profile?.role === "admin" && (
                <li>
                  <Link href="/admin" className="font-semibold text-[#FFB800] hover:underline">
                    {t.footer.modDashboard}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF7043]">
              {t.footer.companyHeading}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#D6CEC6]">
              <li>
                <Link href="/about" className="transition hover:text-white">
                  {t.footer.aboutCraver}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-white">
                  {t.footer.contact}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-white">
                  {t.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-white">
                  {t.footer.termsOfService}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Brand Mark strip via Framer BrandMarkRights (renders single <footer>) */}
      <div className="border-t border-white/10 bg-[#141212] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <BrandMarkRights
            font={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
            gap={8}
            icon={{
              show: true,
              pos: "0",
              type: "copyright",
              color: "#FFB800",
              gap: 4,
              borderRadius: 0,
            }}
            year={{
              show: true,
              pos: "1",
              since: 2024,
            }}
            company={{
              show: true,
              pos: "2",
              name: "CRAVER",
              link: "/about",
              newTab: false,
              baseColor: "#FFFFFF",
              hoverColor: "#FFB800",
              hoverStyle: "sweep",
            }}
            dot={{
              show: true,
              pos: "3",
              style: "dot",
              color: "#FF7043",
              opacity: 0.9,
              size: 16,
            }}
            statustext={{
              pos: "4",
              statementText: t.footer.rightsStatement,
              textColor: "#D6CEC6",
              alignment: "center",
              transform: "none",
              textSelectable: true,
            }}
            powered={{
              show: true,
              pos: "5",
              prefix: t.footer.poweredPrefix,
              text: locale === "id" ? "Komunitas Kuliner Jakarta" : "Jakarta Food Community",
              link: "/contribute",
              baseColor: "#F7A8C4",
              hoverColor: "#FFB800",
              hoverStyle: "drift",
              opacity: 0.95,
              newTab: false,
            }}
            animations={{
              enabled: !shouldReduceMotion,
              appear: "none",
              blur: 0,
              duration: 0.35,
            }}
            interactions={{
              hoverDuration: 0.25,
            }}
          />
        </div>
      </div>
    </div>
  );
}
