import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline';
import { canvasToBlob, type OutFormat } from './image';

const MAX_PIXELS = 60_000_000;
let workerReady = false;

// Worker jest wbudowany w plik HTML (blob), więc działa też bez serwera, z file://
export async function openPdf(data: ArrayBuffer, password?: string): Promise<PDFDocumentProxy> {
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
    workerReady = true;
  }
  // pdf.js przekazuje bufor do workera (traci go), więc oddajemy kopię
  return pdfjs.getDocument({ data: new Uint8Array(data.slice(0)), password, isEvalSupported: false }).promise;
}

export function isPasswordError(e: unknown): boolean {
  return (e as { name?: string } | null)?.name === 'PasswordException';
}

export async function renderPdfPage(
  doc: PDFDocumentProxy,
  pageNo: number,
  scale: number,
  format: OutFormat,
  quality: number
) {
  const page = await doc.getPage(pageNo);
  try {
    let viewport = page.getViewport({ scale });
    if (viewport.width * viewport.height > MAX_PIXELS) {
      viewport = page.getViewport({
        scale: scale * Math.sqrt(MAX_PIXELS / (viewport.width * viewport.height))
      });
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Brak dostępu do canvas.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await canvasToBlob(canvas, format, quality);
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    page.cleanup();
  }
}
