import { describe, expect, it } from 'vitest';
import { baseName, formatBytes, naturalCompare, parsePageRange, uniqueName } from '../utils/format';

describe('parsePageRange', () => {
  it('pusty tekst oznacza wszystkie strony', () => {
    expect(parsePageRange('', 3)).toEqual([1, 2, 3]);
  });
  it('łączy pojedyncze strony i zakresy bez duplikatów', () => {
    expect(parsePageRange('1-3, 2, 5', 6)).toEqual([1, 2, 3, 5]);
  });
  it('obsługuje zakresy otwarte', () => {
    expect(parsePageRange('-2, 5-', 6)).toEqual([1, 2, 5, 6]);
  });
  it('zachowuje kolejność podaną przez użytkownika', () => {
    expect(parsePageRange('4, 1', 5)).toEqual([4, 1]);
  });
  it('odrzuca błędne dane', () => {
    expect(() => parsePageRange('abc', 5)).toThrow();
    expect(() => parsePageRange('0', 5)).toThrow();
    expect(() => parsePageRange('6', 5)).toThrow();
    expect(() => parsePageRange('4-2', 5)).toThrow();
    expect(() => parsePageRange('-', 5)).toThrow();
  });
});

describe('uniqueName', () => {
  it('dopisuje numer przy powtórzeniu', () => {
    const used = new Set<string>();
    expect(uniqueName('a.png', used)).toBe('a.png');
    expect(uniqueName('A.png', used)).toBe('A (2).png');
    expect(uniqueName('a.png', used)).toBe('a (3).png');
  });
});

describe('format', () => {
  it('formatuje rozmiary', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
  it('obcina rozszerzenie', () => {
    expect(baseName('zdjecie.final.jpg')).toBe('zdjecie.final');
    expect(baseName('bez-rozszerzenia')).toBe('bez-rozszerzenia');
  });
});

describe('naturalCompare', () => {
  it('sortuje numery liczbowo i bez rozróżniania wielkości liter', () => {
    const nazwy = ['IMG_10.jpg', 'img_2.jpg', 'IMG_1.jpg'];
    expect([...nazwy].sort(naturalCompare)).toEqual(['IMG_1.jpg', 'img_2.jpg', 'IMG_10.jpg']);
  });
});
