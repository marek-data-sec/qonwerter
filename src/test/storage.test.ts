import { beforeEach, describe, expect, it } from 'vitest';
import { clearAppStorage } from '../utils/storage';

describe('clearAppStorage', () => {
  beforeEach(() => window.localStorage.clear());

  it('usuwa tylko klucze tej aplikacji', () => {
    window.localStorage.setItem('plik.obrazy', '{}');
    window.localStorage.setItem('plik.pdfObrazy', '{}');
    window.localStorage.setItem('cudze', 'zostaje');
    clearAppStorage();
    expect(window.localStorage.getItem('plik.obrazy')).toBeNull();
    expect(window.localStorage.getItem('plik.pdfObrazy')).toBeNull();
    expect(window.localStorage.getItem('cudze')).toBe('zostaje');
  });
});
