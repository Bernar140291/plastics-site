import type { MetadataRoute } from "next";
import { articleSlug, supplierCatalog } from "./data/catalog";
import { materials } from "./data/materials";
import { SITE_ORIGIN } from "./data/site";

/* Код материала в каталоге поставщика не всегда совпадает со слагом сайта. */
const siteSlugBySourceCode: Record<string, string> = { pe: "pe-hd" };

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string, priority: number, changeFrequency: "weekly" | "monthly") =>
    ({ url: `${SITE_ORIGIN}${path}`, lastModified: now, changeFrequency, priority });

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
