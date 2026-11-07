import { zipSync } from 'fflate';

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Pliki w środku są już skompresowane (PNG/JPG/PDF), więc ZIP bez kompresji jest szybszy i niewiele większy
export async function zipBlobs(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) entries[f.name] = new Uint8Array(await f.blob.arrayBuffer());
  return new Blob([zipSync(entries, { level: 0 }) as BlobPart], { type: 'application/zip' });
}
