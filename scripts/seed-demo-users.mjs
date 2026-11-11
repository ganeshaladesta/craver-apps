import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let val = trimmed.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (
  !url ||
  !serviceRoleKey ||
  url.includes("your-project-ref") ||
  serviceRoleKey.includes("your-supabase-service-role-key")
) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment / .env.local."
  );
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser({ email, password, full_name, username, role, city, bio }) {
  const { data: listRes, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  let user = listRes.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const { data: createRes, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createErr) throw createErr;
    user = createRes.user;
    console.log(`Created auth user: ${email}`);
  } else {
    console.log(`Found existing auth user: ${email}`);
  }

  const { error: profErr } = await supabaseAdmin
    .from("profiles")
    .update({ full_name, username, role, city, bio })
    .eq("id", user.id);
  if (profErr) throw profErr;

  return user;
}

async function main() {
  const adminUser = await ensureUser({
    email: "admin@craver.id",
    password: "CraverAdmin2026!",
    full_name: "Nadia Kusuma",
    username: "nadia_admin",
    role: "admin",
    city: "Menteng",
    bio: "CRAVER Jakarta Editorial & Moderation Lead",
  });

  const dinerUser = await ensureUser({
    email: "diner@craver.id",
    password: "CraverDiner2026!",
    full_name: "Bima Pratama",
    username: "bima_eats",
    role: "user",
    city: "Senopati",
    bio: "Weekend ramen & roastery explorer across South Jakarta",
  });

  const sampleReviews = [
    {
      restaurant_id: "11111111-1111-4111-8111-111111111101",
      user_id: dinerUser.id,
      rating: 5,
      title: "Smoked duck nasi goreng worth every visit",
      comment:
        "Charcoal aroma stands out immediately without overpowering the sambal kecombrang. Great sunlit courtyard service at lunch.",
      visit_date: "2026-09-14",
      photo_urls: ["/images/dish-nasi-goreng.jpg"],
      status: "published",
    },
    {
      restaurant_id: "11111111-1111-4111-8111-111111111102",
      user_id: dinerUser.id,
      rating: 5,
      title: "Rich wagyu tare & crisp katsu",
      comment:
        "Counter seating keeps the bowls steaming hot. The 48-hour beef broth pairs cleanly with homemade thin alkaline noodles.",
      visit_date: "2026-09-28",
      photo_urls: ["/images/dish-beef-ramen.jpg", "/images/dish-chicken-katsu.jpg"],
      status: "published",
    },
    {
      restaurant_id: "11111111-1111-4111-8111-111111111103",
      user_id: dinerUser.id,
      rating: 5,
      title: "Proper guanciale carbonara in Menteng",
      comment:
        "Silky Pecorino sauce with crisp peppercorn kick and al dente rigatoni. Quiet garden terrace works well for dinner.",
      visit_date: "2026-10-05",
      photo_urls: ["/images/dish-pasta-carbonara.jpg"],
      status: "published",
    },
  ];

  const { error: revErr } = await supabaseAdmin
    .from("reviews")
    .upsert(sampleReviews, { onConflict: "restaurant_id,user_id" });
  if (revErr) {
    console.warn("Skipped sample reviews (run supabase/seed.sql first):", revErr.message);
  } else {
    console.log("Upserted 3 demo reviews (rating aggregation triggers updated automatically).");
  }

  // Ensure curated collections attribute nicely if admin owns them
  await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: dinerUser.id,
      title: "Welcome to CRAVER Jakarta",
      body: "Explore verified restaurant menus or contribute your favorite dining room.",
      link: "/explore",
    });

  console.log("Demo seed completed:", { adminId: adminUser.id, dinerId: dinerUser.id });
}

main().catch((err) => {
  console.error("Failed to seed demo users:", err);
  process.exit(1);
});

