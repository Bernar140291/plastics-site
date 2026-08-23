/* Каталог артикулов: загрузка data/catalog.json и рендер сетки/карточки товара.
   Источник данных редактируется через editor.html — этот файл только читает. */

/* Стандартный шаблон датащита (label/std/condition/unit) — из NAGOMER_Physical_Property_Table.xlsx.
   Используется как основа для новых артикулов в редакторе; значения (value) там всегда пустые. */
const PHYSICAL_TEMPLATE = [
  { group: "Физические свойства", rows: [
    { label: "Плотность", std: "ISO 1183", condition: "", unit: "г/см³", value: "" },
    { label: "Водопоглощение (воздух)", std: "ISO 62", condition: "23°C / 50% отн.вл., воздух", unit: "%", value: "" },
    { label: "Водопоглощение (насыщение в воде)", std: "ISO 62", condition: "23°C, насыщение в воде", unit: "%", value: "" },
  ]},
  { group: "Термические свойства", rows: [
    { label: "Температура плавления", std: "", condition: "", unit: "°C", value: "" },
    { label: "Максимальная температура эксплуатации", std: "", condition: "кратковременно", unit: "°C", value: "" },
    { label: "Длительная температура эксплуатации", std: "", condition: "непрерывно: 5000/20000 ч", unit: "°C", value: "" },
    { label: "Минимально допустимая температура", std: "", condition: "", unit: "°C", value: "" },
    { label: "Коэффициент линейного теплового расширения", std: "ISO 11359", condition: "среднее значение, 23-100°C", unit: "м/(м·К)", value: "" },
    { label: "Коэффициент линейного теплового расширения", std: "ISO 11359", condition: "среднее значение, 23-150°C", unit: "м/(м·К)", value: "" },
    { label: "Температура тепловой деформации под нагрузкой (HDT)", std: "ISO 75", condition: "1.8 MPa", unit: "°C", value: "" },
    { label: "Температура размягчения по Вика (VST)", std: "ISO 306", condition: "VST/B/50", unit: "°C", value: "" },
    { label: "Температура стеклования (Tg)", std: "ISO 3146", condition: "", unit: "°C", value: "" },
  ]},
  { group: "Механические свойства", rows: [
    { label: "Прочность при растяжении (разрыв)", std: "ISO 527-2", condition: "", unit: "МПа", value: "" },
    { label: "Относительное удлинение при разрыве", std: "ISO 527-2", condition: "", unit: "%", value: "" },
    { label: "Модуль упругости при растяжении", std: "ISO 527", condition: "", unit: "МПа", value: "" },
    { label: "Прочность при изгибе", std: "ISO 178", condition: "стандартный образец", unit: "МПа", value: "" },
    { label: "Модуль упругости при изгибе", std: "ISO 178", condition: "стандартный образец", unit: "МПа", value: "" },
    { label: "Ударная вязкость по Изоду (с надрезом)", std: "ISO 180/1A", condition: "10×4 мм, 23°C", unit: "кДж/м²", value: "" },
    { label: "Ударная вязкость по Шарпи (с надрезом)", std: "ISO 179", condition: "1eA / 23°C", unit: "кДж/м²", value: "" },
    { label: "Твёрдость по Роквеллу", std: "ISO 2039-2", condition: "", unit: "HRR", value: "" },
    { label: "Твёрдость по Шору", std: "ISO 868", condition: "23°C", unit: "D/15", value: "" },
  ]},
  { group: "Электрические свойства", rows: [
    { label: "Диэлектрическая проницаемость", std: "IEC 60250", condition: "1 мГц / 23°C / 50% отн.вл.", unit: "", value: "" },
    { label: "Тангенс угла диэлектрических потерь", std: "IEC 60250", condition: "1 мГц / 23°C / 50% отн.вл.", unit: "", value: "" },
    { label: "Электрическая прочность", std: "IEC 60243", condition: "23°C / 50% отн.вл.", unit: "кВ/мм", value: "" },
    { label: "Поверхностное электрическое сопротивление", std: "IEC 60093", condition: "23°C / 50% отн.вл.", unit: "Ом·см", value: "" },
    { label: "Объёмное электрическое сопротивление", std: "IEC 60093", condition: "23°C / 50% отн.вл.", unit: "Ом", value: "" },
    { label: "Горючесть (класс)", std: "UL94", condition: "3 мм", unit: "", value: "" },
  ]},
];

/* Редактор открыт из /editor/, а фотографии лежат в корне сайта (/assets/...),
   поэтому относительный путь из каталога приводим к абсолютному. */
function assetUrl(path) {
  return path ? "/" + String(path).replace(/^\/+/, "") : "";
}

