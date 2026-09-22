import catalogJson from "../../public/data/catalog.json";

export type PhysicalRow = {
  label: string;
  std?: string;
  condition?: string;
  unit?: string;
  value?: string | number;
};

export type PhysicalGroup = {
  group: string;
  rows: PhysicalRow[];
};

export type SizeRow = {
  range: string;
  sheet?: string;
  rod?: string;
  pipe?: string;
};

export type WorkPhoto = {
  src: string;
  caption?: string;
  kind?: "photo" | "illustration";
};

export type CatalogArticle = {
  code: string;
  kind?: string;
  form?: string;
  colors?: string[];
  photo?: string;
  photoKind?: "photo" | "illustration";
  shortDescription?: string;
  description?: string;
  applications?: string[];
  physicalParams?: PhysicalGroup[];
  sizeGrid?: SizeRow[];
  workPhotos?: WorkPhoto[];
};

export type CatalogMaterial = {
  code: string;
  name: string;
  fullName?: string;
  artikuls: CatalogArticle[];
};

type CatalogData = { materials: CatalogMaterial[] };

export const supplierCatalog = catalogJson as CatalogData;

/* Код материала в каталоге поставщика не всегда совпадает со слагом сайта.
   Держим связку в одном месте: отсюда её берут и страницы, и sitemap.
   Сейчас пусто — единственное расхождение (`pe-hd` → `pe`) ушло вместе с PE-HD. */
const sourceCodeBySlug: Record<string, string> = {};

export const siteSlugBySourceCode: Record<string, string> = Object.fromEntries(
  Object.entries(sourceCodeBySlug).map(([slug, code]) => [code, slug]),
);

/* Сколько марок опубликовано у материала. Считается по каталогу, а не списком в коде:
   таблица руками успела разойтись с данными (POM было 4 против 7, PET-P 1 против 3). */
export const articleCountBySlug: Record<string, number> = Object.fromEntries(
  supplierCatalog.materials.map((material) => [siteSlugBySourceCode[material.code] ?? material.code, material.artikuls.length]),
);

export function articleSlug(code: string) {
  return code
    .toLowerCase()
    .replace(/\+/g, "-plus-")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function catalogMaterialBySlug(slug: string) {
  const sourceCode = sourceCodeBySlug[slug] ?? slug;
  return supplierCatalog.materials.find((material) => material.code === sourceCode);
}

export function catalogArticleBySlug(materialSlug: string, slug: string) {
  return catalogMaterialBySlug(materialSlug)?.artikuls.find((article) => articleSlug(article.code) === slug);
}

export function publicPhoto(path?: string) {
  return path ? `/${path.replace(/^\//, "")}` : undefined;
}

export function articleDescription(materialCode: string, article: CatalogArticle) {
  if (materialCode === "pps" && article.code === "S12B") {
    return "Чёрное исполнение базового PPS для деталей, работающих при повышенной температуре и в химически активных средах. Марка сочетает низкое влагопоглощение, размерную стабильность и огнестойкость. Состав, наличие наполнителя и фактические показатели необходимо подтвердить по техническому листу конкретной партии.";
  }

  return (article.description || article.shortDescription || "Описание уточняется по техническому листу производителя.")
    .replace(/полифениленсульфона/gi, "полифениленсульфида")
    .replace(/присущей полиэфирэфиркетону/gi, "присущей полиэфиримиду");
}

export function articleCount() {
  return supplierCatalog.materials.reduce((total, material) => total + material.artikuls.length, 0);
}
