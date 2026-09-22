import { ArrowRight } from "lucide-react";
import { materials } from "../data/materials";

/** Лента всех материалов под шапкой страницы: заменяет ссылки «назад» прямым переходом на любой материал. */
export function MaterialNav({ activeSlug }: { activeSlug: string }) {
  return (
    <nav className="material-nav" aria-label="Материалы каталога">
      <div className="container">
        <p className="material-nav-label">Материалы</p>
        <ul>
          {materials.map((material) => {
            const isActive = material.slug === activeSlug;
            return (
              <li key={material.slug}>
                <a className={isActive ? "is-active" : undefined} aria-current={isActive ? "page" : undefined} href={`/materials/${material.slug}`}>{material.code}</a>
              </li>
            );
          })}
        </ul>
        <a className="material-nav-all" href="/catalog">Сравнить материалы <ArrowRight size={15} /></a>
      </div>
    </nav>
  );
}
