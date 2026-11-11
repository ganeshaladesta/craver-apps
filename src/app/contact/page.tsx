import Link from "next/link";
import { Flag, Mail, MapPin, PlusCircle } from "lucide-react";

export const metadata = {
  title: "Contact CRAVER",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-wider text-[#E23744]">
        Get in Touch
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#1C1C1C]">
        Contact &amp; Listing Corrections
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#696969]">
        Restaurant owners, contributors, and diners can request listing updates or flag outdated
        menu items directly inside CRAVER.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-bold text-[#1C1C1C]">
                Editorial &amp; Moderation Desk
              </h2>
              <p className="mt-1 text-sm text-[#696969]">
                Reach the Jakarta directory team at{" "}
                <span className="font-medium text-[#1C1C1C]">editorial@craver.id</span> for
                restaurant verification or partnership inquiries.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
          <div className="flex items-start gap-3">
            <PlusCircle className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-bold text-[#1C1C1C]">
                Submit a New Restaurant
              </h2>
              <p className="mt-1 text-sm text-[#696969]">
                Use our 5-step contributor workflow to submit restaurant hours, menus, and dish
                photography into the moderation queue.
              </p>
              <Link
                href="/contribute"
                className="mt-3 inline-flex text-xs font-semibold text-[#E23744] hover:underline"
              >
                Open Contributor Wizard →
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
          <div className="flex items-start gap-3">
            <Flag className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-bold text-[#1C1C1C]">
                Suggest Hours or Report Closed Places
              </h2>
              <p className="mt-1 text-sm text-[#696969]">
                Every restaurant profile includes an <strong>Updates</strong> tab and{" "}
                <strong>Report</strong> button so corrections reach moderators immediately.
              </p>
              <Link
                href="/explore"
                className="mt-3 inline-flex text-xs font-semibold text-[#E23744] hover:underline"
              >
                Browse Restaurants →
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-6">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-[#E23744]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-bold text-[#1C1C1C]">
                Coverage Area
              </h2>
              <p className="mt-1 text-sm text-[#696969]">
                Senopati, SCBD, Kemang, Menteng, PIK, Kuningan, Kelapa Gading, Blok M, and
                Sudirman — Greater Jakarta, Indonesia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

