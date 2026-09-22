import type { Metadata } from "next";
import { ArrowRight, ClipboardCheck, FileSearch, Handshake, SearchCheck, ShieldCheck } from "lucide-react";
import { articleCount } from "../data/catalog";
import { materials } from "../data/materials";

export const metadata: Metadata = {
  title: "О проекте",
  alternates: { canonical: "/about" },
  description: "ExaPolymer — проект по подбору и поставке инженерных пластиков под задачу заказчика.",
};

export default function AboutPage() {
  return (
    <main id="main-content">
      <section className="page-hero compact-hero">
        <div className="container">
          <p className="eyebrow">О проекте</p>
          <h1>Технический подбор без выдуманного масштаба</h1>
          <p>ExaPolymer находится на этапе проверки спроса. Мы собираем запрос, подбираем материал и уточняем возможность поставки у производственного партнёра.</p>
        </div>
      </section>

      <section className="section about-intro">
        <div className="container about-grid">
          <div><p className="kicker">Позиционирование</p><h2>Не изображаем завод или крупный склад</h2></div>
          <div><p>Сайт должен помогать инженеру и закупщику понять ассортимент, сравнить материалы и сформировать технический запрос. Производитель, наличие, цена, срок и документы подтверждаются для конкретной партии.</p><p>Это позволяет тестировать интерес к продукту честно и не создавать ожиданий, которые пока невозможно гарантировать.</p></div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-heading"><div><p className="kicker">Каталог</p><h2>Достаточно данных для предметного разговора</h2></div></div>
          <div className="about-stats">
            <div><strong>{materials.length}</strong><span>групп материалов</span></div>
            <div><strong>{articleCount()}</strong><span>описанных марок и исполнений</span></div>
            <div><strong>5</strong><span>параметров фильтрации</span></div>
            <div><strong>1 запрос</strong><span>для подбора и расчёта</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading"><div><p className="kicker">Принцип работы</p><h2>Что происходит после обращения</h2></div></div>
          <div className="value-grid">
            <article><ClipboardCheck /><h3>Фиксируем задачу</h3><p>Материал, размеры, количество, температура, среда, нагрузка и срок.</p></article>
            <article><SearchCheck /><h3>Проверяем альтернативы</h3><p>Сравниваем базовый полимер, наполнение и возможные ограничения применения.</p></article>
            <article><FileSearch /><h3>Запрашиваем данные</h3><p>Уточняем производителя, наличие, формат, технический лист и доступные документы.</p></article>
            <article><Handshake /><h3>Согласовываем условия</h3><p>Фиксируем спецификацию, стоимость, срок и порядок поставки до оплаты.</p></article>
          </div>
        </div>
      </section>

      <section className="section contact-preview">
        <div className="container">
          <div className="contact-box">
            <div><p className="kicker">Следующий шаг</p><h2>Есть задача по материалу?</h2><p>Откройте каталог или пришлите требования — так будет проще понять, есть ли реальный спрос и какие позиции приоритетны.</p></div>
            <div className="cta-stack"><a className="button button-light" href="/catalog">Открыть каталог <ArrowRight size={18} /></a><a className="button button-outline-light" href="/contacts"><ShieldCheck size={18} /> Отправить ТЗ</a></div>
          </div>
        </div>
      </section>
    </main>
  );
}
