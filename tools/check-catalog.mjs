import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(root, 'public');
const catalog = JSON.parse(readFileSync(resolve(publicRoot, 'data/catalog.json'), 'utf8'));
const materialSource = readFileSync(resolve(root, 'app/data/materials.ts'), 'utf8');
const knownSlugs = new Set([...materialSource.matchAll(/slug:\s*["']([^"']+)["']/g)].map(match => match[1]));
const slug = code => code.toLowerCase().replace(/\+/g, '-plus-').replace(/\//g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const routes = new Set();
const photos = new Set();
const missingSizes = [];
const missingWorkPhotos = [];
let articles = 0;
let illustrations = 0;
assert(catalog.materials.length > 0, 'Empty catalog');
assert.deepEqual(new Set(catalog.materials.map(m => m.code)), knownSlugs, 'materials.ts and catalog.json must contain the same materials');
for (const material of catalog.materials) {
  assert(material.artikuls?.length, `No articles: ${material.code}`);
  for (const article of material.artikuls) {
    const route = `/materials/${material.code}/${slug(article.code)}`;
    assert(!routes.has(route), `Duplicate route: ${route}`);
    routes.add(route);
    assert(article.photo, `Missing main photo: ${route}`);
    assert(article.shortDescription?.trim(), `Missing description: ${route}`);
    for (const path of [article.photo, ...(article.workPhotos || []).map(p => p.src)]) {
      assert(typeof path === 'string' && path.startsWith('assets/photos/'), `Invalid photo path: ${route}`);
      const target = resolve(publicRoot, path);
      const inside = relative(publicRoot, target);
      assert(!inside.startsWith('..') && !isAbsolute(inside), `Photo outside public: ${path}`);
      assert(existsSync(target) && statSync(target).isFile(), `Missing photo: ${path}`);
      assert(statSync(target).size > 0 && statSync(target).size < 1_000_000, `Empty/oversized photo: ${path}`);
      photos.add(path);
    }
    if (article.photoKind === 'illustration') illustrations++;
    if (!article.sizeGrid?.length) missingSizes.push(`${material.code}/${article.code}`);
    if (!article.workPhotos?.length) missingWorkPhotos.push(`${material.code}/${article.code}`);
    articles++;
  }
}
console.log(`PASS: ${catalog.materials.length} materials, ${articles} articles, ${photos.size} referenced image files, ${illustrations} labeled main illustrations.`);
console.log(`Supplier size grids still needed (${missingSizes.length}): ${missingSizes.join(', ')}`);
console.log(`No application photos (${missingWorkPhotos.length}): ${missingWorkPhotos.join(', ')}`);
