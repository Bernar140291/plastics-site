import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock3, Mail, ShieldCheck } from "lucide-react";
import { RequestForm } from "../components/request-form";

export const metadata: Metadata = { title: "Контакты и запрос на расчёт", description: "Отправьте техническое задание или запросите подбор инженерного пластика." };

export default function ContactsPage() {
  return (
    <main id="main-content">
      <section className="page-hero compact-hero"><div className="container"><p className="eyebrow">Контакты</p><h1>Отправьте задачу на предварительный расчёт</h1><p>Укажите материал, размеры и условия работы. Подготовим список уточнений и проверим возможность поставки у производственного партнёра.</p></div></section>
      <section className="section request-section">
        <div className="container request-layout">
          <div className="request-aside">
            <p className="kicker">Что желательно указать</p>
            <h2>Данные для первого подбора</h2>
            <ul><li>Рабочая и кратковременная температура</li><li>Среда: вода, масло, кислота, щёлочь, пищевой контакт</li><li>Тип нагрузки и скорость скольжения</li><li>Размеры, допуски и количество</li><li>Желаемый срок и необходимые документы</li></ul>
            <div className="contact-methods">
              <a className="contact-line" href="mailto:info@exapolymer.ru"><Mail size={18} /> info@exapolymer.ru</a>
              <p><Clock3 size={18} /> Срок ответа будет указан после получения запроса.</p>
            </div>
            <div className="safe-note"><ShieldCheck size={20} /><p>До оплаты согласовываются точная марка, производитель, происхождение, срок, цена и доступный комплект документов.</p></div>
          </div>
          <Suspense fallback={<div className="request-form" aria-busy="true" />}>
            <RequestForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
