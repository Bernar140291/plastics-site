import type { Metadata } from "next";
import { CatalogExplorer } from "../components/catalog-explorer";
import { articleCountBySlug } from "../data/catalog";

export const metadata: Metadata = {
  title: "Каталог инженерных пластиков",
  alternates: { canonical: "/catalog" },
  description: "Подбор инженерных пластиков по температуре, среде, нагрузке и форме поставки. Сравнение PEEK, PEI, PPS, POM, PA, PET-P и других материалов.",
};

export default function CatalogPage() {
  return (
    <main id="main-content">
      <section className="page-hero compact-hero">
        <div className="container"><p className="eyebrow">Каталог и подбор</p><h1>Сравните материалы по условиям работы</h1><p>Фильтры помогают сократить список, но не заменяют расчёт детали и проверку конкретной марки.</p></div>
      </section>
      <section className="section catalog-section"><div className="container"><CatalogExplorer gradeCounts={articleCountBySlug} /></div></section>
    </main>
  );
}
