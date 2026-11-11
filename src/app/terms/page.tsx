export const metadata = {
  title: "Terms of Service | CRAVER",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
        Legal
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
        Terms of Service
      </h1>
      <p className="mt-2 text-xs text-[#696969]">Last Updated: 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#696969]">
        <section>
          <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
            1. Platform Purpose
          </h2>
          <p className="mt-2">
            CRAVER is a community-driven restaurant discovery directory focused on venue
            information, digital menus, dining photography, and honest community reviews.
            CRAVER does not process food delivery orders or financial payments.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
            2. Community Content Standards
          </h2>
          <p className="mt-2">
            Contributors agree to submit genuine restaurant details, accurate pricing, and photos
            they are authorized to share. One review per diner is allowed per restaurant.
            Administrators reserve the right to reject, hide, or remove inaccurate or abusive
            content.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-[#1C1C1C]">
            3. Moderation &amp; Account Suspension
          </h2>
          <p className="mt-2">
            Repeated violations or spam submissions may result in listing removal or account
            suspension under platform moderation controls.
          </p>
        </section>
      </div>
    </div>
  );
}

