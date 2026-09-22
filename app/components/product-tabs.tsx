"use client";

import { CircleCheck, FileQuestion, Images, Ruler, TableProperties } from "lucide-react";
import { useState } from "react";
import type { CatalogArticle } from "../data/catalog";
import { PhotoLink } from "./lightbox";

type ProductTabsProps = {
  article: CatalogArticle;
  description: string;
  materialName: string;
};

const publicPhoto = (path: string) => `/${path.replace(/^\//, "")}`;

const tabs = [
  { id: "overview", label: "Сведения", icon: CircleCheck },
  { id: "physical", label: "Физические параметры", icon: TableProperties },
  { id: "sizes", label: "Размеры", icon: Ruler },
  { id: "applications", label: "Применение и фото", icon: Images },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProductTabs({ article, description, materialName }: ProductTabsProps) {
  const [active, setActive] = useState<TabId>("overview");
  const physicalGroups = article.physicalParams ?? [];
  const sizeRows = article.sizeGrid ?? [];
  const workPhotos = article.workPhotos ?? [];

  return (
    <section className="product-tabs" aria-label={`Характеристики ${materialName} ${article.code}`}>
      <div className="product-tab-list" role="tablist" aria-label="Разделы карточки марки">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            aria-selected={active === id}
            tabIndex={active === id ? 0 : -1}
            className={active === id ? "is-active" : ""}
            onClick={() => setActive(id)}
            onKeyDown={(event) => {
              const index = tabs.findIndex((tab) => tab.id === id);
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
                : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
                : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault();
              setActive(tabs[next].id);
              document.getElementById(`tab-${tabs[next].id}`)?.focus();
            }}
            key={id}
          >
            <Icon size={17} />{label}
          </button>
        ))}
      </div>

      <div className="product-tab-panel" role="tabpanel" tabIndex={0} id={`panel-${active}`} aria-labelledby={`tab-${active}`}>
        {active === "overview" && (
          <div className="product-overview-grid">
            <div>
              <p className="kicker">Описание марки</p>
              <h2>{materialName} {article.code}</h2>
              <p className="article-description">{description}</p>
            </div>
            <dl className="product-kv">
              <div><dt>Артикул</dt><dd>{article.code}</dd></div>
              <div><dt>Тип</dt><dd>{article.kind || "уточняется"}</dd></div>
              <div><dt>Форма</dt><dd>{article.form || "уточняется"}</dd></div>
              <div><dt>Цвет</dt><dd>{(article.colors || []).join(", ") || "уточняется"}</dd></div>
            </dl>
          </div>
        )}

        {active === "physical" && (
          <div>
            <div className="data-source-banner"><FileQuestion size={20} /><p><strong>Предварительные данные поставщика.</strong> Пустые показатели обозначены как «не указано». Перед применением в расчёте запросите актуальный технический лист на конкретную марку.</p></div>
            {physicalGroups.length ? physicalGroups.map((group) => (
              <section className="technical-group" key={group.group}>
                <h3>{group.group}</h3>
                <p className="table-scroll-hint">Прокрутите таблицу вправо для просмотра стандарта и условий испытаний.</p>
                <div className="technical-table-wrap" tabIndex={0} role="region" aria-label={`${group.group}: таблица параметров`}>
                  <table className="technical-table physical-table">
                    <thead><tr><th scope="col">Показатель</th><th scope="col">Значение</th><th scope="col">Ед.</th><th scope="col">Стандарт</th><th scope="col">Условия</th></tr></thead>
                    <tbody>
                      {(group.rows || []).map((row, index) => (
                        <tr key={`${row.label}-${index}`}>
                          <th scope="row">{row.label}</th>
                          <td className={row.value === "" || row.value == null ? "is-empty" : ""}>{row.value === "" || row.value == null ? "не указано" : row.value}</td>
                          <td>{row.unit || "—"}</td>
                          <td>{row.std || "—"}</td>
                          <td>{row.condition?.replace(/мГц/g, "МГц") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )) : <div className="empty-data-card"><FileQuestion size={28} /><h3>Параметры пока не добавлены</h3><p>Запросим технический лист вместе с расчётом поставки.</p></div>}
          </div>
        )}

        {active === "sizes" && (
          <div>
            <div className="data-source-banner"><Ruler size={20} /><p>Сетка показывает предварительно заявленные форматы. Фактическую толщину, диаметр, длину и минимальную партию подтверждаем перед заказом.</p></div>
            {sizeRows.length ? (
              <div className="technical-table-wrap" tabIndex={0} role="region" aria-label="Размерная сетка: прокручиваемая таблица">
                <table className="technical-table sizes-table">
                  <thead><tr><th>Толщина / Ø, мм</th><th>Лист</th><th>Стержень</th><th>Труба</th></tr></thead>
                  <tbody>{sizeRows.map((row, index) => <tr key={`${row.range}-${index}`}><th scope="row">{row.range}</th><td>{row.sheet || "—"}</td><td>{row.rod || "—"}</td><td>{row.pipe || "—"}</td></tr>)}</tbody>
                </table>
              </div>
            ) : <div className="empty-data-card"><FileQuestion size={28} /><h3>Размерная сетка уточняется</h3><p>Укажите нужный формат в заявке — проверим возможность изготовления или поставки.</p></div>}
          </div>
        )}

        {active === "applications" && (
          <div className="applications-panel">
            <div>
              <p className="kicker">Типичное применение</p>
              <h2>Где рассматривают эту марку</h2>
              <div className="application-grid">{(article.applications || []).length ? article.applications!.map((item) => <div key={item}>{item}</div>) : <div>Назначение уточняется по техническому заданию</div>}</div>
            </div>
            {workPhotos.length ? (
              <div>
                <p className="kicker">{workPhotos.every((photo) => photo.kind === "illustration") ? "Иллюстрации применения" : "Примеры изделий"}</p>
                {workPhotos.some((photo) => photo.kind === "illustration") && <p className="gallery-note">Отмеченные иллюстрации созданы с помощью ИИ и показывают возможное применение материала.</p>}
                <div className="work-gallery">{workPhotos.map((photo, index) => { const src = publicPhoto(photo.src)!; const alt = photo.caption || `${materialName} ${article.code}: пример изделия`; return <PhotoLink src={src} alt={alt} className="work-photo" key={`${photo.src}-${index}`}><img src={src} width="800" height="600" loading="lazy" alt={alt} /><span>{photo.caption || "Открыть фото"}</span></PhotoLink>; })}</div>
              </div>
            ) : <div className="empty-data-card"><Images size={28} /><h3>Фотографии изделий уточняются</h3><p>Главное фото марки показано выше, примеры обработки будут добавляться по мере наполнения каталога.</p></div>}
          </div>
        )}
      </div>
    </section>
  );
}
