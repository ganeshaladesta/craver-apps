import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F1] text-[#E23744]">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="mt-4 font-display text-3xl font-extrabold text-[#1C1C1C]">
        Page or Restaurant Not Found
      </h1>
      <p className="mt-2 text-sm text-[#696969]">
        The restaurant profile or discovery page you are looking for may have moved or has not
        yet been published.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#E23744] px-5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
        >
          Go Home
        </Link>
        <Link
          href="/explore"
          className="inline-flex min-h-11 items-center rounded-xl border border-[#E8E8E8] bg-white px-5 text-sm font-semibold text-[#1C1C1C] hover:border-[#E23744]"
        >
          Explore Restaurants
        </Link>
      </div>
    </div>
  );
}

