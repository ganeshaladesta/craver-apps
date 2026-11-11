import Link from "next/link";
import { BookOpen, Camera, MapPin, ShieldCheck, Users } from "lucide-react";

export const metadata = {
  title: "About CRAVER | Restaurant Discovery Platform",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
        About CRAVER
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
        Built for Discovering Places, Menus &amp; Honest Meals.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[#696969]">
        CRAVER takes inspiration from the classic restaurant discovery spirit: putting
        neighborhood dining rooms, complete menus, and real dish photography ahead of delivery
        discounts or algorithmic clutter.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
          <MapPin className="h-6 w-6 text-[#E23744]" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-[#1C1C1C]">
            Neighborhood Depth
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#696969]">
            From Senopati and SCBD to Menteng, Kemang, and PIK—search dining spots by cuisine,
            district, and typical spend per diner.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
          <BookOpen className="h-6 w-6 text-[#E23744]" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-[#1C1C1C]">
            Complete Menus
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#696969]">
            Inspect Best Sellers, Main Courses, Appetizers, Beverages, and Desserts with real IDR
            pricing before choosing your table.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
          <ShieldCheck className="h-6 w-6 text-[#E23744]" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-[#1C1C1C]">
            Moderated Quality
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#696969]">
            Every community-submitted restaurant and menu edit passes moderation so directory
            details remain accurate.
          </p>
        </div>
      </div>

      <section
        id="community"
        className="mt-12 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-6 sm:p-8"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold text-[#1C1C1C]">
              <Users className="h-5 w-5 text-[#E23744]" aria-hidden="true" />
              Community Guidelines
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#696969]">
              Share clear food photography, verified opening hours, and fair first-hand dining
              reviews. Duplicate listings or promotional spam are rejected during moderation.
            </p>
          </div>
          <Link
            href="/contribute"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#E23744] px-5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
          >
            Contribute to CRAVER
          </Link>
        </div>
      </section>

      <section id="social" className="mt-10 border-t border-[#E8E8E8] pt-8">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-[#1C1C1C]">
          <Camera className="h-5 w-5 text-[#E23744]" aria-hidden="true" />
          CRAVER Community Channels
        </h2>
        <p className="mt-2 text-sm text-[#696969]">
          Follow our weekly Jakarta dining dispatches, neighborhood dish guides, and curated
          collections right here on CRAVER.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="rounded-full border border-[#E8E8E8] px-4 py-2 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]"
          >
            Explore Directory
          </Link>
          <Link
            href="/collections"
            className="rounded-full border border-[#E8E8E8] px-4 py-2 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]"
          >
            Jakarta Collections
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-[#E8E8E8] px-4 py-2 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]"
          >
            Contact Team
          </Link>
        </div>
      </section>
    </div>
  );
}

