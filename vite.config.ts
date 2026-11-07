import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Nazwa aplikacji, ZIP-a i pliku HTML pochodzi z app.config.json (jedno miejsce do zmiany)
const app = JSON.parse(readFileSync(new URL('./app.config.json', import.meta.url), 'utf8')) as {
  name: string;
  slug: string;
  tagline: string;
};
const zipName = `${app.slug}-offline.zip`;

// Na GitHub Actions repo jest znane z GITHUB_REPOSITORY, lokalnie link do repo po prostu się nie pokazuje
const repoUrl = process.env.GITHUB_REPOSITORY ? `https://github.com/${process.env.GITHUB_REPOSITORY}` : '';

// Tytuł i opis strony w index.html. order: 'pre', żeby Vite nie próbował traktować %...% jak zmiennych środowiskowych.
function appMeta(): Plugin {
  return {
    name: 'app-meta',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replace('%APP_TITLE%', `${app.name} - ${app.tagline}`)
          .replace(
            '%APP_DESCRIPTION%',
            `${app.name}: ${app.tagline}. Działa w przeglądarce, pliki nie opuszczają komputera.`
          )
    }
  };
}

// W trybie `npm run dev` link do wersji na Windows działa tak samo jak na stronie: serwer wydaje ZIP z katalogu
// dist (powstaje przy `npm run build`). Gdy go nie ma, odpowiada czytelnym 404, a nie stroną startową udającą ZIP-a.
function devZip(): Plugin {
  return {
    name: 'dev-zip',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(`/${zipName}`, (_req, res) => {
        const file = resolve('dist', zipName);
        if (!existsSync(file)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(`Brak pliku ${zipName}. Najpierw uruchom: npm run build`);
          return;
        }
        res.setHeader('Content-Type', 'application/zip');
        createReadStream(file).pipe(res);
      });
    }
  };
}

// Cała aplikacja (JS, CSS, czcionki, worker PDF) ląduje w jednym pliku index.html.
// Dzięki temu ten sam plik działa na GitHub Pages i po dwukliku z dysku (file://),
// gdzie osobne moduły ES są blokowane przez przeglądarkę.
export default defineConfig({
  base: './',
  plugins: [appMeta(), devZip(), react(), viteSingleFile()],
  define: { __REPO_URL__: JSON.stringify(repoUrl) },
  build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
  server: { port: 5173 }
});
