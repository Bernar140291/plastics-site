import type { Metadata } from "next";
import { CatalogExplorer } from "../components/catalog-explorer";

export const metadata: Metadata = {
  title: "Каталог инженерных пластиков",
  description: "Подбор инженерных пластиков по температуре, среде, нагрузке и форме поставки. Сравнение PEEK, PTFE, POM, PA, UHMWPE и других материалов.",
};

export default function CatalogPage() {
  return (
    <main id="main-content">
      <section className="page-hero compact-hero">
        <div className="container"><p className="eyebrow">Каталог и подбор</p><h1>Сравните материалы по условиям работы</h1><p>Фильтры помогают сократить список, но не заменяют расчёт детали и проверку конкретной марки.</p></div>
      </section>
      <section className="section catalog-section"><div className="container"><CatalogExplorer /></div></section>
    </main>
  );
}
