import Link from "next/link";
import { Database } from "lucide-react";

export function SetupBanner({ configured }: { configured: boolean }) {
  if (configured) return null;

  return (
    <div
      role="region"
      aria-label="Database setup notice"
      className="border-b border-[#E8E8E8] bg-[#FFF0F1] px-4 py-2.5 text-xs text-[#1C1C1C] sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium">
          <Database className="h-4 w-4 shrink-0 text-[#E23744]" aria-hidden="true" />
          <span>
            Supabase environment variables are not configured yet. Add{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] border border-[#E8E8E8]">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            &{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] border border-[#E8E8E8]">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            in <code className="font-mono">.env.local</code> and run{" "}
            <code className="font-mono">supabase/migrations/*</code> +{" "}
            <code className="font-mono">supabase/seed.sql</code> to load live Jakarta data.
          </span>
        </p>
        <Link
          href="/api/health"
          className="font-semibold text-[#C91D2B] underline hover:no-underline"
        >
          Check Health Status
        </Link>
      </div>
    </div>
  );
}

