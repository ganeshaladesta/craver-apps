import Link from "next/link";
import { cn } from "@/lib/utils";

interface CraverLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  linked?: boolean;
}

export function CraverLogo({
  className,
  size = "md",
  linked = true,
}: CraverLogoProps) {
  const iconDims =
    size === "sm"
      ? "h-7 w-7"
      : size === "lg"
        ? "h-10 w-10"
        : "h-7 w-7 sm:h-8 sm:w-8";
  const textSize =
    size === "sm"
      ? "text-lg tracking-[-0.03em]"
      : size === "lg"
        ? "text-2xl tracking-[-0.04em]"
        : "text-lg sm:text-xl tracking-[-0.035em]";

  const content = (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-[#E23744] text-white shrink-0 shadow-xs",
          iconDims
        )}
        aria-hidden="true"
      >
        {/* Minimalist Location Pin + Fork Tines Food Mark */}
        <svg
          viewBox="0 0 28 28"
          fill="none"
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 2.75C8.891 2.75 4.75 6.891 4.75 12C4.75 18.21 12.14 24.47 13.38 25.47C13.74 25.76 14.26 25.76 14.62 25.47C15.86 24.47 23.25 18.21 23.25 12C23.25 6.891 19.109 2.75 14 2.75Z"
            fill="currentColor"
          />
          <path
            d="M11.75 8.5V11.8C11.75 12.75 12.45 13.45 13.3 13.62V18.25H14.7V13.62C15.55 13.45 16.25 12.75 16.25 11.8V8.5H15.05V11.25H14.45V8.5H13.55V11.25H12.95V8.5H11.75Z"
            fill="#E23744"
          />
        </svg>
      </span>
      <span
        className={cn(
          "font-display font-extrabold text-[#1C1C1C]",
          textSize
        )}
      >
        CRAVER
      </span>
    </span>
  );

  if (!linked) return content;

  return (
    <Link
      href="/"
      aria-label="CRAVER Home"
      className="inline-flex items-center rounded-md focus-visible:outline-offset-4"
    >
      {content}
    </Link>
  );
}