function clonePhysicalTemplate() {
  return JSON.parse(JSON.stringify(PHYSICAL_TEMPLATE));
}

async function loadCatalog() {
  const res = await fetch("/data/catalog.json");
  if (!res.ok) throw new Error("Не удалось загрузить каталог: " + res.status);
  return res.json();
}

function findMaterial(catalog, code) {
  return catalog.materials.find((m) => m.code === code) || null;
}

function findArtikul(material, code) {
  return material.artikuls.find((a) => a.code === code) || null;
}

/* ---------- Боковая навигация по материалам (material.html, product.html) ---------- */
/* Группировка соответствует трём уровням на catalog.html — держать в синхроне при добавлении материала. */
const MATERIAL_GROUPS = [
  { title: "Высокотемпературные", codes: ["peek", "pei", "pps", "ptfe", "pvdf"] },
  { title: "Конструкционные", codes: ["pa", "pom", "pc", "pet", "pu", "abs"] },
  { title: "Стандартные", codes: ["pp", "pe", "uhmwpe"] },
];

function materialSidebarHTML(catalog, activeCode) {
  const byCode = {};
  catalog.materials.forEach((m) => { byCode[m.code] = m; });
  const groups = MATERIAL_GROUPS.map((g) => {
    const items = g.codes
      .map((code) => byCode[code])
      .filter(Boolean)
      .map(
        (m) =>
          `<li><a href="material.html?m=${encodeURIComponent(m.code)}" class="${m.code === activeCode ? "active" : ""}">${escapeHtml(m.name)}</a></li>`
      )
      .join("");
    return `<div class="material-sidebar__group"><h4>${escapeHtml(g.title)}</h4><ul>${items}</ul></div>`;
  }).join("");
  return `<nav class="material-sidebar" aria-label="Материалы">${groups}</nav>`;
}

/* ---------- Сетка артикулов на странице материала ---------- */

function artikulCardHTML(materialCode, art) {
  const colors = (art.colors || [])
    .map((c) => `<span>${escapeHtml(c)}</span>`)
    .join("");
  const photo = art.photo
    ? `<div class="artikul-card__photo"><img src="${escapeHtml(assetUrl(art.photo))}" alt="${escapeHtml(art.code)}" loading="lazy"></div>`
    : `<div class="artikul-card__photo artikul-card__photo--empty">Фото уточняется</div>`;
  return `
    <a class="artikul-card" href="product.html?m=${encodeURIComponent(materialCode)}&a=${encodeURIComponent(art.code)}">
      ${photo}
      <span class="artikul-card__code">${escapeHtml(art.code)}</span>
      <p class="artikul-card__kind">${escapeHtml(art.kind || "")}</p>
      <p class="artikul-card__desc">${escapeHtml(truncateWords(art.shortDescription || art.description || "", 90))}</p>
      <div class="artikul-card__colors">${colors}</div>
    </a>`;
}

/* ---------- Страница материала (material.html?m=<code>) — список артикулов ---------- */

function renderMaterialInto(root, catalog, material) {
  const cards = material.artikuls.length
    ? material.artikuls.map((a) => artikulCardHTML(material.code, a)).join("")
    : `<p class="artikul-empty">Артикулы для этого материала пока не описаны.</p>`;
  root.innerHTML = `
    <section class="page-hero artikul-hero simple-hero">
      <div class="container">
        <h1>${escapeHtml(material.name)}${material.fullName ? ` - ${escapeHtml(material.fullName)}` : ""}</h1>
      </div>
    </section>

    <section class="artikul-section">
      <div class="container material-layout">
        ${materialSidebarHTML(catalog, material.code)}
        <div>
          <div class="artikul-grid">${cards}</div>

          <div class="cta-strip" style="margin-top:40px">
            <div>
              <h3>Нужен ${escapeHtml(material.name)} под ваш проект?</h3>
              <p>Подберём марку, рассчитаем стоимость листа, стержня или готового изделия по чертежу.</p>
            </div>
            <a href="contacts.html" class="btn btn--primary">Оставить заявку</a>
          </div>
        </div>
      </div>
    </section>`;
}

async function initMaterialPage() {
  const root = document.querySelector("[data-material-page]");
  if (!root) return;
  const params = new URLSearchParams(window.location.search);
  const materialCode = params.get("m");
  try {
    const catalog = await loadCatalog();
    const material = findMaterial(catalog, materialCode);
    if (!material) {
      root.innerHTML = `<div class="container" style="padding:64px 24px"><p>Материал не найден. <a href="catalog.html">Вернуться в каталог</a>.</p></div>`;
      return;
    }
    document.title = `${material.name} (${material.fullName || ""}) — артикулы | ExaPolymer`;
    renderMaterialInto(root, catalog, material);
  } catch (err) {
    root.innerHTML = `<div class="container" style="padding:64px 24px"><p>Ошибка загрузки: ${escapeHtml(err.message)}</p></div>`;
  }
}

