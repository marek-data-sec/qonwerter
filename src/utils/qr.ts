import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';
import { loadImage } from './image';

// Biblioteka domyślnie obcina każdy znak do jednego bajta, więc polskie litery (ą, ł, ż) wychodziłyby
// błędnie. Kodujemy tekst jako UTF-8, tak jak oczekują czytniki w telefonach.
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s));

// Bez logo wystarcza średnia korekcja błędów (M), z logo potrzebna jest najwyższa (H), bo logo zasłania
// część modułów, a H potrafi odtworzyć do ok. 30% kodu.
export type Ecl = 'M' | 'H';

// Maksymalna liczba bajtów tekstu w największym kodzie (wersja 40). Polskie litery zajmują 2 bajty.
export const BYTE_LIMIT: Record<Ecl, number> = { M: 2331, H: 1273 };

export interface QrMatrix {
  size: number;
  dark: (row: number, col: number) => boolean;
}

export interface QrLogo {
  source: CanvasImageSource;
  width: number;
  height: number;
  dataUrl: string; // do osadzenia w SVG
}

export interface QrStyle {
  fg: string;
  bg: string;
  margin: number; // w modułach
  sizePx: number;
  logo?: QrLogo | null;
  logoPct: number; // bok logo jako % boku kodu
  logoPad: boolean; // podkładka w kolorze tła pod logo
}

export function buildMatrix(text: string, ecl: Ecl): QrMatrix {
  const qr = qrcode(0, ecl);
  qr.addData(text, 'Byte');
  try {
    qr.make();
  } catch {
    throw new Error(
      `Tekst jest za długi na kod QR (limit to około ${BYTE_LIMIT[ecl]} bajtów, a polskie litery liczą się podwójnie).`
    );
  }
  return { size: qr.getModuleCount(), dark: (r, c) => qr.isDark(r, c) };
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function colorWarning(fg: string, bg: string): string | null {
  if (luminance(fg) > luminance(bg))
    return 'Jasny kod na ciemnym tle odczytuje tylko część aplikacji. Lepiej użyć ciemnego kodu na jasnym tle.';
  if (contrastRatio(fg, bg) < 3)
    return 'Kontrast między kodem a tłem jest za mały, kod może się nie odczytać.';
  return null;
}

export function layout(modules: number, margin: number, sizePx: number) {
  const total = modules + 2 * margin;
  // całkowita liczba pikseli na moduł, żeby krawędzie były ostre
  const cell = Math.max(1, Math.floor(sizePx / total));
  return { total, cell, px: cell * total };
}

function logoBox(side: number, logo: Pick<QrLogo, 'width' | 'height'>, pct: number, round: boolean) {
  const box = (side * pct) / 100;
  const k = Math.min(box / logo.width, box / logo.height);
  const w = logo.width * k;
  const h = logo.height * k;
  const r = (v: number) => (round ? Math.round(v) : v);
  return { x: r((side - w) / 2), y: r((side - h) / 2), w: r(w), h: r(h) };
}

export function drawQr(canvas: HTMLCanvasElement, m: QrMatrix, st: QrStyle): void {
  const { cell, px } = layout(m.size, st.margin, st.sizePx);
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Brak dostępu do canvas.');
  ctx.fillStyle = st.bg;
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = st.fg;
  for (let r = 0; r < m.size; r++)
    for (let c = 0; c < m.size; c++)
      if (m.dark(r, c)) ctx.fillRect((c + st.margin) * cell, (r + st.margin) * cell, cell, cell);
  if (st.logo) {
    const b = logoBox(px, st.logo, st.logoPct, true);
    if (st.logoPad) {
      const pad = Math.max(2, Math.round(Math.min(b.w, b.h) * 0.1));
      ctx.fillStyle = st.bg;
      ctx.fillRect(b.x - pad, b.y - pad, b.w + 2 * pad, b.h + 2 * pad);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(st.logo.source, b.x, b.y, b.w, b.h);
  }
}

// SVG wektorowy (do druku): kod jako jedna ścieżka, logo osadzone jako obraz PNG
export function toSvg(m: QrMatrix, st: QrStyle): string {
  for (const c of [st.fg, st.bg]) if (!/^#[0-9a-f]{6}$/i.test(c)) throw new Error('Nieprawidłowy kolor.');
  const total = m.size + 2 * st.margin;
  let d = '';
  for (let r = 0; r < m.size; r++) {
    let c = 0;
    while (c < m.size) {
      if (!m.dark(r, c)) {
        c++;
        continue;
      }
      let e = c;
      while (e < m.size && m.dark(r, e)) e++;
      d += `M${c + st.margin} ${r + st.margin}h${e - c}v1h-${e - c}z`;
      c = e;
    }
  }
  let logo = '';
  if (st.logo) {
    const b = logoBox(total, st.logo, st.logoPct, false);
    if (st.logoPad) {
      const pad = Math.min(b.w, b.h) * 0.1;
      logo += `<rect x="${b.x - pad}" y="${b.y - pad}" width="${b.w + 2 * pad}" height="${b.h + 2 * pad}" fill="${st.bg}"/>`;
    }
    logo += `<image xlink:href="${st.logo.dataUrl}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${total} ${total}" ` +
    `width="${st.sizePx}" height="${st.sizePx}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="${st.bg}"/><path fill="${st.fg}" d="${d}"/>${logo}</svg>`
  );
}

// Logo trafia do kodu jako canvas, więc nie zależy od cyklu życia pliku ani formatu źródłowego (SVG, WebP...)
export async function prepareLogo(file: Blob): Promise<QrLogo> {
  const img = await loadImage(file);
  try {
    const k = Math.min(1, 768 / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * k));
    const h = Math.max(1, Math.round(img.height * k));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Brak dostępu do canvas.');
    ctx.drawImage(img.source, 0, 0, w, h);
    return { source: canvas, width: w, height: h, dataUrl: canvas.toDataURL('image/png') };
  } finally {
    img.close();
  }
}

// Test odczytu w aplikacji: próbuje odczytać narysowany kod tak, jak zrobiłby to czytnik.
// Do rozmiaru ~900 px, bo wydajność ma znaczenie, a telefon i tak nie widzi kodu w pełnej rozdzielczości.
export function readsBack(canvas: HTMLCanvasElement, expected: string): boolean {
  const max = 900;
  let src = canvas;
  if (canvas.width > max) {
    src = document.createElement('canvas');
    src.width = src.height = max;
    const c = src.getContext('2d');
    if (!c) return false;
    c.imageSmoothingQuality = 'high';
    c.drawImage(canvas, 0, 0, max, max);
  }
  const ctx = src.getContext('2d');
  if (!ctx) return false;
  const data = ctx.getImageData(0, 0, src.width, src.height);
  const res = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' });
  return res !== null && res.data === expected;
}
