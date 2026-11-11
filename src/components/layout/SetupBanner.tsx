"use client";

import Link from "next/link";
import { Database } from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";

export function SetupBanner({ configured }: { configured: boolean }) {
  const { t } = useCraver();
  if (configured) return null;

  return (
    <div
      role="region"
      aria-label="Database setup notice"
      className="border-b border-[#E23744]/15 bg-[#FFF6E9] px-4 py-2 text-xs text-[#1C1C1C] sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium">
          <Database className="h-3.5 w-3.5 shrink-0 text-[#E23744]" aria-hidden="true" />
          <span>{t.common.setupBannerText}</span>
        </p>
        <Link
          href="/api/health"
          className="font-semibold text-[#C91D2B] underline hover:no-underline"
        >
          {t.common.checkHealthStatus}
        </Link>
      </div>
    </div>
  );
}
