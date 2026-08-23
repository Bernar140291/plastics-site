import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["cyrillic", "latin"], display: "swap" });
const metadataBase = new URL(
  "https://exapolymer-engineering-preview.ilya140291.chatgpt.site",
);

export const metadata: Metadata = {
  metadataBase,
  title: { default: "ExaPolymer — инженерные пластики под задачу", template: "%s — ExaPolymer" },
  description: "Подбор и поставка инженерных пластиков под заказ: PEEK, PTFE, POM, PA, UHMWPE и другие материалы.",
  openGraph: {
    title: "ExaPolymer",
    description: "Инженерные пластики под задачу",
    type: "website",
    locale: "ru_RU",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ExaPolymer — инженерные пластики под задачу" }],
  },
  twitter: { card: "summary_large_image", title: "ExaPolymer", description: "Инженерные пластики под задачу", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={manrope.variable}>
        <a className="skip-link" href="#main-content">К основному содержанию</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
