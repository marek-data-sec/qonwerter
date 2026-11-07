import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';
import config from '../../app.config.json';
import { APP_VERSION, CHANGELOG } from '../utils/appMeta';

// przy podbijaniu wersji łatwo zapomnieć o jednym z trzech miejsc (patrz README, "Wersja i changelog")
describe('wersja aplikacji', () => {
  it('APP_VERSION w appMeta.ts zgadza się z wersją w package.json', () => {
    expect(APP_VERSION).toBe(pkg.version);
  });

  it('najnowszy wpis changeloga dotyczy bieżącej wersji', () => {
    expect(CHANGELOG[0].version).toBe(APP_VERSION);
  });

  it('nazwa paczki zgadza się z identyfikatorem w app.config.json', () => {
    expect(pkg.name).toBe(config.slug);
  });
});
