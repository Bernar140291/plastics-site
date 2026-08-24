import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, type Plugin } from 'vite';
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
        const url = (req.url || '').split('?')[0];
        if (!url.startsWith('/editor')) return next();

        const rest = url.slice('/editor'.length).replace(/^\/+/, '');
        const file = rest === '' ? 'index.html' : rest;

        // не выпускаем за пределы tools/editor
        const target = normalize(join(root, file));
        if (!target.startsWith(root)) {
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

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
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
