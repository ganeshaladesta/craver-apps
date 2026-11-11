import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const rootDir = process.cwd();
const jiti = createJiti(import.meta.url, {
  alias: {
    "@": path.join(rootDir, "src"),
  },
});

const schemas = await jiti.import(path.join(rootDir, "src/lib/validation/schemas.ts"));
const utils = await jiti.import(path.join(rootDir, "src/lib/utils.ts"));
const supaConfig = await jiti.import(path.join(rootDir, "src/lib/supabase/config.ts"));
const i18nDetect = await jiti.import(path.join(rootDir, "src/lib/i18n/detect.ts"));
const i18nDict = await jiti.import(path.join(rootDir, "src/lib/i18n/dictionary.ts"));

test("Validation schemas accept valid CRAVER restaurant, menu, review, and profile payloads", () => {
  const restaurantRes = schemas.restaurantSchema.safeParse({
    name: "Kopi Senja Kemang",
    tagline: "Roastery and Indonesian comfort plates",
    description: "Warm neighborhood coffee room serving single-origin pour-overs and toasted buns.",
    primary_cuisine: "Coffee & Tea",
    cuisines: ["Coffee & Tea", "Dessert"],
    district: "Kemang",
    city: "Jakarta",
    address: "Jl. Kemang Selatan No. 12, Jakarta Selatan",
    opening_hours: { mon_fri: "08:00 - 21:00", sat_sun: "08:00 - 22:00" },
    average_price_idr: 95000,
    price_range: "$$",
  });
  assert.equal(restaurantRes.success, true);

  const reviewRes = schemas.reviewSchema.safeParse({
    restaurant_id: "11111111-1111-4111-8111-111111111101",
    rating: 5,
    title: "Standout charcoal flavor",
    comment: "The smoked duck nasi goreng and lime sambal hit a remarkable balance.",
    photo_urls: ["https://example.supabase.co/storage/v1/object/public/food-photos/test.jpg"],
  });
  assert.equal(reviewRes.success, true);

  const profileRes = schemas.profileSchema.safeParse({
    full_name: "Rani Kartika",
    username: "rani_jakarta",
    bio: "Noodle enthusiast around South Jakarta",
    city: "Senopati",
  });
  assert.equal(profileRes.success, true);
});

test("Validation schemas reject bad ratings, short comments, invalid usernames, and bad files", () => {
  const badReview = schemas.reviewSchema.safeParse({
    restaurant_id: "11111111-1111-4111-8111-111111111101",
    rating: 6,
    comment: "Too short",
  });
  assert.equal(badReview.success, false);

  const badMenu = schemas.menuItemSchema.safeParse({
    restaurant_id: "not-a-uuid",
    category_id: "also-not-a-uuid",
    name: "X",
    price_idr: 100,
  });
  assert.equal(badMenu.success, false);

  const badProfile = schemas.profileSchema.safeParse({
    full_name: "R",
    username: "invalid-name!",
  });
  assert.equal(badProfile.success, false);

  assert.equal(
    schemas.validateImageFile({ type: "image/svg+xml", size: 1024 }),
    "Only JPEG, PNG, WebP, or AVIF images are allowed."
  );
  assert.equal(
    schemas.validateImageFile({ type: "image/jpeg", size: 6 * 1024 * 1024 }),
    "Image file must be 5 MB or smaller."
  );
  assert.equal(schemas.validateImageFile({ type: "image/webp", size: 512 * 1024 }), null);
});

test("Utility formatters and CRAVER taxonomy match specification", () => {
  assert.equal(utils.slugify("Sera & Nusa Dining!"), "sera-nusa-dining");
  assert.equal(utils.formatCompactNumber(1500), "1.5k");
  assert.equal(utils.formatCompactNumber(1000), "1k");
  assert.equal(utils.formatCompactNumber(320), "320");
  assert.match(utils.formatIdr(150000), /150[.,]000/);
  assert.equal(utils.cn("a", false, { b: true, c: false }), "a b");

  assert.deepEqual(utils.CUISINE_CATEGORIES, [
    "All",
    "Indonesian",
    "Japanese",
    "Korean",
    "Chinese",
    "Western",
    "Italian",
    "Coffee & Tea",
    "Dessert",
    "Street Food",
    "Fast Food",
  ]);
  assert.deepEqual(utils.MENU_CATEGORY_PRESETS, [
    "Best Sellers",
    "Main Course",
    "Appetizers",
    "Snacks",
    "Beverages",
    "Desserts",
  ]);
});

test("Supabase config returns false on placeholder or missing env vars", () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project-ref.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-supabase-anon-key";
    assert.equal(supaConfig.isSupabaseConfigured(), false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdefg.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
    assert.equal(supaConfig.isSupabaseConfigured(), true);
  } finally {
    if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    if (prevKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
  }
});

