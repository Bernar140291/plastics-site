import type { MetadataRoute } from "next";
import { articleSlug, siteSlugBySourceCode, supplierCatalog } from "./data/catalog";
import { materials } from "./data/materials";
import { SITE_ORIGIN } from "./data/site";

/* Момент сборки, а не запроса: иначе каждый обход краулера видел бы все 44 URL
   изменёнными «прямо сейчас», и lastmod обесценивался бы как сигнал. */
const BUILD_TIME = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string, priority: number, changeFrequency: "weekly" | "monthly") =>
    ({ url: `${SITE_ORIGIN}${path}`, lastModified: BUILD_TIME, changeFrequency, priority });

  const staticPages = [
    url("/", 1, "weekly"),
    url("/catalog", 0.9, "weekly"),
    url("/supply", 0.7, "monthly"),
    url("/about", 0.6, "monthly"),
    url("/contacts", 0.7, "monthly"),
  ];

  const materialPages = materials.map((material) => url(`/materials/${material.slug}`, 0.8, "monthly"));

  const articlePages = supplierCatalog.materials.flatMap((material) =>
    material.artikuls.map((article) =>
      url(`/materials/${siteSlugBySourceCode[material.code] ?? material.code}/${articleSlug(article.code)}`, 0.7, "monthly"),
    ),
  );

  return [...staticPages, ...materialPages, ...articlePages];
}
