/* Один источник правды по адресу сайта: metadataBase, robots.txt, sitemap.xml
   и абсолютные ссылки на картинки Open Graph.

   Переопределяется переменной окружения SITE_ORIGIN. Это нужно, чтобы сборку
   можно было выложить на превью-хост, не рассылая при этом краулеров на боевой
   домен: иначе robots.txt указал бы на exapolymer.ru/sitemap.xml, а sitemap
   перечислил бы адреса новой версии, которых на живом сайте пока нет. */
const FALLBACK_ORIGIN = "https://exapolymer.ru";

function readOrigin() {
  /* Vite embeds this specific public setting in both client and server bundles.
     Do not replace it with a runtime process.env lookup on Cloudflare Workers. */
  const raw = process.env.SITE_ORIGIN?.trim();
  if (!raw) return FALLBACK_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    console.warn(`SITE_ORIGIN="${raw}" — не разбирается как URL, беру ${FALLBACK_ORIGIN}`);
    return FALLBACK_ORIGIN;
  }
}

export const SITE_ORIGIN = readOrigin();
// These public values are embedded by vite.config.ts at build time on Workers too.
export const SITE_INDEXABLE = process.env.SITE_INDEXABLE === "true";
export const FORM_DELIVERY_ENABLED = process.env.FORM_DELIVERY_ENABLED === "true";
export const PRIVACY_OPERATOR = process.env.PRIVACY_OPERATOR || "";
export const PRIVACY_OPERATOR_ADDRESS = process.env.PRIVACY_OPERATOR_ADDRESS || "";
export const PRIVACY_VERSION = "2026-09-18";
