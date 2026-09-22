import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return <main id="main-content"><section className="page-hero compact-hero"><div className="container"><h1>Страница не найдена</h1><p>Возможно, адрес изменился или эта марка больше не представлена в каталоге.</p><div className="hero-actions"><a className="button button-primary" href="/catalog">Открыть каталог <ArrowRight size={18} /></a><a className="button button-outline" href="/contacts">Запросить подбор</a></div></div></section></main>;
}
