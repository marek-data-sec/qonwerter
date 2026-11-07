export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Dwa pliki o tej samej nazwie (np. z różnych folderów) nie mogą się nadpisać w ZIP-ie
export function uniqueName(name: string, used: Set<string>): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let candidate = name;
  let i = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${stem} (${i++})${ext}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

// "1-3, 5, 8-" -> [1,2,3,5,8,...,total]. Pusty tekst = wszystkie strony.
export function parsePageRange(input: string, total: number): number[] {
  const text = input.trim();
  if (!text) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: number[] = [];
  const seen = new Set<number>();
  for (const raw of text.split(',')) {
    const part = raw.trim();
    if (!part) continue;
    const m = /^(\d*)\s*-\s*(\d*)$/.exec(part);
    let from: number;
    let to: number;
    if (m && (m[1] || m[2])) {
      from = m[1] ? Number(m[1]) : 1;
      to = m[2] ? Number(m[2]) : total;
    } else if (/^\d+$/.test(part)) {
      from = to = Number(part);
    } else {
      throw new Error(`Nieprawidłowy zakres: „${part}”.`);
    }
    if (from < 1 || to > total)
      throw new Error(`Strona poza zakresem (dokument ma ${total} str.): „${part}”.`);
    if (from > to) throw new Error(`Odwrócony zakres: „${part}”.`);
    for (let n = from; n <= to; n++) {
      if (!seen.has(n)) {
        seen.add(n);
        pages.push(n);
      }
    }
  }
  if (!pages.length) throw new Error('Nie wybrano żadnych stron.');
  return pages;
}

export const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// IMG_2 przed IMG_10, bez rozróżniania wielkości liter
export const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, 'pl', { numeric: true, sensitivity: 'base' });
