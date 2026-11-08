// Wersja aplikacji i historia zmian widoczna w stopce (klik w numer wersji).
// APP_VERSION musi zgadzać się z package.json i z najnowszym wpisem CHANGELOG,
// pilnuje tego test appVersion.test.ts.

import config from '../../app.config.json';

export const APP_VERSION = '1.1.0';

// Nazwa aplikacji pochodzi z app.config.json (jedno miejsce do zmiany, patrz README)
export const APP_NAME: string = config.name;
export const APP_TAGLINE: string = config.tagline;
export const ZIP_NAME = `${config.slug}-offline.zip`;

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-11-08',
    changes: [
      'Menu główne z opisem narzędzi, klikalne logo i link powrotu do menu',
      'Podpowiedź w przeglądarkach wbudowanych w aplikacje (Messenger, Facebook), w których pobieranie plików nie działa',
      'Poprawiony układ na telefonie przy długich nazwach plików i większe przyciski dotykowe'
    ]
  },
  {
    version: '1.0.0',
    date: '2026-11-03',
    changes: [
      'Konwersja obrazów między PNG, JPG i WebP',
      'Obrazy do PDF z podglądem stron na kafelkach, przeciąganiem, obrotem i sortowaniem',
      'PDF do obrazów, scalanie i dzielenie PDF',
      'Kody QR z własnym logo (PNG i SVG) z testem odczytu',
      'Wersja offline na Windows jako ZIP z jednym plikiem HTML'
    ]
  }
];
