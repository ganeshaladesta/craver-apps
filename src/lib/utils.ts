export function cn(
  ...inputs: Array<string | false | null | undefined | Record<string, boolean | undefined>>
): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  return classes.join(" ");
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactNumber(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export const JAKARTA_AREAS = [
  "All Jakarta",
  "Senopati",
  "SCBD",
  "Kemang",
  "Menteng",
  "PIK",
  "Kuningan",
  "Kelapa Gading",
  "Blok M",
  "Sudirman",
] as const;

export const CUISINE_CATEGORIES = [
  "All",
  "Indonesian",
  "Japanese",
  "Korean",
  "Chinese",
  "Western",
  "Italian",
  "Coffee & Tea",
  "Dessert",
  "Fast Food",
] as const;

export const MENU_CATEGORY_PRESETS = [
  "Best Sellers",
  "Main Course",
  "Appetizers",
  "Snacks",
  "Beverages",
  "Desserts",
] as const;
