import { Mail, MapPin } from "lucide-react";
import { SITE_INDEXABLE } from "../data/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <a className="brand footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true">EP</span>
            <span><strong>ExaPolymer</strong><small>Инженерные пластики</small></span>
          </a>
          <p>Подбор инженерных пластиков и поставка листов, стержней и заготовок под конкретную задачу.</p>
        </div>
        <div><h2>Разделы</h2><a href="/catalog">Каталог</a><a href="/supply">Как проходит поставка</a><a href="/about">О проекте</a><a href="/contacts">Запрос на расчёт</a></div>
        <div><h2>Материалы</h2><a href="/materials/peek">PEEK</a><a href="/materials/pei">PEI</a><a href="/materials/pps">PPS</a><a href="/materials/pom">POM</a><a href="/materials/pa">PA</a><a href="/catalog">Все 10 материалов</a></div>
        <div><h2>Связаться</h2><a className="footer-contact" href="mailto:info@exapolymer.ru"><Mail size={17} />info@exapolymer.ru</a><p className="footer-location"><MapPin size={17} />Поставка по России — маршрут и срок рассчитываются по запросу.</p><p>Производитель, наличие и комплект документов подтверждаются отдельно для каждой партии.</p></div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 ExaPolymer</span>
        <nav className="footer-legal" aria-label="Правовая информация"><a href="/privacy">Обработка персональных данных</a><a href="/consent">Согласие на обработку</a>{!SITE_INDEXABLE && <span>Предварительная версия</span>}</nav>
      </div>
    </footer>
  );
}
