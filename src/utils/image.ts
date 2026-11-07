export type OutFormat = 'png' | 'jpeg' | 'webp';

export const MIME: Record<OutFormat, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
export const EXT: Record<OutFormat, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' };
export const FORMAT_LABEL: Record<OutFormat, string> = { png: 'PNG', jpeg: 'JPG', webp: 'WebP' };
export const FORMAT_HINT: Record<OutFormat, string> = {
  png: 'Bezstratny, zachowuje przezroczystość. Przy zdjęciach pliki są duże.',
  jpeg: 'Otworzy się w każdym programie. Stratny i bez przezroczystości.',
  webp: 'Pliki mniejsze niż JPG i PNG. Nowszy format, część starszych programów go nie otwiera.'
};

const MAX_PIXELS = 150_000_000;

export interface Loaded {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

// createImageBitmap uwzględnia orientację EXIF (zdjęcia z telefonu), a SVG idzie przez <img>
export async function loadImage(file: Blob): Promise<Loaded> {
  if (file.type !== 'image/svg+xml') {
    try {
      const bmp = await createImageBitmap(file);
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* próbujemy przez <img> */
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('Nie można odczytać obrazu (nieobsługiwany lub uszkodzony plik).');
  }
  return {
    source: img,
    width: img.naturalWidth || 1024,
    height: img.naturalHeight || 1024,
    close: () => URL.revokeObjectURL(url)
  };
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: OutFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Przeglądarka nie potrafi zapisać tego formatu.'));
        // przeglądarki bez obsługi formatu po cichu zwracają PNG
        if (blob.type !== MIME[format])
          return reject(new Error(`Ta przeglądarka nie obsługuje zapisu do ${FORMAT_LABEL[format]}.`));
        resolve(blob);
      },
      MIME[format],
      format === 'png' ? undefined : quality
    );
  });
}

function fitSize(w: number, h: number, maxSide: number) {
  if (!maxSide || Math.max(w, h) <= maxSide) return { w, h };
  const s = maxSide / Math.max(w, h);
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

export interface RenderOptions {
  format: OutFormat;
  quality: number; // 0..1
  maxSide: number; // 0 = bez zmian
  background: string;
  rotate?: number; // stopnie zgodnie z ruchem wskazówek zegara, wielokrotność 90
}

export function normalizeRotation(deg: number): number {
  return (((Math.round(deg / 90) * 90) % 360) + 360) % 360;
}

// Rysuje obraz obrócony o rot stopni tak, żeby wypełnił canvas o wymiarach outW x outH (już po obrocie)
function drawRotated(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  rot: number,
  outW: number,
  outH: number
) {
  const swap = rot === 90 || rot === 270;
  const dw = swap ? outH : outW;
  const dh = swap ? outW : outH;
  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

export async function renderImage(file: Blob, o: RenderOptions) {
  const img = await loadImage(file);
  try {
    const rot = normalizeRotation(o.rotate ?? 0);
    const swap = rot === 90 || rot === 270;
    const { w, h } = fitSize(swap ? img.height : img.width, swap ? img.width : img.height, o.maxSide);
    if (w * h > MAX_PIXELS) throw new Error('Obraz jest zbyt duży do przetworzenia w przeglądarce.');
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Brak dostępu do canvas.');
    // JPG nie ma przezroczystości, więc tło musi być wypełnione
    if (o.format === 'jpeg') {
      ctx.fillStyle = o.background;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingQuality = 'high';
    drawRotated(ctx, img.source, rot, w, h);
    const blob = await canvasToBlob(canvas, o.format, o.quality);
    return { blob, width: w, height: h };
  } finally {
    img.close();
  }
}

export interface Thumb {
  url: string;
  width: number; // wymiary oryginału po obrocie (miniatura jest mniejsza, ale w tych samych proporcjach)
  height: number;
}

// Miniatury powstają po jednej, żeby wgranie kilkudziesięciu zdjęć 12 Mpx nie zjadło pamięci naraz
let thumbQueue: Promise<unknown> = Promise.resolve();

export function makeThumb(file: Blob, rotation: number, maxSide = 360): Promise<Thumb> {
  const job = thumbQueue.then(async () => {
    const img = await loadImage(file);
    try {
      const rot = normalizeRotation(rotation);
      const swap = rot === 90 || rot === 270;
      const width = swap ? img.height : img.width;
      const height = swap ? img.width : img.height;
      const { w, h } = fitSize(width, height, maxSide);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Brak dostępu do canvas.');
      // zdjęcia jako JPG (małe), reszta jako PNG, żeby nie tracić przezroczystości
      const jpeg = file.type === 'image/jpeg';
      if (jpeg) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.imageSmoothingQuality = 'high';
      drawRotated(ctx, img.source, rot, w, h);
      const blob = await canvasToBlob(canvas, jpeg ? 'jpeg' : 'png', 0.8);
      return { url: URL.createObjectURL(blob), width, height };
    } finally {
      img.close();
    }
  });
  thumbQueue = job.catch(() => undefined);
  return job;
}
