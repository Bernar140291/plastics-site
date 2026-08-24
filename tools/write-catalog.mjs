/* Атомарная запись public/data/catalog.json.

   Зачем: файл импортируется в приложение (app/data/catalog.ts), поэтому за ним
   следит Vite. Обычная запись «поверх» сначала обнуляет файл, а потом наполняет
   его заново; если watcher успевает прочитать его в этот момент, сборка падает с
   «[plugin:builtin:vite-json] EOF while parsing a value at line 1 column 0».
   Здесь новое содержимое пишется во временный файл рядом и переносится на место
   переименованием — оно атомарно, промежуточного пустого состояния не бывает.

   Использование:
     node tools/write-catalog.mjs <файл-с-новым-json>
     node tools/write-catalog.mjs -            # прочитать из stdin

   Редактор (tools/editor) в этом не нуждается: File System Access API пишет
   через swap-файл и подменяет оригинал только на close(). */

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(ROOT, "public", "data", "catalog.json");
const TMP = TARGET + ".tmp";

function fail(message) {
  console.error("Каталог НЕ записан: " + message);
  process.exit(1);
}

async function readSource() {
  const arg = process.argv[2];
  if (!arg) fail("не указан источник. Использование: node tools/write-catalog.mjs <файл|->");
  if (arg !== "-") {
    if (!existsSync(arg)) fail(`файл не найден: ${arg}`);
    return readFileSync(arg, "utf8");
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const raw = await readSource();

let data;
try {
  data = JSON.parse(raw);
} catch (error) {
  fail("новое содержимое не разбирается как JSON — " + error.message);
}

if (!Array.isArray(data?.materials) || data.materials.length === 0) {
  fail("в корне нет непустого массива materials — не похоже на каталог");
}

/* Ссылки на несуществующие файлы дают 404 на живой странице, поэтому не пускаем */
const broken = [];
for (const material of data.materials) {
  for (const article of material.artikuls ?? []) {
    const paths = [article.photo, ...(article.workPhotos ?? []).map((p) => p.src)].filter(Boolean);
    for (const path of paths) {
      if (!existsSync(join(ROOT, "public", path))) broken.push(`${material.code}/${article.code} -> ${path}`);
    }
  }
}
if (broken.length) fail(`ссылки на отсутствующие фото:\n  ${broken.join("\n  ")}`);

/* Тот же формат, что у файла сейчас: отступ 2, без хвостового перевода строки */
writeFileSync(TMP, JSON.stringify(data, null, 2), "utf8");
try {
  renameSync(TMP, TARGET);
} catch (error) {
  if (existsSync(TMP)) unlinkSync(TMP);
  fail("не удалось перенести временный файл на место — " + error.message);
}

const articles = data.materials.reduce((sum, m) => sum + (m.artikuls?.length ?? 0), 0);
console.log(`Каталог записан: материалов ${data.materials.length}, артикулов ${articles}, ${Buffer.byteLength(raw, "utf8")} байт.`);