/* ---------- Страница артикула (product.html) ---------- */

function hasSizeData(sizeGrid) {
  return (sizeGrid || []).some((r) => r.sheet || r.rod || r.pipe);
}

function physicalGroupsHTML(groups) {
  if (!groups || !groups.length) {
    return `<div class="spec-note">Физические параметры для этого артикула ещё не заданы.</div>`;
  }
  return groups
    .map(
      (g) => `
      <div class="spec-group">
        <h4 class="spec-group__title">${escapeHtml(g.group)}</h4>
        <div class="spec-table-scroll">
          <table class="spec-table">
            <tr><th>Показатель</th><th>Стандарт</th><th>Условия</th><th>Ед. изм.</th><th>Значение</th></tr>
            ${(g.rows || [])
              .map(
                (r) => `
              <tr>
                <td>${escapeHtml(r.label)}</td>
                <td>${escapeHtml(r.std) || "—"}</td>
                <td>${escapeHtml(r.condition) || "—"}</td>
                <td>${escapeHtml(r.unit) || "—"}</td>
                <td class="${r.value ? "" : "val-empty"}">${escapeHtml(r.value) || "уточняется"}</td>
              </tr>`
              )
              .join("")}
          </table>
        </div>
      </div>`
    )
    .join("");
}

function workPhotosHTML(photos) {
  if (!photos || !photos.length) return "";
  return `
    <div>
      <div style="font-size:.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Примеры работ</div>
      <div class="work-gallery">
        ${photos
          .map(
            (p) => `
          <a class="work-gallery__item lightbox-trigger" href="${escapeHtml(assetUrl(p.src))}">
            <img src="${escapeHtml(assetUrl(p.src))}" alt="${escapeHtml(p.caption || "Пример готового изделия")}" loading="lazy">
            ${p.caption ? `<span class="work-gallery__caption">${escapeHtml(p.caption)}</span>` : ""}
          </a>`
          )
          .join("")}
      </div>
    </div>`;
}

function renderProductInto(root, catalog, material, art) {
  root.innerHTML = `
    <section class="page-hero artikul-hero simple-hero">
      <div class="container">
        <h1>${escapeHtml(material.name)} ${escapeHtml(art.code)} — ${escapeHtml(art.form || "")}</h1>
      </div>
    </section>

    <section class="artikul-tabs-wrap">
      <div class="container material-layout">
        ${materialSidebarHTML(catalog, material.code)}
        <div>
        <div class="tabset">
          <div class="tabset__nav" role="tablist">
            <button type="button" class="active" data-tab="details">Сведения</button>
            <button type="button" data-tab="physical">Физические параметры</button>
            <button type="button" data-tab="sizes">Таблица характеристик</button>
            <button type="button" data-tab="description">Описание продукта</button>
          </div>
          <div class="tabset__panes">
            <div class="tabset__pane active" data-pane="details">
              ${
                art.photo
                  ? `<div class="product-photo"><a class="lightbox-trigger" href="${escapeHtml(assetUrl(art.photo))}"><img src="${escapeHtml(assetUrl(art.photo))}" alt="${escapeHtml(material.name)} ${escapeHtml(art.code)} — ${escapeHtml((art.colors || []).join(", "))}" loading="lazy"></a></div>`
                  : `<div class="photo-slot">Фото ${escapeHtml(art.code)} (${escapeHtml((art.colors || []).join(", "))}) — заглушка до реальных фото</div>`
              }
              <dl class="kv">
                <dt>Материал</dt><dd>${escapeHtml(material.name)} (${escapeHtml(material.fullName || "")})</dd>
                <dt>Артикул</dt><dd>${escapeHtml(art.code)}</dd>
                <dt>Форма поставки</dt><dd>${escapeHtml(art.form || "—")}</dd>
                <dt>Цвет</dt><dd>${escapeHtml((art.colors || []).join(", ") || "—")}</dd>
                <dt>Тип</dt><dd>${escapeHtml(art.kind || "—")}</dd>
              </dl>
            </div>
            <div class="tabset__pane" data-pane="physical">
              <div class="spec-note">Данные — из технических измерений производителя (NAGOMER Physical Property Table). Пустая ячейка означает, что для этой конкретной марки значение не приводится — уточняйте при заказе.</div>
              ${physicalGroupsHTML(art.physicalParams)}
            </div>
            <div class="tabset__pane" data-pane="sizes">
              <div class="spec-note">${
                hasSizeData(art.sizeGrid)
                  ? "Толщина — для листа, диаметр — для стержня. Размер листа указан как ширина×длина; длина стержня — стандартная заготовка. Актуальность и наличие уточняйте при заказе."
                  : "Сетка наличия по толщинам — нужны данные от поставщика по этому артикулу."
              }</div>
              <div class="spec-table-scroll">
                <table class="spec-table">
                  <tr><th>Толщина / Ø, мм</th><th>Лист</th><th>Стержень</th><th>Труба</th></tr>
                  ${(art.sizeGrid || [])
                    .map(
                      (r) =>
                        `<tr><td>${escapeHtml(r.range)}</td><td class="${r.sheet ? "" : "val-empty"}">${escapeHtml(r.sheet) || "уточняется"}</td><td class="${r.rod ? "" : "val-empty"}">${escapeHtml(r.rod) || "уточняется"}</td><td class="${r.pipe ? "" : "val-empty"}">${escapeHtml(r.pipe) || "уточняется"}</td></tr>`
                    )
                    .join("") || `<tr><td colspan="4" class="val-empty">данные пока не добавлены</td></tr>`}
                </table>
              </div>
            </div>
            <div class="tabset__pane" data-pane="description">
              <p>${escapeHtml(art.description || "")}</p>
              <div>
                <div style="font-size:.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Типичное применение</div>
                <div class="tag-list">
                  ${(art.applications || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
                </div>
              </div>
              ${workPhotosHTML(art.workPhotos)}
            </div>
          </div>
        </div>

        <div class="cta-strip" style="margin-top:40px">
          <div>
            <h3>Нужен ${escapeHtml(material.name)} ${escapeHtml(art.code)} под ваш проект?</h3>
            <p>Подберём партию, рассчитаем стоимость листа, стержня или готового изделия по чертежу.</p>
          </div>
          <a href="contacts.html" class="btn btn--primary">Оставить заявку</a>
        </div>
        </div>
      </div>
    </section>`;

  root.querySelectorAll(".tabset__nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      root.querySelectorAll(".tabset__nav button").forEach((b) => b.classList.toggle("active", b === btn));
      root.querySelectorAll(".tabset__pane").forEach((p) => p.classList.toggle("active", p.getAttribute("data-pane") === tab));
    });
  });
}

