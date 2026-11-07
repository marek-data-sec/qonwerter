import { describe, expect, it } from 'vitest';
import qrcode from 'qrcode-generator';
import {
  BYTE_LIMIT,
  buildMatrix,
  colorWarning,
  contrastRatio,
  layout,
  toSvg,
  type QrLogo,
  type QrStyle
} from '../utils/qr';

const styl = (extra: Partial<QrStyle> = {}): QrStyle => ({
  fg: '#000000',
  bg: '#ffffff',
  margin: 4,
  sizePx: 1024,
  logo: null,
  logoPct: 22,
  logoPad: true,
  ...extra
});

const logo: QrLogo = {
  source: {} as CanvasImageSource,
  width: 200,
  height: 100,
  dataUrl: 'data:image/png;base64,AAAA'
};

describe('buildMatrix', () => {
  it('koduje polskie litery jako UTF-8, a nie obcina ich do jednego bajta', () => {
    expect(qrcode.stringToBytes('ł')).toEqual([197, 130]);
    expect(qrcode.stringToBytes('ą')).toEqual([196, 133]);
  });

  it('krótki tekst daje najmniejszy kod (wersja 1, 21 modułów)', () => {
    expect(buildMatrix('A', 'M').size).toBe(21);
  });

  it('wysoka korekcja błędów nie daje mniejszego kodu niż średnia', () => {
    const tekst = 'https://example.com/jakas/dluzsza/sciezka?x=1';
    expect(buildMatrix(tekst, 'H').size).toBeGreaterThanOrEqual(buildMatrix(tekst, 'M').size);
  });

  it('akceptuje tekst na granicy limitu i odrzuca ponad limit z czytelnym komunikatem', () => {
    expect(() => buildMatrix('x'.repeat(BYTE_LIMIT.H), 'H')).not.toThrow();
    expect(() => buildMatrix('x'.repeat(BYTE_LIMIT.H + 1), 'H')).toThrow(/za długi/);
    expect(() => buildMatrix('x'.repeat(BYTE_LIMIT.M + 1), 'M')).toThrow(/za długi/);
  });
});

describe('kolory', () => {
  it('liczy kontrast czarnego i białego jako 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('ostrzega przed odwróconymi kolorami i słabym kontrastem, a czarny na białym jest w porządku', () => {
    expect(colorWarning('#ffffff', '#000000')).toMatch(/Jasny kod/);
    expect(colorWarning('#cccccc', '#ffffff')).toMatch(/Kontrast/);
    expect(colorWarning('#000000', '#ffffff')).toBeNull();
  });
});

describe('layout', () => {
  it('dobiera całkowitą liczbę pikseli na moduł', () => {
    expect(layout(21, 4, 1024)).toEqual({ total: 29, cell: 35, px: 1015 });
  });
});

describe('toSvg', () => {
  it('rysuje dokładnie te moduły, które są ciemne w macierzy', () => {
    const m = buildMatrix('Zażółć gęślą jaźń', 'M');
    let ciemne = 0;
    for (let r = 0; r < m.size; r++) for (let c = 0; c < m.size; c++) if (m.dark(r, c)) ciemne++;
    const svg = toSvg(m, styl());
    const d = /<path[^>]* d="([^"]+)"/.exec(svg)?.[1] ?? '';
    const suma = [...d.matchAll(/h(\d+)v1/g)].reduce((s, x) => s + Number(x[1]), 0);
    expect(suma).toBe(ciemne);
    expect(svg).toContain(`viewBox="0 0 ${m.size + 8} ${m.size + 8}"`);
  });

  it('osadza logo tylko wtedy, gdy zostało dodane', () => {
    const m = buildMatrix('abc', 'H');
    expect(toSvg(m, styl())).not.toContain('<image');
    const z = toSvg(m, styl({ logo }));
    expect(z).toContain('<image');
    expect(z).toContain('data:image/png;base64,AAAA');
  });

  it('odrzuca nieprawidłowy kolor, żeby nie wstrzyknąć niczego do SVG', () => {
    expect(() => toSvg(buildMatrix('a', 'M'), styl({ fg: 'red" onload="x' }))).toThrow(/kolor/i);
  });
});
