"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { useCraver } from "@/components/providers/CraverProviders";
import { formatT, translateCategory } from "@/lib/i18n/dictionary";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadImageToSupabase } from "@/lib/supabase/storage";
import { restaurantSchema } from "@/lib/validation/schemas";
import {
  cn,
  CUISINE_CATEGORIES,
  formatIdr,
  JAKARTA_AREAS,
  MENU_CATEGORY_PRESETS,
  slugify,
} from "@/lib/utils";
import type { MenuCategory, MenuItem, Photo, Restaurant } from "@/types/database";

interface DraftMenuEntry {
  localId: string;
  categoryName: string;
  name: string;
  description: string;
  price_idr: number;
  photo_url: string;
  is_popular: boolean;
}

interface DraftPhotoEntry {
  localId: string;
  url: string;
  storage_path: string;
  caption: string;
  photo_type: "cover" | "gallery" | "food";
}

interface ContributeWizardProps {
  configured: boolean;
  initialStep?: number;
  editRestaurant?: Restaurant | null;
  editCategories?: MenuCategory[];
  editItems?: MenuItem[];
  editPhotos?: Photo[];
}

export function ContributeWizard({
  configured,
  initialStep = 1,
  editRestaurant = null,
  editCategories = [],
  editItems = [],
  editPhotos = [],
}: ContributeWizardProps) {
  const router = useRouter();
  const { user, profile, showToast, locale, t } = useCraver();
  const isAdmin = profile?.role === "admin";
  const stepsList = t.contribute.steps.map((title, idx) => ({ num: idx + 1, title }));

  const [step, setStep] = useState<number>(
    Math.min(5, Math.max(1, initialStep || 1))
  );
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 fields
  const [name, setName] = useState(editRestaurant?.name ?? "");
  const [tagline, setTagline] = useState(editRestaurant?.tagline ?? "");
  const [description, setDescription] = useState(editRestaurant?.description ?? "");
  const [primaryCuisine, setPrimaryCuisine] = useState(
    editRestaurant?.primary_cuisine ?? "Indonesian"
  );
  const [cuisines, setCuisines] = useState<string[]>(
    editRestaurant?.cuisines?.length ? editRestaurant.cuisines : ["Indonesian"]
  );
  const [avgPriceIdr, setAvgPriceIdr] = useState(
    String(editRestaurant?.average_price_idr ?? 150000)
  );
  const [priceRange, setPriceRange] = useState<"$" | "$$" | "$$$" | "$$$$">(
    editRestaurant?.price_range ?? "$$"
  );
  const [monFriHours, setMonFriHours] = useState(
    editRestaurant?.opening_hours?.mon_fri ?? "10:00 - 22:00"
  );
  const [satSunHours, setSatSunHours] = useState(
    editRestaurant?.opening_hours?.sat_sun ?? "10:00 - 23:00"
  );
  const [hoursNotes, setHoursNotes] = useState(
    editRestaurant?.opening_hours?.notes ?? ""
  );
  const [phone, setPhone] = useState(editRestaurant?.phone ?? "");
  const [website, setWebsite] = useState(editRestaurant?.website ?? "");
  const [email, setEmail] = useState(editRestaurant?.email ?? "");

  // Step 2 fields
  const [city, setCity] = useState(editRestaurant?.city ?? "Jakarta");
  const [district, setDistrict] = useState(editRestaurant?.district ?? "Senopati");
  const [address, setAddress] = useState(editRestaurant?.address ?? "");
  const [latitude, setLatitude] = useState(
    editRestaurant?.latitude != null ? String(editRestaurant.latitude) : ""
  );
  const [longitude, setLongitude] = useState(
    editRestaurant?.longitude != null ? String(editRestaurant.longitude) : ""
  );

  // Step 3 fields (menu dishes)
  const initialMenuDrafts: DraftMenuEntry[] = editItems.map((item) => {
    const cat = editCategories.find((c) => c.id === item.category_id);
    return {
      localId: item.id,
      categoryName: cat?.name || "Best Sellers",
      name: item.name,
      description: item.description,
      price_idr: item.price_idr,
      photo_url: item.photo_url || "",
      is_popular: item.is_popular,
    };
  });

  const [menuEntries, setMenuEntries] = useState<DraftMenuEntry[]>(
    initialMenuDrafts
  );
  const [newDishCategory, setNewDishCategory] = useState<string>("Best Sellers");
  const [newDishName, setNewDishName] = useState("");
  const [newDishDesc, setNewDishDesc] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("75000");
  const [newDishPhotoUrl, setNewDishPhotoUrl] = useState("");
  const [newDishPopular, setNewDishPopular] = useState(true);
  const [uploadingDishImg, setUploadingDishImg] = useState(false);

  // Step 4 fields (photos)
  const [coverImageUrl, setCoverImageUrl] = useState(
    editRestaurant?.cover_image_url ?? ""
  );
  const [photos, setPhotos] = useState<DraftPhotoEntry[]>(
    editPhotos.map((p) => ({
      localId: p.id,
      url: p.url,
      storage_path: p.storage_path || "",
      caption: p.caption || "",
      photo_type: p.photo_type === "cover" || p.photo_type === "food" ? p.photo_type : "gallery",
    }))
  );
  const [uploadingGalleryImg, setUploadingGalleryImg] = useState(false);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

  const toggleCuisine = (c: string) => {
    setCuisines((prev) => {
      if (prev.includes(c)) {
        return prev.length > 1 ? prev.filter((item) => item !== c) : prev;
      }
      return [...prev, c];
    });
  };

  const validateCurrentStep = (targetStep: number): string[] => {
    const errs: string[] = [];
    if (targetStep === 1) {
      if (name.trim().length < 2)
        errs.push("Restaurant name must be at least 2 characters.");
      if (description.trim().length < 15)
        errs.push("Description must be at least 15 characters.");
      if (!primaryCuisine) errs.push("Select a primary cuisine.");
      if (Number(avgPriceIdr) < 10000)
        errs.push("Average price per person must be at least Rp 10,000.");
      if (website.trim() && !/^https?:\/\//i.test(website.trim()))
        errs.push("Website URL must start with https:// or http://.");
    }
    if (targetStep === 2) {
      if (district.trim().length < 2) errs.push("Select or enter a Jakarta area.");
      if (address.trim().length < 5) errs.push("Enter a complete street address.");
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateCurrentStep(step);
    if (errs.length > 0) {
      setStepErrors(errs);
      setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }
    setStepErrors([]);
    setStep((s) => Math.min(5, s + 1));
  };

  const handleBack = () => {
    setStepErrors([]);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleAddDraftDish = () => {
    if (newDishName.trim().length < 2) {
      showToast("Enter a dish name (at least 2 characters).", "error");
      return;
    }
    const numericPrice = Number(newDishPrice);
    if (!Number.isFinite(numericPrice) || numericPrice < 1000) {
      showToast("Enter a valid IDR price (minimum Rp 1,000).", "error");
      return;
    }

    setMenuEntries((prev) => [
      ...prev,
      {
        localId: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        categoryName: newDishCategory,
        name: newDishName.trim(),
        description: newDishDesc.trim(),
        price_idr: numericPrice,
        photo_url: newDishPhotoUrl,
        is_popular: newDishPopular,
      },
    ]);
    setNewDishName("");
    setNewDishDesc("");
    setNewDishPrice("75000");
    setNewDishPhotoUrl("");
    showToast("Dish added to menu draft.", "success");
  };

  const handleDishFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    try {
      setUploadingDishImg(true);
      const uploaded = await uploadImageToSupabase({
        file,
        bucket: "food-photos",
        userId: user.id,
        folder: "contribute-dishes",
      });
      setNewDishPhotoUrl(uploaded.publicUrl);
      showToast("Dish photo uploaded.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setUploadingDishImg(false);
    }
  };

  const handleRestaurantPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    asCover: boolean
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    try {
      setUploadingGalleryImg(true);
      const uploaded = await uploadImageToSupabase({
        file,
        bucket: "restaurant-photos",
        userId: user.id,
        folder: "contribute-venues",
      });
      if (asCover || !coverImageUrl) {
        setCoverImageUrl(uploaded.publicUrl);
      }
      setPhotos((prev) => [
        ...prev,
        {
          localId: `photo-${Date.now()}`,
          url: uploaded.publicUrl,
          storage_path: uploaded.storagePath,
          caption: asCover ? "Cover photo" : "Dining room & atmosphere",
          photo_type: asCover ? "cover" : "gallery",
        },
      ]);
      showToast(asCover ? "Cover image uploaded." : "Gallery photo uploaded.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setUploadingGalleryImg(false);
    }
  };

  const handleFinalSave = async (targetStatus: "draft" | "pending") => {
    if (!configured || !user) {
      showToast("Sign in after configuring Supabase to submit.", "error");
      return;
    }

    const combinedErrs = [
      ...validateCurrentStep(1),
      ...validateCurrentStep(2),
    ];
    if (combinedErrs.length > 0) {
      setStepErrors(combinedErrs);
      setStep(validateCurrentStep(1).length > 0 ? 1 : 2);
      return;
    }

    const parsed = restaurantSchema.safeParse({
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      primary_cuisine: primaryCuisine,
      cuisines: Array.from(new Set([primaryCuisine, ...cuisines])),
      district: district.trim(),
      city: city.trim() || "Jakarta",
      address: address.trim(),
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
      phone: phone.trim() || null,
      website: website.trim() || null,
      email: email.trim() || null,
      opening_hours: {
        mon_fri: monFriHours.trim() || "10:00 - 22:00",
        sat_sun: satSunHours.trim() || "10:00 - 23:00",
        notes: hoursNotes.trim(),
      },
      average_price_idr: Number(avgPriceIdr),
      price_range: priceRange,
      cover_image_url: coverImageUrl || photos[0]?.url || "/images/rest-indonesian-senopati.jpg",
    });

    if (!parsed.success) {
      setStepErrors(parsed.error.issues.map((i) => i.message));
      setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setSubmitting(true);
    try {
      const effectiveStatus =
        targetStatus === "draft" ? "draft" : isAdmin ? "approved" : "pending";

      let restaurantId = editRestaurant?.id;
      let restaurantSlug = editRestaurant?.slug;

      if (editRestaurant) {
        const { data: updated, error: updateErr } = await supabase
          .from("restaurants")
          .update({
            ...parsed.data,
            status: effectiveStatus,
          })
          .eq("id", editRestaurant.id)
          .select("*")
          .single();

        if (updateErr || !updated) {
          throw new Error(updateErr?.message || "Failed to update restaurant.");
        }
        restaurantId = updated.id;
        restaurantSlug = updated.slug;
      } else {
        const slugBase = slugify(parsed.data.name) || "restaurant";
        const uniqueSlug = `${slugBase}-${Date.now().toString().slice(-5)}`;
        const { data: inserted, error: insertErr } = await supabase
          .from("restaurants")
          .insert({
            ...parsed.data,
            slug: uniqueSlug,
            status: effectiveStatus,
            created_by: user.id,
            approved_by: effectiveStatus === "approved" ? user.id : null,
            approved_at:
              effectiveStatus === "approved" ? new Date().toISOString() : null,
          })
          .select("*")
          .single();

        if (insertErr || !inserted) {
          throw new Error(insertErr?.message || "Failed to create restaurant.");
        }
        restaurantId = inserted.id;
        restaurantSlug = inserted.slug;
      }

      // Insert menu categories & items for newly added draft dishes
      if (restaurantId && menuEntries.length > 0) {
        const itemStatus = isAdmin ? "approved" : "pending";
        const { data: existingCats } = await supabase
          .from("menu_categories")
          .select("*")
          .eq("restaurant_id", restaurantId);

        const catMap = new Map<string, string>();
        for (const cat of (existingCats ?? []) as MenuCategory[]) {
          catMap.set(cat.name.toLowerCase(), cat.id);
        }

        for (const entry of menuEntries) {
          let categoryId = catMap.get(entry.categoryName.toLowerCase());
          if (!categoryId) {
            const { data: createdCat, error: catErr } = await supabase
              .from("menu_categories")
              .insert({
                restaurant_id: restaurantId,
                name: entry.categoryName,
                description: "",
                sort_order: catMap.size + 1,
                status: itemStatus,
                created_by: user.id,
              })
              .select("id")
              .single();

            if (!catErr && createdCat) {
              categoryId = createdCat.id;
              catMap.set(entry.categoryName.toLowerCase(), createdCat.id);
            }
          }

          if (categoryId && entry.localId.startsWith("draft-")) {
            await supabase.from("menu_items").insert({
              restaurant_id: restaurantId,
              category_id: categoryId,
              name: entry.name,
              description: entry.description,
              price_idr: entry.price_idr,
              photo_url: entry.photo_url || null,
              is_available: true,
              is_popular: entry.is_popular,
              is_featured_dish: false,
              status: itemStatus,
              created_by: user.id,
            });
          }
        }
      }

      // Insert newly uploaded photos not already stored
      if (restaurantId) {
        const freshPhotos = photos.filter((p) => p.localId.startsWith("photo-"));
        if (freshPhotos.length > 0) {
          await supabase.from("photos").insert(
            freshPhotos.map((p) => ({
              restaurant_id: restaurantId,
              user_id: user.id,
              url: p.url,
              storage_path: p.storage_path || null,
              caption: p.caption,
              photo_type: p.photo_type,
              status: "approved",
            }))
          );
        }
      }

      showToast(
        targetStatus === "draft"
          ? "Saved draft submission to your profile."
          : isAdmin
            ? "Restaurant published live on CRAVER."
            : "Restaurant submitted! Pending administrator moderation.",
        "success"
      );

      router.push(
        effectiveStatus === "approved" && restaurantSlug
          ? `/restaurants/${restaurantSlug}`
          : "/profile?tab=contributions"
      );
      router.refresh();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="border-b border-[#EEEEEE] bg-[#FFF6E9] py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E23744]">
            {t.contribute.eyebrow}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C] sm:text-4xl">
            {t.contribute.title}
          </h1>
          <p className="mt-2 text-sm text-[#696969]">{t.contribute.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {!configured ? (
          <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FFF6E9] p-8 text-center">
            <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
              {t.contribute.configureTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#696969]">
              {t.contribute.configureDesc}
            </p>
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-[#E8E8E8] bg-[#FFF6E9] p-10 text-center">
            <h2 className="font-display text-xl font-bold text-[#1C1C1C]">
              {t.contribute.signInTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#696969]">
              {t.contribute.signInDesc}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth/login?next=/contribute"
                className="rounded-full bg-[#E23744] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#C91D2B]"
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/auth/signup?next=/contribute"
                className="rounded-full border border-[#E8E8E8] bg-white px-6 py-2.5 text-sm font-semibold text-[#1C1C1C] hover:border-[#E23744]"
              >
                {t.nav.createAccount}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress Indicator */}
            <nav aria-label="Progress">
              <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {stepsList.map((s) => {
                  const isCurrent = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <li
                      key={s.num}
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-xs transition",
                        isCurrent
                          ? "border-[#E23744] bg-[#FFF0F1] font-bold text-[#C91D2B]"
                          : isDone
                            ? "border-[#E8E8E8] bg-[#FAFAFA] font-semibold text-[#1C1C1C]"
                            : "border-[#E8E8E8] bg-white text-[#696969]"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (s.num < step || validateCurrentStep(step).length === 0) {
                            setStepErrors([]);
                            setStep(s.num);
                          }
                        }}
                        className="flex w-full items-center gap-2 text-left"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            isCurrent
                              ? "bg-[#E23744] text-white"
                              : isDone
                                ? "bg-[#1C1C1C] text-white"
                                : "border border-[#E8E8E8] text-[#696969]"
                          )}
                        >
                          {isDone ? <Check className="h-3 w-3" aria-hidden="true" /> : s.num}
                        </span>
                        <span className="truncate">{s.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            {/* Error Summary */}
            {stepErrors.length > 0 && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                className="rounded-xl border border-[#C91D2B] bg-[#FFF0F1] p-4 text-sm text-[#C91D2B]"
              >
                <p className="font-bold">{t.contribute.fixBeforeContinue}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                  {stepErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Active Step Form Panel */}
            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 sm:p-8">
              {step === 1 && (
                <div className="space-y-5">
                  <h2
                    ref={stepHeadingRef}
                    tabIndex={-1}
                    className="font-display text-xl font-bold text-[#1C1C1C] focus:outline-none"
                  >
                    {t.contribute.step1Title}
                  </h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-name" className="block text-xs font-semibold">
                        {t.contribute.nameLabel}
                      </label>
                      <input
                        id="c-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder={t.contribute.namePlaceholder}
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="c-tagline" className="block text-xs font-semibold">
                        {t.contribute.taglineLabel}
                      </label>
                      <input
                        id="c-tagline"
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder={t.contribute.taglinePlaceholder}
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="c-desc" className="block text-xs font-semibold">
                      {t.contribute.descLabel}
                    </label>
                    <textarea
                      id="c-desc"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      minLength={15}
                      placeholder={t.contribute.descPlaceholder}
                      className="mt-1 w-full rounded-lg border border-[#E8E8E8] p-3 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="c-primary-cuisine" className="block text-xs font-semibold">
                        {t.contribute.primaryCuisineLabel}
                      </label>
                      <select
                        id="c-primary-cuisine"
                        value={primaryCuisine}
                        onChange={(e) => {
                          setPrimaryCuisine(e.target.value);
                          if (!cuisines.includes(e.target.value)) {
                            setCuisines((prev) => [...prev, e.target.value]);
                          }
                        }}
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                      >
                        {CUISINE_CATEGORIES.filter((c) => c !== "All").map((c) => (
                          <option key={c} value={c}>
                            {translateCategory(c, locale)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="c-avg-price" className="block text-xs font-semibold">
                        {t.contribute.avgPriceLabel}
                      </label>
                      <input
                        id="c-avg-price"
                        type="text"
                        inputMode="numeric"
                        value={avgPriceIdr}
                        onChange={(e) => setAvgPriceIdr(e.target.value.replace(/\D/g, ""))}
                        required
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="c-tier" className="block text-xs font-semibold">
                        {t.contribute.priceTierLabel}
                      </label>
                      <select
                        id="c-tier"
                        value={priceRange}
                        onChange={(e) =>
                          setPriceRange(e.target.value as "$" | "$$" | "$$$" | "$$$$")
                        }
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                      >
                        <option value="$">{t.contribute.priceTiers.t1}</option>
                        <option value="$$">{t.contribute.priceTiers.t2}</option>
                        <option value="$$$">{t.contribute.priceTiers.t3}</option>
                        <option value="$$$$">{t.contribute.priceTiers.t4}</option>
                      </select>
                    </div>
                  </div>

                  <fieldset>
                    <legend className="text-xs font-semibold text-[#1C1C1C]">
                      {t.contribute.additionalCuisinesLabel}
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {CUISINE_CATEGORIES.filter((c) => c !== "All").map((c) => {
                        const active = cuisines.includes(c);
                        return (
                          <label
                            key={c}
                            className={cn(
                              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                              active
                                ? "border-[#E23744] bg-[#FFF0F1] text-[#C91D2B]"
                                : "border-[#E8E8E8] bg-[#FAFAFA] text-[#696969]"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleCuisine(c)}
                              className="visually-hidden"
                            />
                            <span>{translateCategory(c, locale)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="c-hours-wk" className="block text-xs font-semibold">
                        {t.contribute.monFriLabel}
                      </label>
                      <input
                        id="c-hours-wk"
                        type="text"
                        value={monFriHours}
                        onChange={(e) => setMonFriHours(e.target.value)}
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="c-hours-we" className="block text-xs font-semibold">
                        {t.contribute.satSunLabel}
                      </label>
                      <input
                        id="c-hours-we"
                        type="text"
                        value={satSunHours}
                        onChange={(e) => setSatSunHours(e.target.value)}
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="c-phone" className="block text-xs font-semibold">
                        {t.contribute.phoneLabel}
                      </label>
                      <input
                        id="c-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+62 21 ..."
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-website" className="block text-xs font-semibold">
                        {t.contribute.websiteLabel}
                      </label>
                      <input
                        id="c-website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://..."
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="c-email" className="block text-xs font-semibold">
                        {t.contribute.emailLabel}
                      </label>
                      <input
                        id="c-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hello@restaurant.id"
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2
                    ref={stepHeadingRef}
                    tabIndex={-1}
                    className="font-display text-xl font-bold text-[#1C1C1C] focus:outline-none"
                  >
                    {t.contribute.step2Title}
                  </h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-city" className="block text-xs font-semibold">
                        {t.contribute.cityLabel}
                      </label>
                      <input
                        id="c-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="c-district" className="block text-xs font-semibold">
                        {t.contribute.districtLabel}
                      </label>
                      <input
                        id="c-district"
                        list="jakarta-area-list"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        required
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                      <datalist id="jakarta-area-list">
                        {JAKARTA_AREAS.filter((a) => a !== "All Jakarta").map((a) => (
                          <option key={a} value={a} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="c-address" className="block text-xs font-semibold">
                      {t.contribute.addressLabel}
                    </label>
                    <textarea
                      id="c-address"
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      autoComplete="street-address"
                      placeholder={t.contribute.addressPlaceholder}
                      className="mt-1 w-full rounded-lg border border-[#E8E8E8] p-3 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-lat" className="block text-xs font-semibold">
                        {t.contribute.latLabel}
                      </label>
                      <input
                        id="c-lat"
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="-6.2351"
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="c-lng" className="block text-xs font-semibold">
                        {t.contribute.lngLabel}
                      </label>
                      <input
                        id="c-lng"
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="106.8095"
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2
                    ref={stepHeadingRef}
                    tabIndex={-1}
                    className="font-display text-xl font-bold text-[#1C1C1C] focus:outline-none"
                  >
                    {t.contribute.step3Title}
                  </h2>
                  <p className="text-sm text-[#696969]">{t.contribute.menuHelp}</p>

                  <div className="space-y-4 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label htmlFor="m-cat" className="block text-xs font-semibold">
                          {t.contribute.menuSection}
                        </label>
                        <select
                          id="m-cat"
                          value={newDishCategory}
                          onChange={(e) => setNewDishCategory(e.target.value)}
                          className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                        >
                          {MENU_CATEGORY_PRESETS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="m-name" className="block text-xs font-semibold">
                          {t.contribute.dishName}
                        </label>
                        <input
                          id="m-name"
                          type="text"
                          value={newDishName}
                          onChange={(e) => setNewDishName(e.target.value)}
                          placeholder={t.contribute.dishNamePlaceholder}
                          className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="m-price" className="block text-xs font-semibold">
                          {t.contribute.dishPrice}
                        </label>
                        <input
                          id="m-price"
                          type="text"
                          inputMode="numeric"
                          value={newDishPrice}
                          onChange={(e) => setNewDishPrice(e.target.value.replace(/\D/g, ""))}
                          className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="m-desc" className="block text-xs font-semibold">
                        {t.contribute.dishDesc}
                      </label>
                      <input
                        id="m-desc"
                        type="text"
                        value={newDishDesc}
                        onChange={(e) => setNewDishDesc(e.target.value)}
                        placeholder={t.contribute.dishDescPlaceholder}
                        className="mt-1 min-h-11 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-xs font-medium">
                          <input
                            type="checkbox"
                            checked={newDishPopular}
                            onChange={(e) => setNewDishPopular(e.target.checked)}
                            className="accent-[#E23744]"
                          />
                          <span>{t.contribute.highlightBestSeller}</span>
                        </label>

                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-semibold hover:border-[#E23744]">
                          <Upload className="h-3.5 w-3.5 text-[#E23744]" aria-hidden="true" />
                          <span>
                            {uploadingDishImg
                              ? t.contribute.uploading
                              : newDishPhotoUrl
                                ? t.contribute.photoAttached
                                : t.contribute.uploadFoodPhoto}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={handleDishFileChange}
                            className="visually-hidden"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddDraftDish}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#E23744] px-4 text-xs font-semibold text-white hover:bg-[#C91D2B]"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t.contribute.addToMenuList}</span>
                      </button>
                    </div>
                  </div>

                  {menuEntries.length === 0 ? (
                    <p className="text-sm text-[#696969]">{t.contribute.noDishesAdded}</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {menuEntries.map((item) => (
                        <li
                          key={item.localId}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#E8E8E8] p-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {item.photo_url && (
                              <img
                                src={item.photo_url}
                                alt={item.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#1C1C1C]">
                                {item.name}{" "}
                                <span className="ml-1 rounded bg-[#FFF0F1] px-2 py-0.5 text-[11px] font-semibold text-[#C91D2B]">
                                  {item.categoryName}
                                </span>
                              </p>
                              <p className="text-xs text-[#696969]">
                                {formatIdr(item.price_idr)}
                                {item.description ? ` · ${item.description}` : ""}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setMenuEntries((prev) =>
                                prev.filter((d) => d.localId !== item.localId)
                              )
                            }
                            aria-label={`${t.common.delete} ${item.name}`}
                            className="rounded p-1.5 text-[#696969] hover:text-[#C91D2B]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h2
                    ref={stepHeadingRef}
                    tabIndex={-1}
                    className="font-display text-xl font-bold text-[#1C1C1C] focus:outline-none"
                  >
                    {t.contribute.step4Title}
                  </h2>
                  <p className="text-sm text-[#696969]">{t.contribute.photosHelp}</p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-6 text-center transition hover:border-[#E23744]">
                      <ImagePlus className="h-7 w-7 text-[#E23744]" aria-hidden="true" />
                      <span className="mt-2 text-sm font-bold text-[#1C1C1C]">
                        {uploadingGalleryImg ? t.contribute.uploading : t.contribute.uploadCover}
                      </span>
                      <span className="mt-1 text-xs text-[#696969]">
                        {t.contribute.coverSub}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={uploadingGalleryImg}
                        onChange={(e) => void handleRestaurantPhotoUpload(e, true)}
                        className="visually-hidden"
                      />
                    </label>

                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E8E8E8] bg-[#FAFAFA] p-6 text-center transition hover:border-[#E23744]">
                      <Upload className="h-7 w-7 text-[#696969]" aria-hidden="true" />
                      <span className="mt-2 text-sm font-bold text-[#1C1C1C]">
                        {t.contribute.addGallery}
                      </span>
                      <span className="mt-1 text-xs text-[#696969]">
                        {t.contribute.gallerySub}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={uploadingGalleryImg}
                        onChange={(e) => void handleRestaurantPhotoUpload(e, false)}
                        className="visually-hidden"
                      />
                    </label>
                  </div>

                  {coverImageUrl && (
                    <div className="rounded-xl border border-[#E8E8E8] p-3">
                      <p className="text-xs font-bold uppercase text-[#E23744]">
                        {t.contribute.selectedCover}
                      </p>
                      <img
                        src={coverImageUrl}
                        alt={t.contribute.selectedCover}
                        className="mt-2 aspect-[16/9] max-h-56 w-full rounded-lg object-cover"
                      />
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {photos.map((p) => (
                        <div
                          key={p.localId}
                          className="relative overflow-hidden rounded-xl border border-[#E8E8E8]"
                        >
                          <img
                            src={p.url}
                            alt={p.caption}
                            className="aspect-[4/3] w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPhotos((prev) =>
                                prev.filter((item) => item.localId !== p.localId)
                              )
                            }
                            aria-label={t.common.delete}
                            className="absolute right-2 top-2 rounded-full bg-white/95 p-1 text-[#C91D2B]"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2
                    ref={stepHeadingRef}
                    tabIndex={-1}
                    className="font-display text-xl font-bold text-[#1C1C1C] focus:outline-none"
                  >
                    {t.contribute.step5Title}
                  </h2>

                  <dl className="grid grid-cols-1 gap-4 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold text-[#696969]">
                        {t.contribute.reviewLabels.restaurant}
                      </dt>
                      <dd className="mt-0.5 font-bold text-[#1C1C1C]">{name || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#696969]">
                        {t.contribute.reviewLabels.cuisineBudget}
                      </dt>
                      <dd className="mt-0.5 font-medium text-[#1C1C1C]">
                        {cuisines.map((c) => translateCategory(c, locale)).join(", ")} ·{" "}
                        {formatIdr(Number(avgPriceIdr || 0))} ({priceRange})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#696969]">
                        {t.contribute.reviewLabels.neighborhood}
                      </dt>
                      <dd className="mt-0.5 text-[#1C1C1C]">
                        {district}, {city}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#696969]">
                        {t.contribute.reviewLabels.address}
                      </dt>
                      <dd className="mt-0.5 text-[#1C1C1C]">{address || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#696969]">
                        {t.contribute.reviewLabels.menuDishesAdded}
                      </dt>
                      <dd className="mt-0.5 font-semibold text-[#1C1C1C]">
                        {formatT(t.contribute.dishesCount, { count: menuEntries.length })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#696969]">
                        {t.contribute.reviewLabels.uploadedPhotos}
                      </dt>
                      <dd className="mt-0.5 font-semibold text-[#1C1C1C]">
                        {formatT(t.contribute.photosCount, { count: photos.length })}
                      </dd>
                    </div>
                  </dl>

                  <p className="text-xs text-[#696969]">
                    {isAdmin ? t.contribute.adminPublishNote : t.contribute.memberPendingNote}
                  </p>
                </div>
              )}

              {/* Stepper Controls */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E8E8] pt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    enterKeyHint="previous"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#E8E8E8] bg-white px-4 text-sm font-semibold text-[#1C1C1C] hover:border-[#E23744]"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span>{t.contribute.previous}</span>
                  </button>
                ) : (
                  <span />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    enterKeyHint="next"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#E23744] px-6 text-sm font-semibold text-white hover:bg-[#C91D2B]"
                  >
                    <span>{t.contribute.nextStep}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleFinalSave("draft")}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#E8E8E8] bg-white px-5 text-sm font-semibold text-[#1C1C1C] hover:border-[#E23744] disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                      <span>{t.contribute.saveDraft}</span>
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleFinalSave("pending")}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#E23744] px-6 text-sm font-semibold text-white hover:bg-[#C91D2B] disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {submitting
                          ? t.common.submitting
                          : isAdmin
                            ? t.contribute.publishRestaurant
                            : t.contribute.submitForReview}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
