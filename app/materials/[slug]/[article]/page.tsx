import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Box, FileCheck2, Layers3, Palette } from "lucide-react";
import { PhotoLink } from "../../../components/lightbox";
import { MaterialNav } from "../../../components/material-nav";
import { ProductTabs } from "../../../components/product-tabs";
import { articleDescription, articleSlug, catalogArticleBySlug, catalogMaterialBySlug, publicPhoto, siteSlugBySourceCode, supplierCatalog } from "../../../data/catalog";
import { materialBySlug } from "../../../data/materials";
import { SITE_ORIGIN } from "../../../data/site";

type PageProps = { params: Promise<{ slug: string; article: string }> };


export function generateStaticParams() {
  return supplierCatalog.materials.flatMap((material) => material.artikuls.map((article) => ({
    slug: siteSlugBySourceCode[material.code] ?? material.code,
    article: articleSlug(article.code),
  })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, article: articleParam } = await params;
  const material = materialBySlug(slug);
  const article = catalogArticleBySlug(slug, articleParam);
  if (!material || !article) return { title: "Марка не найдена", openGraph: { images: [] }, twitter: { images: [] } };
  const title = `${material.code} ${article.code} — ${article.kind || "марка материала"}`;
  const description = article.shortDescription || `${material.name}, марка ${article.code}: характеристики, размеры и применение.`;
  const image = publicPhoto(article.photo);
  const images = image ? [{ url: new URL(image, SITE_ORIGIN).toString(), alt: `${material.code} ${article.code}` }] : [];
  return {
    title,
    description,
    alternates: { canonical: `/materials/${slug}/${articleSlug(article.code)}` },
    openGraph: { title, description, images, url: `/materials/${slug}/${articleSlug(article.code)}` },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug, article: articleParam } = await params;
  const material = materialBySlug(slug);
  const sourceMaterial = catalogMaterialBySlug(slug);
  const article = catalogArticleBySlug(slug, articleParam);
  if (!material || !sourceMaterial || !article) notFound();
  const photo = publicPhoto(article.photo);
  const description = articleDescription(article);
  const pageUrl = `${SITE_ORIGIN}/materials/${slug}/${articleSlug(article.code)}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${material.name} ${article.code}`,
    sku: article.code,
    description,
    category: material.category,
    material: material.name,
    ...(photo ? { image: new URL(photo, SITE_ORIGIN).toString() } : {}),
    url: pageUrl,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Каталог", item: `${SITE_ORIGIN}/catalog` },
      { "@type": "ListItem", position: 2, name: material.name, item: `${SITE_ORIGIN}/materials/${slug}` },
      { "@type": "ListItem", position: 3, name: article.code, item: pageUrl },
    ],
  };

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
      <section className="article-hero">
        <div className="container">
          <div className="article-hero-grid">
            <figure className="article-image-block">
              <div className={`article-main-photo ${photo ? "has-photo" : ""}`}>
                {photo ? <PhotoLink src={photo} alt={`${material.code} ${article.code} — ${article.form || "заготовка"}${article.photoKind === "illustration" ? " (иллюстрация)" : ""}`}><img src={photo} width="1200" height="900" fetchPriority="high" alt={`${material.code} ${article.code} — ${article.form || "заготовка"}`} /></PhotoLink> : <div><span>{material.code}</span><strong>{article.code}</strong><small>Фото марки уточняется</small></div>}
              </div>
              {article.photoKind === "illustration" && <figcaption className="article-image-caption">Иллюстрация материала, созданная с помощью ИИ. Внешний вид партии уточняется при заказе.</figcaption>}
            </figure>
            <div className="article-hero-copy">
              <p className="eyebrow">{article.kind || "Исполнение материала"}</p>
              <h1>{material.code} {article.code}</h1>
              <p className="article-lead">{article.shortDescription || material.summary}</p>
              <div className="article-facts">
                <div><Layers3 /><span>Материал<strong>{material.name}</strong></span></div>
                <div><Box /><span>Форма поставки<strong>{article.form || "уточняется"}</strong></span></div>
                <div><Palette /><span>Цвет<strong>{(article.colors || []).join(", ") || "уточняется"}</strong></span></div>
                <div><FileCheck2 /><span>Технический лист<strong>запрашивается для партии</strong></span></div>
              </div>
              <div className="hero-actions">
                <a className="button button-primary" href={`/contacts?material=${slug}&grade=${encodeURIComponent(article.code)}`}>Запросить расчёт <ArrowRight size={18} /></a>
                <a className="button button-outline" href="#specifications">Смотреть характеристики</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MaterialNav activeSlug={slug} />

      <section className="section product-section" id="specifications">
        <div className="container">
          <ProductTabs article={article} description={description} materialName={material.name} />
          <div className="source-warning"><FileCheck2 size={21} /><p><strong>Важно:</strong> опубликованные значения используются для предварительного подбора. Состав марки, стандарты испытаний, допуски, размеры и документы необходимо подтвердить у производителя для конкретной партии.</p></div>
        </div>
      </section>

      <section className="section sibling-grades">
        <div className="container">
          <div className="section-heading"><div><p className="kicker">Другие исполнения</p><h2>Сравните марки {material.code}</h2></div><a className="text-link" href={`/materials/${slug}`}>Все марки <ArrowRight size={17} /></a></div>
          <div className="sibling-grade-grid">{sourceMaterial.artikuls.filter((item) => item.code !== article.code).map((item) => <a href={`/materials/${slug}/${articleSlug(item.code)}`} key={item.code}><span>{item.code}</span><strong>{item.kind || "Исполнение"}</strong><small>{item.form || "Форма уточняется"}</small><ArrowRight size={18} /></a>)}</div>
        </div>
      </section>
    </main>
  );
}
