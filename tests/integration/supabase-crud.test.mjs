import test from "node:test";
import assert from "node:assert/strict";
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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured =
  Boolean(url && anonKey && serviceRoleKey) &&
  !url.includes("your-project-ref") &&
  !anonKey.includes("your-supabase-anon-key") &&
  !serviceRoleKey.includes("your-supabase-service-role-key");

test(
  "Live Supabase CRUD, Moderation & RLS enforcement suite",
  { skip: !isConfigured && "Supabase credentials not set in .env.local" },
  async () => {
    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const uniqueSuffix = Date.now();
    const testEmail = `craver_test_${uniqueSuffix}@example.com`;
    const testPassword = `TestPass_${uniqueSuffix}!`;

    // 1. Create disposable test member via Admin Auth API
    const { data: createdAuth, error: authErr } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: "Integration Test User" },
    });
    assert.ifError(authErr);
    const userId = createdAuth.user.id;

    // Sign in as normal user (subject to RLS)
    const userClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInErr } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    assert.ifError(signInErr);

    let createdRestaurantId = null;

    try {
      // 2. RLS negative check: non-admin user cannot escalate role on profiles
      const { error: escalateErr } = await userClient
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);
      assert.ok(escalateErr, "Non-admin user must be blocked from setting role='admin'");

      // 3. RLS check: non-admin submitting restaurant gets forced into 'pending', not 'approved'
      const { data: submittedRest, error: restInsertErr } = await userClient
        .from("restaurants")
        .insert({
          slug: `test-warung-${uniqueSuffix}`,
          name: `Test Warung ${uniqueSuffix}`,
          tagline: "Test tagline",
          description: "Test integration restaurant description with enough length.",
          primary_cuisine: "Indonesian",
          cuisines: ["Indonesian"],
          district: "Senopati",
          city: "Jakarta",
          address: "Jl. Senopati No. 99",
          opening_hours: { mon_fri: "10:00 - 22:00", sat_sun: "10:00 - 22:00" },
          average_price_idr: 95000,
          price_range: "$$",
          status: "approved", // Should be downgraded to pending by trigger/RLS!
          created_by: userId,
        })
        .select("*")
        .single();

      // Either RLS rejects status='approved' on insert OR trigger coerces to 'pending'
      if (restInsertErr) {
        const { data: pendingRest, error: pendingErr } = await userClient
          .from("restaurants")
          .insert({
            slug: `test-warung-${uniqueSuffix}`,
            name: `Test Warung ${uniqueSuffix}`,
            tagline: "Test tagline",
            description: "Test integration restaurant description with enough length.",
            primary_cuisine: "Indonesian",
            cuisines: ["Indonesian"],
            district: "Senopati",
            city: "Jakarta",
            address: "Jl. Senopati No. 99",
            opening_hours: { mon_fri: "10:00 - 22:00", sat_sun: "10:00 - 22:00" },
            average_price_idr: 95000,
            price_range: "$$",
            status: "pending",
            created_by: userId,
          })
          .select("*")
          .single();
        assert.ifError(pendingErr);
        createdRestaurantId = pendingRest.id;
      } else {
        assert.notEqual(submittedRest.status, "approved");
        createdRestaurantId = submittedRest.id;
      }

      // Anonymous public query must NOT see unapproved restaurant
      const { data: anonRead } = await anonClient
        .from("restaurants")
        .select("id")
        .eq("id", createdRestaurantId)
        .maybeSingle();
      assert.equal(anonRead, null, "Pending restaurant must not be visible anonymously");

      // 4. Admin approves restaurant via service role
      const { error: approveErr } = await adminClient
        .from("restaurants")
        .update({ status: "approved", is_verified: true })
        .eq("id", createdRestaurantId);
      assert.ifError(approveErr);

      // 5. User adds review & rating aggregation trigger recalculates restaurant rating
      const { error: revErr } = await userClient.from("reviews").insert({
        restaurant_id: createdRestaurantId,
        user_id: userId,
        rating: 4,
        title: "Solid spot",
        comment: "Clean dining area and well seasoned signature dishes.",
      });
      assert.ifError(revErr);

      const { data: refreshedRest } = await anonClient
        .from("restaurants")
        .select("rating_avg, reviews_count")
        .eq("id", createdRestaurantId)
        .single();
      assert.equal(Number(refreshedRest.rating_avg), 4);
      assert.equal(refreshedRest.reviews_count, 1);

      // 6. User manages favorite & personal collection CRUD
      const { error: favErr } = await userClient.from("favorites").insert({
        user_id: userId,
        restaurant_id: createdRestaurantId,
      });
      assert.ifError(favErr);

      const { data: col, error: colErr } = await userClient
        .from("collections")
        .insert({
          user_id: userId,
          title: `Test List ${uniqueSuffix}`,
          slug: `test-list-${uniqueSuffix}`,
          description: "Private test collection",
          is_public: false,
        })
        .select("*")
        .single();
      assert.ifError(colErr);

      const { data: colAnon } = await anonClient
        .from("collections")
        .select("id")
        .eq("id", col.id)
        .maybeSingle();
      assert.equal(colAnon, null, "Private collection must not leak anonymously");
    } finally {
      if (createdRestaurantId) {
        await adminClient.from("restaurants").delete().eq("id", createdRestaurantId);
      }
      await adminClient.auth.admin.deleteUser(userId);
    }
  }
);

