import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_ORIGIN } from "./data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: SITE_INDEXABLE
      ? { userAgent: "*", allow: "/", disallow: ["/editor/", "/data/"] }
      : { userAgent: "*", disallow: "/" },
    ...(SITE_INDEXABLE ? { sitemap: `${SITE_ORIGIN}/sitemap.xml` } : {}),
  };
}