test("All 4 mandatory Framer URLs are integrated into components and next.config.mjs", () => {
  const requiredUrls = [
    "https://framer.com/m/Slot-Text-with-3D-nxXVi4.js@hd1LcXRGqQlE3ymfziEq",
    "https://framer.com/m/Morphing-Mega-Menu-BuaezS.js@FjWbBoJw6peVHhCAVaPp",
    "https://framer.com/m/Motion-Minimal-Navs-4sTkwb.js@uK2yqMCOJeH6mshsdPfx",
    "https://framer.com/m/NudgeFooter-Y0uGHD.js@76mGJqpDgCzgbOFqtUEb",
  ];

  const framerImports = fs.readFileSync(
    path.join(rootDir, "src/components/framer/FramerImports.tsx"),
    "utf8"
  );
  const nextConfig = fs.readFileSync(path.join(rootDir, "next.config.mjs"), "utf8");

  for (const url of requiredUrls) {
    assert.ok(framerImports.includes(url), `Missing Framer import: ${url}`);
  }
  assert.ok(nextConfig.includes("urlImports"), "next.config.mjs must enable urlImports");
  assert.ok(nextConfig.includes("unframer"), "next.config.mjs must alias framer to unframer");
});

test("SQL migrations enforce RLS on all tables and seed all core dishes", () => {
  const schemaSql = fs.readFileSync(
    path.join(rootDir, "supabase/migrations/001_schema.sql"),
    "utf8"
  );
  const rlsSql = fs.readFileSync(
    path.join(rootDir, "supabase/migrations/002_rls_policies.sql"),
    "utf8"
  );
  const storageSql = fs.readFileSync(
    path.join(rootDir, "supabase/migrations/003_storage.sql"),
    "utf8"
  );
  const seedSql = fs.readFileSync(path.join(rootDir, "supabase/seed.sql"), "utf8");

  const tables = [
    "profiles",
    "restaurants",
    "menu_categories",
    "menu_items",
    "reviews",
    "photos",
    "favorites",
    "collections",
    "collection_items",
    "restaurant_updates",
    "content_reports",
    "notifications",
    "audit_logs",
  ];
  for (const tbl of tables) {
    assert.ok(
      rlsSql.includes(`alter table public.${tbl} enable row level security`),
      `RLS not enabled on ${tbl}`
    );
  }
  assert.ok(schemaSql.includes("recalculate_restaurant_rating"));
  assert.ok(rlsSql.includes("update_type <> 'closure_report'"));
  assert.ok(storageSql.includes("'restaurant-photos'") && storageSql.includes("'food-photos'"));

  for (const dish of [
    "Nasi Goreng",
    "Beef Ramen",
    "Chicken Katsu",
    "Matcha Latte",
    "Cheesecake",
    "Pasta Carbonara",
  ]) {
    assert.ok(seedSql.includes(dish), `Seed data missing dish: ${dish}`);
  }
});

test("Every local food and restaurant photo asset exists and is non-empty", () => {
  const expectedFiles = [
    "hero-jakarta-dining.jpg",
    "dish-nasi-goreng.jpg",
    "dish-beef-ramen.jpg",
    "dish-chicken-katsu.jpg",
    "dish-matcha-latte.jpg",
    "dish-cheesecake.jpg",
    "dish-pasta-carbonara.jpg",
    "dish-gourmet-burger.jpg",
    "rest-indonesian-senopati.jpg",
    "rest-japanese-scbd.jpg",
    "rest-italian-trattoria.jpg",
    "rest-korean-bbq.jpg",
    "rest-coffee-roastery.jpg",
    "rest-chinese-dimsum.jpg",
    "rest-western-steak.jpg",
  ];

  for (const file of expectedFiles) {
    const full = path.join(rootDir, "public/images", file);
    assert.ok(fs.existsSync(full), `Missing asset: ${file}`);
    assert.ok(fs.statSync(full).size > 5000, `Asset looks unexpectedly small/corrupt: ${file}`);
  }
});

test("Multi-FK PostgREST profile embeds qualify explicit foreign key constraints", () => {
  for (const relPath of [
    "src/lib/queries/restaurants.ts",
    "src/components/restaurants/RestaurantDetailClient.tsx",
    "src/app/admin/page.tsx",
    "src/app/api/admin/overview/route.ts",
  ]) {
    const src = fs.readFileSync(path.join(rootDir, relPath), "utf8");
    if (src.includes("submitter:profiles")) {
      assert.ok(
        src.includes("submitter:profiles!restaurant_updates_submitted_by_fkey"),
        `${relPath} must qualify submitter:profiles!restaurant_updates_submitted_by_fkey to avoid PGRST201`
      );
    }
  }
});

