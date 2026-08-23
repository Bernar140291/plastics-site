import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Box, CircleCheck, FileQuestion, Gauge, Layers3, Thermometer } from "lucide-react";
import { articleSlug, catalogMaterialBySlug, publicPhoto } from "../../data/catalog";
import { materialBySlug, materials } from "../../data/materials";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return materials.map((material) => ({ slug: material.slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const material = materialBySlug((await params).slug);
  if (!material) return { title: "Материал не найден", openGraph: { images: [] }, twitter: { images: [] } };
  return {
    title: `${material.code} — ${material.name}`,
    description: `${material.summary} Свойства, марки, ограничения и формы поставки.`,
    openGraph: { title: `${material.code} — ${material.name}`, description: material.summary, images: [] },
    twitter: { card: "summary", title: `${material.code} — ${material.name}`, description: material.summary, images: [] },
  };
}

export default async function MaterialPage({ params }: PageProps) {
  const { slug } = await params;
  const material = materialBySlug(slug);
  if (!material) notFound();
  const sourceMaterial = catalogMaterialBySlug(slug);
  const artikuls = sourceMaterial?.artikuls ?? [];

  return (
    <main id="main-content">
      <section className="material-hero">
        <div className="container">
          <a className="back-link" href="/catalog"><ArrowLeft size={17} /> Каталог материалов</a>
          <div className="material-hero-grid">
            <div>
              <p className="eyebrow">{material.category}</p>
              <div className="detail-code">{material.code}</div>
              <h1>{material.name}</h1>
              <p className="aliases">{material.aliases}</p>
              <p className="detail-summary">{material.summary}</p>
              <div className="hero-actions">
                <a className="button button-primary" href={`/contacts?material=${material.slug}`}>Рассчитать поставку <ArrowRight size={18} /></a>
                <a className="button button-outline" href="#grades">Посмотреть марки</a>
              </div>
            </div>
            <div className="material-metrics">
              <div><Thermometer /><span>Температура<strong>{material.temperature}</strong></span></div>
              <div><Gauge /><span>Прочность при растяжении<strong>{material.tensile}</strong></span></div>
              <div><Box /><span>Формы поставки<strong>{material.forms.join(", ")}</strong></span></div>
              <div><Layers3 /><span>Марки в каталоге<strong>{artikuls.length || "по запросу"}</strong></span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section grades-section" id="grades">
        <div className="container">
          <div className="section-heading">
            <div><p className="kicker">Марки и исполнения</p><h2>{artikuls.length ? `Доступные позиции ${material.code}` : `Позиции ${material.code} уточняются`}</h2></div>
            <a className="text-link" href="/catalog">Сравнить материалы <ArrowRight size={17} /></a>
          </div>
          <p className="supplier-data-note">Описание и технические показатели перенесены из каталога поставщика. Перед заказом сверяем точную марку, наполнение, форму поставки и технический лист партии.</p>

          {artikuls.length ? (
            <div className="grade-grid">
              {artikuls.map((article) => {
                const photo = publicPhoto(article.photo);
                return (
                  <a className="grade-card" href={`/materials/${slug}/${articleSlug(article.code)}`} key={article.code}>
                    <div className={`grade-photo ${photo ? "has-photo" : ""}`}>
                      {photo ? <img src={photo} alt={`${material.code} ${article.code}`} width="800" height="600" loading="lazy" /> : <span><b>{article.code}</b><small>Фото уточняется</small></span>}
                    </div>
                    <div className="grade-card-body">
                      <div className="grade-card-top"><span className="material-code">{article.code}</span><ArrowRight size={19} /></div>
                      <p className="grade-kind">{article.kind || "Исполнение"}</p>
                      <h3>{article.form || material.name}</h3>
                      <p>{article.shortDescription || article.description || "Характеристики уточняются."}</p>
                      <div className="tag-row">{(article.colors || []).map((color) => <span key={color}>{color}</span>)}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="grades-empty">
              <FileQuestion size={30} />
              <div><h3>Артикулы пока не опубликованы</h3><p>Опишите требуемое исполнение — проверим доступные марки и запросим технический лист у поставщика.</p></div>
              <a className="button button-dark" href={`/contacts?material=${material.slug}`}>Запросить варианты</a>
            </div>
          )}
        </div>
      </section>

      <section className="section detail-section">
        <div className="container detail-grid">
          <div className="detail-main">
            <section><p className="kicker">Свойства</p><h2>Почему рассматривают {material.code}</h2><ul className="check-list">{material.properties.map((item) => <li key={item}><CircleCheck size={19} />{item}</li>)}</ul></section>
            <section><p className="kicker">Применение</p><h2>Типовые задачи</h2><div className="application-grid">{material.applications.map((item) => <div key={item}>{item}</div>)}</div></section>
            <section><p className="kicker">Ограничения</p><h2>Что проверить до выбора</h2><ul className="warning-list">{material.limitations.map((item) => <li key={item}><AlertTriangle size={19} />{item}</li>)}</ul></section>
          </div>
          <aside className="spec-card">
            <h2>Справочные параметры</h2>
            <dl>
              <div><dt>Температура</dt><dd>{material.temperature}</dd></div>
              <div><dt>Плотность</dt><dd>{material.density}</dd></div>
              <div><dt>Прочность</dt><dd>{material.tensile}</dd></div>
              <div><dt>Влагопоглощение</dt><dd>{material.moisture}</dd></div>
              <div><dt>Среды</dt><dd>{material.media.join(", ")}</dd></div>
              <div><dt>Нагрузки</dt><dd>{material.loads.join(", ")}</dd></div>
            </dl>
            <p>* Справочные диапазоны не являются паспортом материала. Для расчёта нужна точная марка и документация партии.</p>
            <a className="button button-dark" href={`/contacts?material=${material.slug}`}>Отправить ТЗ</a>
          </aside>
        </div>
      </section>
    </main>
  );
}
