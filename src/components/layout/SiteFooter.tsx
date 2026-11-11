"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";
import { NudgeFooter } from "@/components/framer/FramerImports";
import { CraverLogo } from "@/components/ui/CraverLogo";
import { useCraver } from "@/components/providers/CraverProviders";

export function SiteFooter() {
  const { profile } = useCraver();

  return (
    <footer className="border-t border-[#E8E8E8] bg-[#FAFAFA] text-[#1C1C1C]">
      {/* Framer NudgeFooter interactive editorial wordmark canvas */}
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white px-4 pt-6 pb-4 sm:px-8">
          <NudgeFooter
            wordmark="CRAVER"
            color="#E23744"
            aspectRatio={3.4}
            mobileRatio={2.0}
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
                text: "DISCOVER\nPLACES.",
                color: "#FFF0F1",
                ink: "#C91D2B",
                x: 11,
                y: 30,
                size: 8.5,
                rotation: -11,
                layer: "front",
                mobileX: 13,
                mobileY: 26,
                mobileSize: 15,
                response: 1.15,
              },
              {
                name: "Real Menus",
                kind: "badge",
                text: "REAL\nMENUS.",
                color: "#1C1C1C",
                ink: "#FFFFFF",
                x: 49,
                y: 26,
                size: 8,
                rotation: 7,
                layer: "back",
                mobileX: 52,
                mobileY: 22,
                mobileSize: 14,
                response: 1.05,
              },
              {
                name: "Jakarta Picks",
                kind: "badge",
                text: "JAKARTA\nEATS.",
                color: "#E23744",
                ink: "#FFFFFF",
                x: 87,
                y: 32,
                size: 9,
                rotation: 12,
                layer: "front",
                mobileX: 86,
                mobileY: 26,
                mobileSize: 15,
                response: 1.2,
              },
            ]}
          />
        </div>
      </div>

      {/* Main Footer Navigation & Legal */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <CraverLogo size="lg" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#696969]">
              A community-powered restaurant discovery platform built around honest dining
              profiles, full digital food menus, and real dish photography across Jakarta.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/about#social"
                aria-label="CRAVER Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#696969] transition hover:border-[#E23744] hover:text-[#E23744]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link
                href="/about#social"
                aria-label="CRAVER YouTube"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#696969] transition hover:border-[#E23744] hover:text-[#E23744]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3v6Z" />
                </svg>
              </Link>
              <Link
                href="/about#social"
                aria-label="Share CRAVER"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#696969] transition hover:border-[#E23744] hover:text-[#E23744]"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#696969]">
              <li>
                <Link href="/explore" className="hover:text-[#E23744]">
                  Explore Restaurants
                </Link>
              </li>
              <li>
                <Link href="/explore?view=dishes" className="hover:text-[#E23744]">
                  Discover Food
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-[#E23744]">
                  Curated Collections
                </Link>
              </li>
              <li>
                <Link href="/explore?area=Senopati" className="hover:text-[#E23744]">
                  Senopati & SCBD
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
              Community
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#696969]">
              <li>
                <Link href="/contribute" className="hover:text-[#E23744]">
                  Community Contributions
                </Link>
              </li>
              <li>
                <Link href="/contribute" className="hover:text-[#E23744]">
                  Add a Restaurant
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#E23744]">
                  Saved Places & Reviews
                </Link>
              </li>
              {profile?.role === "admin" && (
                <li>
                  <Link href="/admin" className="font-semibold text-[#E23744] hover:underline">
                    Moderation Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#696969]">
              <li>
                <Link href="/about" className="hover:text-[#E23744]">
                  About CRAVER
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#E23744]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#E23744]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#E23744]">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#E8E8E8] pt-6 text-xs text-[#696969] sm:flex-row sm:items-center">
          <p>© 2026 CRAVER. All rights reserved.</p>
          <p>Curated restaurant discovery — menus, photography & community reviews.</p>
        </div>
      </div>
    </footer>
  );
}
