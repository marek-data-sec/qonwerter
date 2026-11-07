import { describe, expect, it } from 'vitest';
import { pageGeometry } from '../utils/pdfLayout';

const A4 = { pw: 595.28, ph: 841.89 };
const MM = 72 / 25.4;

describe('pageGeometry', () => {
  it('wysoki obraz na A4 z marginesem 10 mm mieści się w pionie i jest wyśrodkowany', () => {
    const g = pageGeometry(600, 900, { pageSize: 'a4', orientation: 'auto', margin: 10 });
    expect(g.pw).toBeCloseTo(A4.pw, 1);
    expect(g.ph).toBeCloseTo(A4.ph, 1);
    expect(g.h).toBeCloseTo(A4.ph - 20 * MM, 1);
    expect(g.w / g.h).toBeCloseTo(600 / 900, 5);
    expect(g.x).toBeCloseTo((g.pw - g.w) / 2, 5);
    expect(g.y).toBeCloseTo(10 * MM, 1);
  });

  it('szeroki obraz przy orientacji automatycznej obraca stronę do poziomu', () => {
    const g = pageGeometry(900, 400, { pageSize: 'a4', orientation: 'auto', margin: 0 });
    expect(g.pw).toBeCloseTo(A4.ph, 1);
    expect(g.ph).toBeCloseTo(A4.pw, 1);
  });

  it('wymuszona orientacja pionowa zostaje pionowa także dla szerokiego obrazu', () => {
    const g = pageGeometry(900, 400, { pageSize: 'a4', orientation: 'portrait', margin: 0 });
    expect(g.pw).toBeLessThan(g.ph);
  });

  it('strona dopasowana do obrazu ma jego proporcje plus margines (96 dpi)', () => {
    const g = pageGeometry(800, 600, { pageSize: 'fit', orientation: 'auto', margin: 10 });
    expect(g.pw).toBeCloseTo(800 * 0.75 + 20 * MM, 5);
    expect(g.ph).toBeCloseTo(600 * 0.75 + 20 * MM, 5);
    expect(g.w).toBeCloseTo(600, 5);
  });

  it('bez marginesu obraz o proporcjach strony wypełnia ją w całości', () => {
    const g = pageGeometry(595.28, 841.89, { pageSize: 'a4', orientation: 'auto', margin: 0 });
    expect(g.w).toBeCloseTo(g.pw, 3);
    expect(g.h).toBeCloseTo(g.ph, 3);
    expect(g.x).toBeCloseTo(0, 3);
  });

  it('nie przekracza limitu rozmiaru strony PDF', () => {
    const g = pageGeometry(40000, 30000, { pageSize: 'fit', orientation: 'auto', margin: 0 });
    expect(g.pw).toBeLessThanOrEqual(14400);
    expect(g.ph).toBeLessThanOrEqual(14400);
  });
});