async function initProductPage() {
  const root = document.querySelector("[data-artikul-product]");
  if (!root) return;
  const params = new URLSearchParams(window.location.search);
  const materialCode = params.get("m");
  const artikulCode = params.get("a");
  try {
    const catalog = await loadCatalog();
    const material = findMaterial(catalog, materialCode);
    const art = material && findArtikul(material, artikulCode);
    if (!material || !art) {
      root.innerHTML = `<div class="container" style="padding:64px 24px"><p>Артикул не найден. <a href="catalog.html">Вернуться в каталог</a>.</p></div>`;
      return;
    }
    document.title = `${material.name} ${art.code} — ${art.form || ""} | ExaPolymer`;
    renderProductInto(root, catalog, material, art);
  } catch (err) {
    root.innerHTML = `<div class="container" style="padding:64px 24px"><p>Ошибка загрузки: ${escapeHtml(err.message)}</p></div>`;
  }
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Обрезает текст по границе слова (не разрывая слово посередине) для превью в карточке. */
function truncateWords(text, maxLen) {
  if (!text || text.length <= maxLen) return text || "";
  const cut = text.slice(0, maxLen + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut.slice(0, maxLen)).trimEnd() + "…";
}

/* ---------- Лайтбокс: просмотр фото (главное фото товара + галерея "Примеры работ") ---------- */
function initLightbox() {
  if (document.getElementById("siteLightbox")) return;
  const box = document.createElement("div");
  box.className = "lightbox";
  box.id = "siteLightbox";
  box.hidden = true;
  box.innerHTML = `<button type="button" class="lightbox__close" aria-label="Закрыть">✕</button><img class="lightbox__img" src="" alt="">`;
  document.body.appendChild(box);

  const img = box.querySelector(".lightbox__img");
  const closeBtn = box.querySelector(".lightbox__close");

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt || "";
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    box.hidden = true;
    img.src = "";
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".lightbox-trigger");
    if (trigger) {
      e.preventDefault();
      const photo = trigger.querySelector("img");
      openLightbox(trigger.getAttribute("href"), photo ? photo.alt : "");
      return;
    }
    if (!box.hidden && (e.target === closeBtn || e.target === box)) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) closeLightbox();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMaterialPage();
  initProductPage();
  initLightbox();
});
