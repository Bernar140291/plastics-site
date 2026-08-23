import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { RequestForm } from "../components/request-form";

export const metadata: Metadata = { title: "Рассчитать поставку", description: "Запрос на подбор и расчёт поставки инженерного пластика." };

export default function RequestPage() {
  return (
    <main id="main-content">
      <section className="page-hero compact-hero"><div className="container"><p className="eyebrow">Запрос на расчёт</p><h1>Опишите материал или задачу</h1><p>Чем точнее условия работы и размеры, тем быстрее можно проверить подходящий материал и возможность поставки.</p></div></section>
      <section className="section request-section">
        <div className="container request-layout">
          <div className="request-aside"><p className="kicker">Что желательно указать</p><h2>Данные для первого подбора</h2><ul><li>Рабочая и кратковременная температура</li><li>Среда: вода, масло, кислота, щёлочь, пищевой контакт</li><li>Тип нагрузки и скорость скольжения</li><li>Размеры, допуски и количество</li><li>Желаемый срок и необходимые документы</li></ul><a className="contact-line" href="mailto:info@exapolymer.ru"><Mail size={18} /> info@exapolymer.ru</a><div className="safe-note"><ShieldCheck size={20} /><p>До оплаты должны быть согласованы марка, происхождение, срок, цена и доступный комплект документов.</p></div></div>
          <RequestForm />
        </div>
      </section>
    </main>
  );
}
