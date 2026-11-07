export type PageSize = 'fit' | 'a4' | 'letter';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface PageSettings {
  pageSize: PageSize;
  orientation: Orientation;
  margin: number; // w milimetrach
}

// Wymiary w punktach PDF (1 pt = 1/72 cala), pion
const PAGES = { a4: [595.28, 841.89], letter: [612, 792] } as const;
const MM = 72 / 25.4;
const MAX_PAGE = 14400; // limit rozmiaru strony w specyfikacji PDF

export interface PageGeometry {
  pw: number; // szerokość i wysokość strony
  ph: number;
  x: number; // położenie obrazu, liczone od lewego dolnego rogu (tak jak w PDF)
  y: number;
  w: number;
  h: number;
}

// Układ jednej strony. Z tej funkcji korzystają i gotowy PDF, i podgląd na kafelkach,
// więc podgląd zawsze pokazuje dokładnie to, co trafi do pliku.
export function pageGeometry(imgW: number, imgH: number, s: PageSettings): PageGeometry {
  const margin = s.margin * MM;
  let pw: number;
  let ph: number;
  if (s.pageSize === 'fit') {
    // 96 dpi: piksel ekranowy = 0,75 pt
    pw = Math.min(MAX_PAGE, imgW * 0.75 + 2 * margin);
    ph = Math.min(MAX_PAGE, imgH * 0.75 + 2 * margin);
  } else {
    [pw, ph] = PAGES[s.pageSize];
    const landscape = s.orientation === 'landscape' || (s.orientation === 'auto' && imgW > imgH);
    if (landscape !== pw > ph) [pw, ph] = [ph, pw];
  }
  const k = Math.min((pw - 2 * margin) / imgW, (ph - 2 * margin) / imgH);
  const w = imgW * k;
  const h = imgH * k;
  return { pw, ph, x: (pw - w) / 2, y: (ph - h) / 2, w, h };
}
