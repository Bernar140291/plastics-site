import {
  ArrowRight,
  Boxes,
  CircleCheckBig,
  ClipboardCheck,
  FileCheck2,
  FlaskConical,
  Gauge,
  PackageCheck,
  Ruler,
  Send,
  ShieldCheck,
  Thermometer,
} from "lucide-react";
import { materials } from "./data/materials";

const featured = ["peek", "ptfe", "pom"].map((slug) => materials.find((material) => material.slug === slug)!);

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><ShieldCheck size={17} /> Подбор и поставка под заказ</p>
            <h1>Инженерные пластики под задачу производства</h1>
            <p className="hero-lead">Подберём листы, стержни или заготовки по температуре, среде и нагрузке. Проверим доступность у производственного партнёра и подготовим расчёт.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/contacts">Рассчитать поставку <ArrowRight size={18} /></a>
              <a className="button button-outline" href="/catalog">Подобрать материал</a>
            </div>
            <p className="launch-note">Проект на этапе запуска. Наличие, срок и комплект документов подтверждаем для каждой партии до оформления заказа.</p>
          </div>

          <div className="hero-panel" aria-label="Схема подбора материала">
            <div className="panel-topline"><span>Карта подбора</span><span>01—04</span></div>
            <div className="selection-list">
              <div><Thermometer /><span><small>Температура</small><strong>рабочий диапазон</strong></span><b>01</b></div>
              <div><FlaskConical /><span><small>Среда</small><strong>химия и влажность</strong></span><b>02</b></div>
              <div><Gauge /><span><small>Нагрузка</small><strong>прочность и трение</strong></span><b>03</b></div>
              <div><Ruler /><span><small>Форма</small><strong>лист, стержень, заготовка</strong></span><b>04</b></div>
            </div>
            <div className="panel-result"><FileCheck2 size={20} /><span>На выходе: спецификация материала и расчёт поставки</span></div>
          </div>
        </div>
      </section>

      <section className="fact-strip" id="process">
        <div className="container fact-grid">
          <div><Boxes /><span><strong>Поставка под заказ</strong><small>без неподтверждённых обещаний о складе</small></span></div>
          <div><Ruler /><span><strong>Подбор по условиям</strong><small>температура, среда, нагрузка, форма</small></span></div>
          <div><Send /><span><strong>Один запрос</strong><small>подбор, доступность и расчёт в одном ответе</small></span></div>
        </div>
      </section>

      <section className="section" id="solutions">
        <div className="container">
          <div className="section-heading">
            <div><p className="kicker">Популярные материалы</p><h2>Начните с задачи, а не с аббревиатуры</h2></div>
            <a className="text-link" href="/catalog">Перейти в каталог <ArrowRight size={17} /></a>
          </div>
          <div className="material-grid">
            {featured.map((material) => (
              <a className="material-card" href={`/materials/${material.slug}`} key={material.code}>
                <div className="card-top"><span className="material-code">{material.code}</span><ArrowRight size={19} /></div>
                <p className="material-kind">{material.category}</p>
                <h3>{material.name}</h3>
                <p className="card-summary">{material.summary}</p>
                <div className="temp"><Thermometer size={17} /> {material.temperature}</div>
                <ul>{material.properties.slice(0, 2).map((property) => <li key={property}>{property}</li>)}</ul>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint" id="selection">
        <div className="container">
          <div className="section-heading narrow-heading"><div><p className="kicker">Процесс подбора</p><h2>Четыре шага до понятного предложения</h2></div></div>
          <ol className="process-grid">
            <li><span>01</span><ClipboardCheck /><h3>Получаем задачу</h3><p>Размеры, количество, рабочая температура, среда и характер нагрузки.</p></li>
            <li><span>02</span><FlaskConical /><h3>Проверяем материал</h3><p>Сравниваем свойства и обозначаем ограничения, которые нельзя игнорировать.</p></li>
            <li><span>03</span><PackageCheck /><h3>Уточняем поставку</h3><p>Проверяем доступность, срок, формат заготовки и документы конкретной партии.</p></li>
            <li><span>04</span><CircleCheckBig /><h3>Фиксируем условия</h3><p>Вы получаете спецификацию и коммерческое предложение до оплаты.</p></li>
          </ol>
        </div>
      </section>

      <section className="section transparency-section">
        <div className="container transparency-grid">
          <div><p className="kicker">Прозрачность на старте</p><h2>Не подменяем факты маркетинговыми обещаниями</h2><p>Для теста спроса важнее честно описать процесс, чем изображать крупного складского дистрибьютора. Поэтому новая версия разделяет справочные данные и то, что подтверждено для конкретного заказа.</p></div>
          <div className="truth-list">
            <div><span>Подтверждаем</span><strong>доступность и срок</strong></div>
            <div><span>Уточняем</span><strong>марку и производителя</strong></div>
            <div><span>Прикладываем</span><strong>доступные документы партии</strong></div>
            <div><span>Не заявляем без проверки</span><strong>сертификацию и официальный статус</strong></div>
          </div>
        </div>
      </section>

      <section className="section contact-preview">
        <div className="container">
          <div className="contact-box">
            <div><p className="kicker">Запрос на расчёт</p><h2>Проверим возможность поставки</h2><p>Укажите материал или опишите задачу. До заказа подтвердим доступность, срок и комплект документов по партии.</p></div>
            <a className="button button-light" href="/contacts"><Send size={18} /> Отправить ТЗ</a>
          </div>
        </div>
      </section>
    </main>
  );
}
