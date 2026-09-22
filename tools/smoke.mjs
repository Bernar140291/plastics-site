import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] || 'http://127.0.0.1:3100';
const expectedOrigin = process.env.EXPECTED_SITE_ORIGIN || 'https://exapolymer.ru';
const indexable = process.env.EXPECTED_INDEXABLE === 'true';
const catalog = JSON.parse(readFileSync(resolve(root, 'public/data/catalog.json'), 'utf8'));
const slug = code => code.toLowerCase().replace(/\+/g, '-plus-').replace(/\//g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const pages = ['/', '/catalog', '/contacts', '/about', '/supply', '/privacy', '/consent'];
const photos = new Set(['/og-milk.jpg', '/icon.svg']);
for (const material of catalog.materials) {
  pages.push(`/materials/${material.code}`);
  for (const article of material.artikuls) {
    pages.push(`/materials/${material.code}/${slug(article.code)}`);
    for (const path of [article.photo, ...(article.workPhotos || []).map(p => p.src)].filter(Boolean)) photos.add('/' + path);
  }
}
async function get(path) {
  return fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(20000) });
}
for (const path of pages) {
  const response = await get(path);
  assert.equal(response.status, 200, `Page ${path}`);
  const html = await response.text();
  assert(/<h1[\s>]/.test(html), `No heading: ${path}`);
  const canonicalTag = html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0];
  const canonical = canonicalTag?.match(/href="([^"]+)"/)?.[1];
  assert(canonical && new URL(canonical).href === new URL(path, expectedOrigin).href, `Canonical: ${path} -> ${canonicalTag}`);
  const robotsTag = html.match(/<meta\b[^>]*name="robots"[^>]*>/)?.[0];
  assert(robotsTag && (indexable ? !robotsTag.includes('noindex') : robotsTag.includes('noindex')), `Robots meta: ${path}`);
  assert(!html.includes('Фото марки уточняется'), `Unfilled photo: ${path}`);
  assert(!html.includes('[plugin:'), `Build overlay: ${path}`);
}
for (const path of photos) {
  const response = await get(path);
  assert.equal(response.status, 200, `Image ${path}`);
  assert(response.headers.get('content-type')?.startsWith('image/'), `Image MIME: ${path}`);
  await response.arrayBuffer();
}
for (const path of ['/not-a-page', '/materials/no-such-material', '/materials/abs/no-such-grade', '/editor/', '/editor/index.html', '/editor/editor.js']) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 404, `Expected 404: ${path}`);
  await response.text();
}
const redirect = await get('/request');
assert([301,308].includes(redirect.status), '/request must be a permanent redirect');
assert(redirect.headers.get('location')?.endsWith('/contacts'), '/request destination');
const robots = await (await get('/robots.txt')).text();
assert(indexable ? robots.includes('Allow: /') : robots.includes('Disallow: /'), 'robots.txt mode');
const sitemap = await (await get('/sitemap.xml')).text();
for (const page of pages) assert(sitemap.includes(`<loc>${expectedOrigin}${page}</loc>`), `Sitemap URL: ${page}`);
assert(!sitemap.includes('/editor'), 'Editor in sitemap');
assert.equal((sitemap.match(/<loc>/g) || []).length, pages.length, 'Unexpected sitemap URLs');
console.log(`PASS: ${pages.length} pages, ${photos.size} image URLs, 6 expected 404s, /request redirect, robots and sitemap. Mode: ${indexable ? 'indexable' : 'noindex preview'}.`);
