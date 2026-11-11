export const metadata = {
  title: "Privacy Policy | CRAVER",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
        Legal
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs text-[#696969]">Effective Date: 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#696969]">
        <section>
          <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
            1. Account &amp; Profile Information
          </h2>
          <p className="mt-2">
            When you create a CRAVER account, we store your email address for authentication and
            your chosen display name, username, city, bio, and avatar image so your public
            reviews and restaurant contributions can be attributed to you.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
            2. User Contributions &amp; Photos
          </h2>
          <p className="mt-2">
            Restaurants, menu additions, reviews, and uploaded food photography submitted for
            publication become visible to the CRAVER community once approved by moderators or
            published under community guidelines. Private collections remain visible only to you.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
            3. Row Level Security &amp; Data Control
          </h2>
          <p className="mt-2">
            CRAVER enforces PostgreSQL Row Level Security across profiles, favorites, personal
            collections, draft submissions, reviews, and uploaded media. You may edit or delete
            your own reviews, uploaded photos, private collections, and draft/pending
            restaurant submissions from your profile at any time.
          </p>
        </section>
      </div>
    </div>
  );
}

