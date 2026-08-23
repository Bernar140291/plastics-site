"use client";

import { ArrowRight, Check, GitCompareArrows, RotateCcw, Search, Thermometer, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formOptions, loadOptions, Material, materials, mediaOptions } from "../data/materials";

const emptyFilters = { query: "", temperature: "", medium: "", load: "", form: "", availability: "" };
const gradeCounts: Record<string, number> = { peek: 3, pei: 3, pps: 4, pa: 3, pom: 4, pc: 2, pet: 1, ptfe: 1, pu: 2, abs: 2 };

export function CatalogExplorer() {
  const [filters, setFilters] = useState(emptyFilters);
  const [compare, setCompare] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => materials.filter((material) => {
    const haystack = `${material.code} ${material.name} ${material.aliases} ${material.summary}`.toLowerCase();
    const temperatureMatch = !filters.temperature
      || (filters.temperature === "80" && material.tempMax <= 80)
      || (filters.temperature === "120" && material.tempMax > 80 && material.tempMax <= 120)
      || (filters.temperature === "200" && material.tempMax > 120 && material.tempMax <= 200)
      || (filters.temperature === "201" && material.tempMax > 200);
    return haystack.includes(filters.query.toLowerCase())
      && temperatureMatch
      && (!filters.medium || material.media.includes(filters.medium))
      && (!filters.load || material.loads.includes(filters.load))
      && (!filters.form || material.forms.includes(filters.form))
      && (!filters.availability || material.availability === filters.availability);
  }), [filters]);

  const compared = compare.map((slug) => materials.find((item) => item.slug === slug)).filter(Boolean) as Material[];

  function toggleCompare(slug: string) {
    setMessage("");
    setCompare((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= 3) {
        setMessage("Для наглядного сравнения можно выбрать не более трёх материалов.");
        return current;
      }
      return [...current, slug];
    });
  }

  function updateFilter(name: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <section className="filter-panel" aria-labelledby="filter-title">
        <div className="filter-panel-top">
          <div><p className="kicker">Фильтр по условиям</p><h2 id="filter-title">Сузьте выбор материала</h2></div>
          <button className="reset-button" type="button" onClick={() => setFilters(emptyFilters)}><RotateCcw size={16} /> Сбросить</button>
        </div>
        <div className="filters-grid">
          <label className="search-field"><span>Поиск</span><span className="input-with-icon"><Search size={17} /><input type="search" value={filters.query} onChange={(event) => updateFilter("query", event.target.value)} placeholder="PEEK, фторопласт…" /></span></label>
          <label><span>Температура</span><select value={filters.temperature} onChange={(event) => updateFilter("temperature", event.target.value)}><option value="">Любая</option><option value="80">до 80 °C</option><option value="120">81–120 °C</option><option value="200">121–200 °C</option><option value="201">выше 200 °C</option></select></label>
          <label><span>Среда</span><select value={filters.medium} onChange={(event) => updateFilter("medium", event.target.value)}><option value="">Любая</option>{mediaOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Нагрузка</span><select value={filters.load} onChange={(event) => updateFilter("load", event.target.value)}><option value="">Любая</option>{loadOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Форма</span><select value={filters.form} onChange={(event) => updateFilter("form", event.target.value)}><option value="">Любая</option>{formOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Доступность</span><select value={filters.availability} onChange={(event) => updateFilter("availability", event.target.value)}><option value="">Любая</option><option value="Уточняется">Уточняется по запросу</option><option value="Подтверждено">Подтверждено</option></select></label>
        </div>
      </section>

      <div className="catalog-summary" aria-live="polite">
        <p>Найдено: <strong>{filtered.length}</strong></p>
        <p>Выбрано для сравнения: <strong>{compare.length} из 3</strong></p>
      </div>
      {message && <p className="inline-alert" role="status">{message}</p>}

      {filtered.length ? (
        <div className="catalog-grid">
          {filtered.map((material) => {
            const selected = compare.includes(material.slug);
            return (
              <article className="catalog-card" key={material.slug}>
                <a className="catalog-card-link" href={`/materials/${material.slug}`}>
                  <div className="card-top"><span className="material-code">{material.code}</span><ArrowRight size={19} /></div>
                  <p className="catalog-category">{material.category}</p>
                  <h3>{material.name}</h3>
                  <p className="catalog-summary-text">{material.summary}</p>
                  <div className="spec-row"><Thermometer size={17} /><span>{material.temperature}</span></div>
                  <div className="tag-row">{material.forms.slice(0, 3).map((form) => <span key={form}>{form}</span>)}</div>
                  <p className="grade-count">{gradeCounts[material.slug] ? `${gradeCounts[material.slug]} ${gradeCounts[material.slug] === 1 ? "марка" : "марки"} в каталоге` : "Марка подбирается по запросу"}</p>
                  <p className="availability"><span /> Доступность уточняется</p>
                </a>
                <label className={`compare-control ${selected ? "is-selected" : ""}`}>
                  <input type="checkbox" checked={selected} disabled={!selected && compare.length >= 3} onChange={() => toggleCompare(material.slug)} />
                  <span>{selected ? <Check size={17} /> : <GitCompareArrows size={17} />}{selected ? "Добавлено" : "В сравнение"}</span>
                </label>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-results"><Search size={28} /><h3>Материалы не найдены</h3><p>Снимите часть фильтров или отправьте задачу — проверим альтернативы.</p><button className="button button-dark" type="button" onClick={() => setFilters(emptyFilters)}>Сбросить фильтры</button></div>
      )}

      {compared.length > 0 && (
        <section className="comparison-section" id="comparison" aria-labelledby="comparison-title">
          <div className="comparison-heading">
            <div><p className="kicker">Сравнение</p><h2 id="comparison-title">Выбранные материалы</h2></div>
            <button className="reset-button" type="button" onClick={() => setCompare([])}><X size={16} /> Очистить</button>
          </div>
          {compared.length === 1 ? <p className="comparison-hint">Добавьте ещё хотя бы один материал, чтобы сравнить параметры.</p> : (
            <>
              <div className="comparison-table-wrap">
                <table className="comparison-table">
                  <caption>Ориентировочное сравнение выбранных инженерных пластиков</caption>
                  <thead><tr><th scope="col">Параметр</th>{compared.map((material) => <th scope="col" key={material.slug}>{material.code}<small>{material.name}</small></th>)}</tr></thead>
                  <tbody>
                    <tr><th scope="row">Температура</th>{compared.map((material) => <td key={material.slug}>{material.temperature}</td>)}</tr>
                    <tr><th scope="row">Плотность</th>{compared.map((material) => <td key={material.slug}>{material.density}</td>)}</tr>
                    <tr><th scope="row">Прочность при растяжении</th>{compared.map((material) => <td key={material.slug}>{material.tensile}</td>)}</tr>
                    <tr><th scope="row">Влагопоглощение</th>{compared.map((material) => <td key={material.slug}>{material.moisture}</td>)}</tr>
                    <tr><th scope="row">Формы поставки</th>{compared.map((material) => <td key={material.slug}>{material.forms.join(", ")}</td>)}</tr>
                  </tbody>
                </table>
              </div>
              <div className="comparison-mobile-cards">
                {compared.map((material) => <article key={material.slug}><div className="card-top"><span className="material-code">{material.code}</span><button type="button" aria-label={`Убрать ${material.code} из сравнения`} onClick={() => toggleCompare(material.slug)}><X size={18} /></button></div><h3>{material.name}</h3><dl><div><dt>Температура</dt><dd>{material.temperature}</dd></div><div><dt>Плотность</dt><dd>{material.density}</dd></div><div><dt>Прочность</dt><dd>{material.tensile}</dd></div><div><dt>Влагопоглощение</dt><dd>{material.moisture}</dd></div><div><dt>Формы</dt><dd>{material.forms.join(", ")}</dd></div></dl></article>)}
              </div>
              <p className="data-note">* Значения ориентировочные. Для проектирования используйте паспорт конкретной марки, температуру среды и фактическую нагрузку.</p>
            </>
          )}
        </section>
      )}
    </>
  );
}
