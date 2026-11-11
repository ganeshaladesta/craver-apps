import { ContributeWizard } from "@/components/contribute/ContributeWizard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { MenuCategory, MenuItem, Photo, Restaurant } from "@/types/database";

export const dynamic = "force-dynamic";

interface ContributePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContributePage({
  searchParams,
}: ContributePageProps) {
  const sp = await searchParams;
  const stepRaw = Array.isArray(sp.step) ? sp.step[0] : sp.step;
  const editId = Array.isArray(sp.edit) ? sp.edit[0] : sp.edit;
  const initialStep = Math.max(1, Math.min(5, Number(stepRaw || "1") || 1));

  const configured = isSupabaseConfigured();
  let editRestaurant: Restaurant | null = null;
  let editCategories: MenuCategory[] = [];
  let editItems: MenuItem[] = [];
  let editPhotos: Photo[] = [];

  if (configured && editId) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: rest } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", editId)
        .maybeSingle();

      if (rest) {
        editRestaurant = rest as Restaurant;
        const [catsRes, itemsRes, photosRes] = await Promise.all([
          supabase.from("menu_categories").select("*").eq("restaurant_id", rest.id),
          supabase.from("menu_items").select("*").eq("restaurant_id", rest.id),
          supabase.from("photos").select("*").eq("restaurant_id", rest.id),
        ]);
        editCategories = (catsRes.data ?? []) as MenuCategory[];
        editItems = (itemsRes.data ?? []) as MenuItem[];
        editPhotos = (photosRes.data ?? []) as Photo[];
      }
    }
  }

  return (
    <ContributeWizard
      configured={configured}
      initialStep={initialStep}
      editRestaurant={editRestaurant}
      editCategories={editCategories}
      editItems={editItems}
      editPhotos={editPhotos}
    />
  );
}

