export type Locale = "id" | "en";

export const LOCALE_STORAGE_KEY = "craver:locale";

/**
 * Resolves initial locale following CRAVER rules:
 * 1. Explicit stored manual preference ("id" | "en") ALWAYS wins.
 * 2. On first visit (no saved preference), inspect preferred browser language:
 *    - "id" or "id-*" -> "id"
 *    - "en" or "en-*" -> "en"
 *    - unsupported -> fallback to "en"
 */
export function detectInitialLocale(
  storedLocale: string | null | undefined,
  navigatorLanguages?: readonly string[] | string | null
): Locale {
  if (storedLocale === "id" || storedLocale === "en") {
    return storedLocale;
  }

  const primary = Array.isArray(navigatorLanguages)
    ? navigatorLanguages[0]
    : typeof navigatorLanguages === "string"
      ? navigatorLanguages
      : undefined;

  if (!primary) return "en";
  const normalized = primary.trim().toLowerCase();
  if (normalized === "id" || normalized.startsWith("id-")) {
    return "id";
  }
  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }
  return "en";
}

