"use client";

import Link from "next/link";
import { BookOpen, Camera, Flag, Mail, MapPin, PlusCircle, ShieldCheck, Users } from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";

export function AboutView() {
  const { t } = useCraver();
  const icons = [MapPin, BookOpen, ShieldCheck] as const;
  const accents = ["#FFF0F1", "#FFF6E9", "#E8F5E9"] as const;

  return (
    <div className="bg-white">
      <div className="border-b border-[#EEEEEE] bg-[#FFF6E9] py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E23744]">
            {t.legal.aboutEyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
            {t.legal.aboutTitle}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#696969]">{t.legal.aboutBody}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {t.legal.aboutCards.map((card, idx) => {
            const Icon = icons[idx] || MapPin;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-[#E8E8E8] p-6"
                style={{ backgroundColor: accents[idx] || "#FFFFFF" }}
              >
                <Icon className="h-6 w-6 text-[#E23744]" aria-hidden="true" />
                <h2 className="mt-3 font-display text-lg font-bold text-[#1C1C1C]">
                  {card.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#696969]">{card.body}</p>
              </div>
            );
          })}
        </div>

        <section
          id="community"
          className="mt-12 rounded-2xl border border-[#E8E8E8] bg-[#1C1C1C] p-6 text-white sm:p-8"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold text-white">
                <Users className="h-5 w-5 text-[#FFB800]" aria-hidden="true" />
                {t.legal.communityGuidelines}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                {t.legal.communityGuidelinesBody}
              </p>
            </div>
            <Link
              href="/contribute"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#E23744] px-5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
            >
              {t.legal.contributeCta}
            </Link>
          </div>
        </section>

        <section id="social" className="mt-10 border-t border-[#E8E8E8] pt-8">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-[#1C1C1C]">
            <Camera className="h-5 w-5 text-[#E23744]" aria-hidden="true" />
            {t.legal.channelsTitle}
          </h2>
          <p className="mt-2 text-sm text-[#696969]">{t.legal.channelsBody}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="rounded-full border border-[#E8E8E8] px-4 py-2 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]"
            >
              {t.legal.exploreDirectoryCta}
            </Link>
            <Link
              href="/collections"
              className="rounded-full border border-[#E8E8E8] px-4 py-2 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]"
            >
              {t.legal.jakartaCollectionsCta}
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-[#E8E8E8] px-4 py-2 text-xs font-semibold text-[#1C1C1C] hover:border-[#E23744]"
            >
              {t.legal.contactTeamCta}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ContactView() {
  const { t } = useCraver();
  return (
    <div className="bg-white">
      <div className="border-b border-[#EEEEEE] bg-[#FFF6E9] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E23744]">
            {t.legal.contactEyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
            {t.legal.contactTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#696969]">{t.legal.contactBody}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base font-bold text-[#1C1C1C]">
                  {t.legal.contactDeskTitle}
                </h2>
                <p className="mt-1 text-sm text-[#696969]">
                  {t.legal.contactDeskBodyBefore}{" "}
                  <span className="font-medium text-[#1C1C1C]">editorial@craver.id</span>{" "}
                  {t.legal.contactDeskBodyAfter}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-start gap-3">
              <PlusCircle className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base font-bold text-[#1C1C1C]">
                  {t.legal.contactSubmitTitle}
                </h2>
                <p className="mt-1 text-sm text-[#696969]">{t.legal.contactSubmitBody}</p>
                <Link
                  href="/contribute"
                  className="mt-3 inline-flex text-xs font-semibold text-[#E23744] hover:underline"
                >
                  {t.legal.contactSubmitLink}
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
            <div className="flex items-start gap-3">
              <Flag className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base font-bold text-[#1C1C1C]">
                  {t.legal.contactSuggestTitle}
                </h2>
                <p className="mt-1 text-sm text-[#696969]">{t.legal.contactSuggestBody}</p>
                <Link
                  href="/explore"
                  className="mt-3 inline-flex text-xs font-semibold text-[#E23744] hover:underline"
                >
                  {t.legal.contactSuggestLink}
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E8E8] bg-[#FFF6E9] p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base font-bold text-[#1C1C1C]">
                  {t.legal.contactCoverageTitle}
                </h2>
                <p className="mt-1 text-sm text-[#696969]">{t.legal.contactCoverageBody}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyView() {
  const { t } = useCraver();
  return (
    <div className="bg-white">
      <div className="border-b border-[#EEEEEE] bg-[#FFF6E9] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E23744]">
            {t.legal.legalEyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
            {t.legal.privacy}
          </h1>
          <p className="mt-2 text-xs text-[#696969]">{t.legal.privacyEffective}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6 text-sm leading-relaxed text-[#696969]">
          {t.legal.privacySections.map((sec) => (
            <section key={sec.title}>
              <h2 className="font-display text-lg font-bold text-[#1C1C1C]">{sec.title}</h2>
              <p className="mt-2">{sec.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TermsView() {
  const { t } = useCraver();
  return (
    <div className="bg-white">
      <div className="border-b border-[#EEEEEE] bg-[#FFF6E9] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E23744]">
            {t.legal.legalEyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
            {t.legal.terms}
          </h1>
          <p className="mt-2 text-xs text-[#696969]">{t.legal.termsUpdated}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6 text-sm leading-relaxed text-[#696969]">
          {t.legal.termsSections.map((sec) => (
            <section key={sec.title}>
              <h2 className="font-display text-lg font-bold text-[#1C1C1C]">{sec.title}</h2>
              <p className="mt-2">{sec.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RestaurantUnconfiguredView() {
  const { t } = useCraver();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FFF6E9] p-10">
        <h1 className="font-display text-2xl font-bold text-[#1C1C1C]">
          {t.restaurant.supabaseUnconfiguredTitle}
        </h1>
        <p className="mt-2 text-sm text-[#696969]">{t.restaurant.supabaseUnconfiguredDesc}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[#E23744] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
        >
          {t.restaurant.backHome}
        </Link>
      </div>
    </div>
  );
}

