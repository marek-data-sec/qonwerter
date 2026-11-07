// @vitest-environment node
/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Te testy pilnują deklaracji "pliki nie są nigdzie wysyłane, w localStorage tylko ustawienia".
// Jeśli któryś zaczyna się wywalać, trzeba najpierw zmienić tę deklarację (UI, README, SECURITY.md),
// a dopiero potem test.

const SRC = fileURLToPath(new URL('..', import.meta.url));

function zrodla(dir: string): string[] {
  return readdirSync(dir).flatMap((nazwa) => {
    const sciezka = join(dir, nazwa);
    if (statSync(sciezka).isDirectory()) return nazwa === 'test' ? [] : zrodla(sciezka);
    return /\.(ts|tsx)$/.test(nazwa) ? [sciezka] : [];
  });
}

const pliki = zrodla(SRC).map((p) => ({ nazwa: p.slice(SRC.length), tresc: readFileSync(p, 'utf8') }));

describe('deklaracja prywatności', () => {
  it('kod aplikacji nie wykonuje żadnych zapytań sieciowych', () => {
    const siec =
      /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|importScripts|window\.open|location\.(assign|replace)/;
    expect(pliki.filter((p) => siec.test(p.tresc)).map((p) => p.nazwa)).toEqual([]);
  });

  it('nie używa ciasteczek, IndexedDB, sessionStorage, Cache API ani service workerów', () => {
    const magazyny = /document\.cookie|indexedDB|sessionStorage|\bcaches\.|serviceWorker/;
    expect(pliki.filter((p) => magazyny.test(p.tresc)).map((p) => p.nazwa)).toEqual([]);
  });

  it('localStorage jest dotykany tylko w usePersistentState i storage', () => {
    // szukamy użycia API, a nie samego słowa (które pojawia się w komentarzach i tekstach interfejsu)
    const api = /window\.localStorage|\blocalStorage\s*\.\s*(getItem|setItem|removeItem|clear|key|length)/;
    const uzywajace = pliki.filter((p) => api.test(p.tresc)).map((p) => p.nazwa.replace(/\\/g, '/'));
    expect(uzywajace.sort()).toEqual(['utils/storage.ts', 'utils/usePersistentState.ts']);
  });

  it('usePersistentState nie dostaje obiektów File ani Blob (tylko proste ustawienia)', () => {
    const wywolania = pliki.flatMap((p) => p.tresc.match(/usePersistentState<[^>]+>/g) ?? []);
    expect(wywolania.length).toBeGreaterThan(0);
    expect(wywolania.filter((w) => /File|Blob|ArrayBuffer/.test(w))).toEqual([]);
  });
});
