import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/validation/schemas";

export type CraverBucket = "restaurant-photos" | "food-photos" | "avatars";

export async function uploadImageToSupabase({
  file,
  bucket,
  userId,
  folder = "uploads",
}: {
  file: File;
  bucket: CraverBucket;
  userId: string;
  folder?: string;
}): Promise<{ publicUrl: string; storagePath: string }> {
  const error = validateImageFile(file);
  if (error) {
    throw new Error(error);
  }

  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add credentials in .env.local.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeBase = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .slice(0, 32);
  const storagePath = `${userId}/${folder}/${Date.now()}-${safeBase || "image"}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return {
    publicUrl: data.publicUrl,
    storagePath,
  };
}

export async function removeImageFromSupabase(
  bucket: CraverBucket,
  storagePath: string | null | undefined
) {
  if (!storagePath) return;
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.storage.from(bucket).remove([storagePath]);
}

