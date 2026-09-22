import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { LightboxProvider } from "./components/lightbox";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { SITE_INDEXABLE, SITE_ORIGIN } from "./data/site";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["cyrillic", "latin"], display: "swap" });
const metadataBase = new URL(SITE_ORIGIN);

export const metadata: Metadata = {
  metadataBase,
  robots: { index: SITE_INDEXABLE, follow: SITE_INDEXABLE },
  title: { default: "ExaPolymer — инженерные пластики под задачу", template: "%s — ExaPolymer" },
  description: "Подбор и поставка инженерных пластиков под заказ: PEEK, PEI, PPS, POM, PA, PET-P и другие материалы.",
  openGraph: {
    title: "ExaPolymer",
    description: "Инженерные пластики под задачу",
    type: "website",
    locale: "ru_RU",
    images: [{ url: "/og-milk.jpg", width: 1200, height: 630, alt: "ExaPolymer — инженерные пластики под задачу" }],
  },
  twitter: { card: "summary_large_image", title: "ExaPolymer", description: "Инженерные пластики под задачу", images: ["/og-milk.jpg"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={manrope.variable}>
        <a className="skip-link" href="#main-content">К основному содержанию</a>
        <LightboxProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </LightboxProvider>
      </body>
    </html>
  );
}
