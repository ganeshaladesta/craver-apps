import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { CraverProviders } from "@/components/providers/CraverProviders";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SetupBanner } from "@/components/layout/SetupBanner";
import { getSessionContext } from "@/lib/queries/user";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CRAVER — Discover Places. Find Your Craving.",
  description:
    "Explore extraordinary restaurants across Jakarta, browse complete digital food menus, view real food photography, and share the dining places you love.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();

  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen flex-col bg-white text-[#1C1C1C] antialiased">
        <CraverProviders
          initialConfigured={session.configured}
          initialUser={session.user}
          initialProfile={session.profile}
          initialFavoriteIds={session.favoriteIds}
          initialNotifications={session.notifications}
        >
          <SetupBanner configured={session.configured} />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CraverProviders>
      </body>
    </html>
  );
}
