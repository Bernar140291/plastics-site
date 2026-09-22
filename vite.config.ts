import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import hostingConfig from './.openai/hosting.json';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

/* Редактор каталога — инструмент разработки, а не часть сайта.
   Он лежит в tools/editor и раздаётся только dev-сервером (apply: 'serve'),
   поэтому в производственную сборку не попадает: наружу не торчит, и
   не возникает расхождения «читаю из dist/, пишу в public/» — в dev оба
   конца работают с одним и тем же public/data/catalog.json. */
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function devEditor(): Plugin {
  const root = join(process.cwd(), 'tools', 'editor');
  return {
    name: 'exapolymer-dev-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        let url: string;
        try { url = decodeURIComponent((req.url || '').split('?')[0]); }
        catch { res.statusCode = 400; return res.end('Bad request'); }
        if (url !== '/editor' && !url.startsWith('/editor/')) return next();

        const rest = url.slice('/editor'.length).replace(/^\/+/, '');
        const file = rest === '' ? 'index.html' : rest;

        // не выпускаем за пределы tools/editor
        const target = resolve(root, file);
        const withinRoot = relative(root, target);
        if (withinRoot.startsWith('..') || isAbsolute(withinRoot)) {
          res.statusCode = 403;
          return res.end('Forbidden');
        }

        readFile(target).then(
          (body) => {
            res.setHeader('Content-Type', MIME[extname(target)] ?? 'application/octet-stream');
            res.setHeader('Cache-Control', 'no-store');
            res.end(body);
          },
          () => next(),
        );
      });
    },
  };
}

const localBindingConfig = {
  name: 'exapolymer-next',
  main: 'vinext/server/app-router-entry',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
};

export default defineConfig(async ({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const origin = new URL(env.SITE_ORIGIN || 'https://exapolymer.ru');
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) {
    throw new Error('SITE_ORIGIN must be an http(s) origin without credentials');
  }
  const indexable = env.SITE_INDEXABLE === 'true';
  const deliveryEnabled = env.FORM_DELIVERY_ENABLED === 'true';
  const operator = env.PRIVACY_OPERATOR?.trim() || '';
  const operatorAddress = env.PRIVACY_OPERATOR_ADDRESS?.trim() || '';
  if ((indexable || deliveryEnabled) && (!operator || !operatorAddress)) {
    throw new Error('Before public launch, set PRIVACY_OPERATOR and PRIVACY_OPERATOR_ADDRESS. Preview builds work without them.');
  }
  if (indexable && origin.protocol !== 'https:') throw new Error('An indexed site must use HTTPS');
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    define: {
      'process.env.SITE_ORIGIN': JSON.stringify(origin.origin),
      'process.env.SITE_INDEXABLE': JSON.stringify(String(indexable)),
      'process.env.FORM_DELIVERY_ENABLED': JSON.stringify(String(deliveryEnabled)),
      'process.env.PRIVACY_OPERATOR': JSON.stringify(operator),
      'process.env.PRIVACY_OPERATOR_ADDRESS': JSON.stringify(operatorAddress),
    },
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      devEditor(),
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: localBindingConfig,
      }),
    ],
  };
});
