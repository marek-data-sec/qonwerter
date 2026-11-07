// Po buildzie: (1) wpisuje do index.html politykę CSP z hashem inline'owego skryptu,
// (2) pakuje wersję offline na Windows do ZIP-a obok index.html (serwuje go GitHub Pages).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strToU8, zipSync } from 'fflate';

// Nazwy pochodzą z app.config.json, tak samo jak w vite.config.ts
const app = JSON.parse(readFileSync('app.config.json', 'utf8'));
const HTML_NAME = `${app.slug}.html`;
const ZIP_NAME = `${app.slug}-offline.zip`;

let html = readFileSync('dist/index.html', 'utf8');
// Zabezpieczenie deklaracji "brak zewnętrznych zasobów": build ma się wywalić, jeśli w HTML pojawi się
// skrypt, styl, obraz albo ramka ładowana z sieci.
const zewnetrzne = html.match(
  /<(?:script|link|img|iframe|source|audio|video)\b[^>]*\b(?:src|href)=["']?(?:https?:)?\/\//gi
);
if (zewnetrzne) throw new Error(`Zewnętrzne zasoby w buildzie: ${zewnetrzne.join(', ')}`);

const hashes = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(
  (m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`
);
if (!hashes.length) throw new Error('Nie znaleziono inline skryptu w dist/index.html');

const csp = [
  "default-src 'none'",
  `script-src ${hashes.join(' ')}`,
  "style-src 'unsafe-inline'",
  'font-src data:',
  "img-src 'self' data: blob:",
  'worker-src blob: data:',
  'connect-src data: blob:',
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ');

if (!html.includes('__CSP__')) throw new Error('Brak znacznika __CSP__ w index.html');
html = html.replace('__CSP__', csp);
writeFileSync('dist/index.html', html);

const crlf = (s) => s.replace(/\r?\n/g, '\r\n');
const bat = crlf(`@echo off
if not exist "%~dp0${HTML_NAME}" (
  echo Najpierw wypakuj caly folder z ZIP-a ^(Wyodrebnij wszystko^), potem uruchom ten plik.
  pause
  exit /b 1
)
start "" "%~dp0${HTML_NAME}"
`);
const readme = crlf(`${app.name} - wersja offline (Windows)

1. Wypakuj caly folder z ZIP-a (prawy przycisk > Wyodrebnij wszystko).
2. Kliknij dwukrotnie Uruchom.bat albo bezposrednio ${HTML_NAME}.
   Aplikacja otworzy sie w domyslnej przegladarce (Edge, Chrome, Firefox).

Nie wymaga instalacji, uprawnien administratora ani internetu.
Pliki nie sa nigdzie wysylane - cala praca odbywa sie w przegladarce.
`);

const zip = zipSync({
  [HTML_NAME]: strToU8(html),
  'Uruchom.bat': strToU8(bat),
  'CZYTAJ-MNIE.txt': strToU8(readme)
});
writeFileSync(`dist/${ZIP_NAME}`, zip);
console.log(
  `dist/index.html (${(html.length / 1048576).toFixed(2)} MB), dist/${ZIP_NAME} (${(zip.length / 1048576).toFixed(2)} MB)`
);