test("SiteHeader patches Framer MotionMinimalNavs text nodes safely without breaking React DOM children", () => {
  const headerSrc = fs.readFileSync(
    path.join(rootDir, "src/components/layout/SiteHeader.tsx"),
    "utf8"
  );
  const footerSrc = fs.readFileSync(
    path.join(rootDir, "src/components/layout/SiteFooter.tsx"),
    "utf8"
  );

  assert.ok(
    headerSrc.includes("createTreeWalker(rootEl, NodeFilter.SHOW_TEXT)"),
    "SiteHeader must update leaf Text.nodeValue in place instead of replacing <p>/<a> children"
  );
  assert.ok(
    !headerSrc.includes(".textContent ="),
    "SiteHeader must never assign .textContent directly on Framer RichText nodes (causes removeChild crash)"
  );
  assert.ok(
    !footerSrc.includes('layer: "back"'),
    "SiteFooter NudgeFooter badges should stay in front of the wordmark so text is not obscured"
  );
  assert.ok(
    !headerSrc.includes("craver-mega-wrap"),
    "SiteHeader must not render a second inline dark floating navbar pill alongside primary nav"
  );
  assert.ok(
    headerSrc.includes('id="craver-explore-megamenu"') && headerSrc.includes("MorphingMegaMenu"),
    "SiteHeader must house MorphingMegaMenu inside the single Explore dropdown"
  );
});

test("detectInitialLocale honors stored preference first, then browser language, falling back to en", () => {
  assert.equal(i18nDetect.detectInitialLocale("id", ["en-US"]), "id");
  assert.equal(i18nDetect.detectInitialLocale("en", ["id-ID"]), "en");
  assert.equal(i18nDetect.detectInitialLocale(null, ["id-ID", "en-US"]), "id");
  assert.equal(i18nDetect.detectInitialLocale(null, ["id"]), "id");
  assert.equal(i18nDetect.detectInitialLocale(undefined, ["en-GB"]), "en");
  assert.equal(i18nDetect.detectInitialLocale("invalid", ["fr-FR"]), "en");
  assert.equal(i18nDetect.detectInitialLocale(null, []), "en");
});

test("Bilingual dictionaries maintain strict recursive key and array parity between en and id", () => {
  function assertShapeMatch(enVal, idVal, keyPath) {
    assert.equal(typeof idVal, typeof enVal, `Type mismatch at ${keyPath}`);
    if (Array.isArray(enVal)) {
      assert.ok(Array.isArray(idVal), `Expected array at ${keyPath}`);
      assert.equal(idVal.length, enVal.length, `Array length mismatch at ${keyPath}`);
      for (let i = 0; i < enVal.length; i += 1) {
        assertShapeMatch(enVal[i], idVal[i], `${keyPath}[${i}]`);
      }
      return;
    }
    if (enVal && typeof enVal === "object") {
      const enKeys = Object.keys(enVal).sort();
      const idKeys = Object.keys(idVal).sort();
      assert.deepEqual(idKeys, enKeys, `Object key mismatch at ${keyPath}`);
      for (const k of enKeys) {
        assertShapeMatch(enVal[k], idVal[k], `${keyPath}.${k}`);
      }
      return;
    }
    if (typeof enVal === "string") {
      assert.ok(idVal.trim().length > 0, `Empty string at id.${keyPath}`);
    }
  }

  assertShapeMatch(i18nDict.translations.en, i18nDict.translations.id, "root");
  assert.deepEqual(
    Object.keys(i18nDict.CATEGORY_LABELS.en).sort(),
    Object.keys(i18nDict.CATEGORY_LABELS.id).sort(),
    "CATEGORY_LABELS keys must match across en and id"
  );
});

test("CRAVER 2.0 integrates BrandMarkRights, Programs, single footer landmark, and SignInCard2", () => {
  const framerImports = fs.readFileSync(
    path.join(rootDir, "src/components/framer/FramerImports.tsx"),
    "utf8"
  );
  const footerSrc = fs.readFileSync(
    path.join(rootDir, "src/components/layout/SiteFooter.tsx"),
    "utf8"
  );
  const authFormSrc = fs.readFileSync(
    path.join(rootDir, "src/components/auth/AuthForm.tsx"),
    "utf8"
  );
  const signInCardSrc = fs.readFileSync(
    path.join(rootDir, "src/components/auth/SignInCard2.tsx"),
    "utf8"
  );

  assert.ok(
    framerImports.includes("https://framer.com/m/BrandMarkRights-MDV1mM.js@V8hRWAFGaoA4xF6VucdB"),
    "Missing BrandMarkRights Framer import"
  );
  assert.ok(
    framerImports.includes("https://framer.com/m/Programs-fpaSe9.js@XeUSDe9VIrW0d2C0bOjk"),
    "Missing Programs Framer import"
  );
  const strippedFooter = footerSrc.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  assert.ok(
    !strippedFooter.includes("<footer"),
    "SiteFooter must not wrap BrandMarkRights in a nested <footer> landmark"
  );
  assert.ok(
    footerSrc.includes("<BrandMarkRights"),
    "SiteFooter must mount BrandMarkRights"
  );
  assert.ok(
    authFormSrc.includes("SignInCard2") && signInCardSrc.includes("resetPasswordForEmail"),
    "Auth flow must integrate SignInCard2 with forgot/reset password support"
  );
});
