import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'next-env.d.ts',
    // Редактор каталога перенесён с рабочего сайта как есть и правится там же,
    // а не здесь. Держим его вне правил проекта, чтобы диффы оставались чистыми.
    'tools/editor/**',
  ]),
  {
    rules: {
      /* Фотографии отдаются как есть: они уже сжаты (~130 КБ, ширина 1100-1400 px),
         проставлены width/height и loading="lazy". Сайт разворачивается на
         Cloudflare Workers, где оптимизатор next/image не работает без отдельного
         загрузчика — с `unoptimized` компонент свёлся бы к тому же <img>, только
         с лишним JS. Решение принято осознанно, а не по недосмотру. */
      '@next/next/no-img-element': 'off',

      /* Внутренняя навигация намеренно на <a>, а не на <Link>.
         Клиентский роутер vinext 1.0.0-beta.3 нерабочий, и это проверено:
         - в dev переход по <Link> падает с «process is not defined»
           (stageAppNavigationFailureTarget в его navigation.js);
         - в производственной сборке — «TypeError: e is not a function»
           в link-*.js, причём обработчик успевает отменить событие,
           поэтому переход не происходит вообще: ссылки становятся мёртвыми.
         С обычным <a> переходы работают всегда, ценой полной перезагрузки
         страницы. Вернуться к <Link> — когда vinext это починит; проверять
         обязательно на `pnpm build` + `pnpm start`, в dev симптом другой. */
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]);

export default eslintConfig;
