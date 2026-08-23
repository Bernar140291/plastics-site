import type { Metadata } from "next";
import { ArrowRight, Boxes, ClipboardList, FileCheck2, PackageCheck, Route, Scale } from "lucide-react";

export const metadata: Metadata = { title: "Как проходит поставка", description: "Этапы подбора, проверки партии и расчёта поставки инженерных пластиков." };

export default function SupplyPage() {
  return (
    <main id="main-content">
      <section className="page-hero compact-hero"><div className="container"><p className="eyebrow">Поставка</p><h1>От технического запроса до согласованной партии</h1><p>На старте важна прозрачная последовательность: сначала задача и проверка, затем спецификация и коммерческие условия.</p></div></section>

      <section className="section"><div className="container"><div className="supply-timeline"><article><span>01</span><ClipboardList /><div><h2>Получаем требования</h2><p>Фиксируем материал или назначение детали, размеры, количество, условия эксплуатации и желаемый срок.</p></div></article><article><span>02</span><Boxes /><div><h2>Подбираем марку</h2><p>Сравниваем базовые и наполненные исполнения, проверяем ограничения и задаём уточняющие вопросы.</p></div></article><article><span>03</span><FileCheck2 /><div><h2>Проверяем партию</h2><p>Уточняем производителя, доступность, форму заготовки, технические данные и фактически доступные документы.</p></div></article><article><span>04</span><PackageCheck /><div><h2>Фиксируем предложение</h2><p>Согласовываем точную позицию, количество, стоимость, срок, упаковку и маршрут доставки до оплаты.</p></div></article></div></div></section>

      <section className="section section-tint"><div className="container supply-grid"><div><p className="kicker">Что подтверждаем</p><h2>Данные конкретной поставки</h2><ul className="supply-checklist"><li><FileCheck2 />Точное обозначение материала и марки</li><li><Boxes />Форму, размер и количество заготовок</li><li><Route />Ориентировочный маршрут и срок</li><li><Scale />Комплект доступных документов и условия оплаты</li></ul></div><aside className="supply-warning"><h3>До подтверждения это не обещание наличия</h3><p>Карточки каталога нужны для предварительного выбора. Фактическое наличие, происхождение, допуски и документация зависят от конкретной марки и партии.</p><a className="button button-dark" href="/contacts">Рассчитать поставку <ArrowRight size={18} /></a></aside></div></section>

      <section className="section"><div className="container faq-grid"><div><p className="kicker">Частые вопросы</p><h2>Что уточнить заранее</h2></div><div><details open><summary>Можно заказать небольшой объём?</summary><p>Минимальная партия зависит от марки, формы и доступности. Укажите нужное количество — проверим варианты.</p></details><details><summary>Какие документы будут у материала?</summary><p>Перечень документов нельзя обещать одинаковым для всех позиций. Его подтверждают до оформления конкретной поставки.</p></details><details><summary>Можно подобрать аналог?</summary><p>Да, если известны температура, среда, нагрузка, требуемые размеры и критичные свойства детали.</p></details><details><summary>Есть ли раскрой или изготовление по чертежу?</summary><p>Возможность обработки проверяется отдельно вместе с допусками, материалом и объёмом.</p></details></div></div></section>
    </main>
  );
}
