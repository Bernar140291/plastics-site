/* Один источник правды по адресу сайта: metadataBase, robots.txt, sitemap.xml
   и абсолютные ссылки на картинки Open Graph.

   Переопределяется переменной окружения SITE_ORIGIN. Это нужно, чтобы сборку
   можно было выложить на превью-хост, не рассылая при этом краулеров на боевой
   домен: иначе robots.txt указал бы на exapolymer.ru/sitemap.xml, а sitemap
   перечислил бы 39 адресов, которых на живом сайте пока нет. */
const FALLBACK_ORIGIN = "https://exapolymer.ru";

function readOrigin() {
  /* Модуль попадает и в клиентский граф, где глобального process нет —
     без этой проверки навигация падала с «process is not defined».
     В браузере переменная и не нужна: значение уже вшито в отрендеренную разметку. */
  const raw = typeof process === "undefined" ? undefined : process.env.SITE_ORIGIN?.trim();
  if (!raw) return FALLBACK_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    console.warn(`SITE_ORIGIN="${raw}" — не разбирается как URL, беру ${FALLBACK_ORIGIN}`);
    return FALLBACK_ORIGIN;
  }
}

export const SITE_ORIGIN = readOrigin();
