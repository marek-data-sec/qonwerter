import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type DragEvent,
  type ReactNode
} from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Download, FileText, Loader2, Upload, X } from 'lucide-react';
import { formatBytes } from '../utils/format';
import { saveBlob, zipBlobs } from '../utils/download';
import { sklejKrotkie } from '../utils/typografia';
import { isInAppBrowser } from '../utils/env';

export const inputCls =
  'w-full rounded-md border border-brand-200 bg-white px-2.5 py-1.5 text-sm text-brand-900 focus-ring';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-brand-200 rounded-lg shadow-card ${className}`}>{children}</div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-brand-400 font-medium mb-1">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-brand-500 leading-snug mt-1">{sklejKrotkie(hint)}</span>
      )}
    </label>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  busy?: boolean;
};

export function Button({ variant = 'primary', busy, className = '', children, disabled, ...rest }: BtnProps) {
  const style =
    variant === 'primary'
      ? 'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-300'
      : 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 disabled:text-brand-300';
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus-ring disabled:cursor-not-allowed ${style} ${className}`}
    >
      {busy && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error'; children: ReactNode }) {
  const style =
    kind === 'error'
      ? 'bg-alert-50 border-alert-400/40 text-alert-700'
      : 'bg-warn-50 border-warn-400/40 text-brand-900';
  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-[13px] leading-snug ${style}`}>
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

function accepts(file: File, accept: string): boolean {
  return accept.split(',').some((raw) => {
    const t = raw.trim().toLowerCase();
    if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t);
    if (t.endsWith('/*')) return file.type.startsWith(t.slice(0, -1));
    return file.type === t;
  });
}

export function DropZone({
  accept,
  multiple = true,
  onFiles,
  hint
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  hint: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => accepts(f, accept));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          ref.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors focus-ring ${
        over ? 'border-brand-500 bg-brand-100' : 'border-brand-300 bg-white hover:bg-brand-50'
      }`}
    >
      <Upload size={22} className="mx-auto text-brand-500" />
      <p className="mt-2 text-sm font-medium text-brand-800">Upuść pliki tutaj albo kliknij, żeby wybrać</p>
      <p className="mt-0.5 text-xs text-brand-500">{hint}</p>
      <input
        ref={ref}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          take(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function Thumb({ blob, className = 'w-10 h-10' }: { blob: Blob; className?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url ? (
    <img src={url} alt="" className={`${className} shrink-0 rounded bg-brand-100 object-cover`} />
  ) : (
    <div className={`${className} shrink-0 rounded bg-brand-100`} />
  );
}

export function FileList({
  files,
  thumbs,
  reorder,
  onMove,
  onRemove,
  onClear
}: {
  files: File[];
  thumbs?: boolean;
  reorder?: boolean;
  onMove?: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}) {
  if (!files.length) return null;
  const total = files.reduce((s, f) => s + f.size, 0);
  const iconBtn =
    'p-1.5 [@media(pointer:coarse)]:p-2.5 rounded text-brand-500 hover:bg-brand-100 hover:text-brand-800 disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <Card>
      <div className="flex items-center justify-between px-3 py-2 border-b border-brand-100">
        <p className="text-xs text-brand-600">
          <strong className="font-semibold text-brand-800">{files.length}</strong> plik. ·{' '}
          {formatBytes(total)}
        </p>
        <button
          onClick={onClear}
          className="text-xs text-brand-500 underline decoration-dotted hover:text-brand-800"
        >
          wyczyść listę
        </button>
      </div>
      <ul className="divide-y divide-brand-100 max-h-80 overflow-y-auto">
        {files.map((f, i) => (
          <li
            key={`${f.name}-${f.size}-${f.lastModified}-${i}`}
            className="flex items-center gap-2.5 px-3 py-2"
          >
            {thumbs ? <Thumb blob={f} /> : <FileText size={20} className="shrink-0 text-brand-400" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-brand-800">{f.name}</p>
              <p className="text-[11px] text-brand-500">{formatBytes(f.size)}</p>
            </div>
            {reorder && onMove && (
              <>
                <button
                  aria-label="Przesuń w górę"
                  disabled={i === 0}
                  onClick={() => onMove(i, i - 1)}
                  className={iconBtn}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  aria-label="Przesuń w dół"
                  disabled={i === files.length - 1}
                  onClick={() => onMove(i, i + 1)}
                  className={iconBtn}
                >
                  <ArrowDown size={15} />
                </button>
              </>
            )}
            <button aria-label={`Usuń ${f.name}`} onClick={() => onRemove(i)} className={iconBtn}>
              <X size={15} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export interface ResultItem {
  id: string;
  name: string;
  blob: Blob;
  note?: string;
  before?: number;
}

export function ResultList({
  items,
  zipName,
  preview
}: {
  items: ResultItem[];
  zipName: string;
  preview?: boolean;
}) {
  const [zipping, setZipping] = useState(false);
  if (!items.length) return null;
  const downloadZip = async () => {
    setZipping(true);
    try {
      saveBlob(await zipBlobs(items), zipName);
    } finally {
      setZipping(false);
    }
  };
  return (
    <Card>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-brand-100">
        <p className="text-sm font-medium text-brand-800">Gotowe: {items.length}</p>
        {items.length > 1 && (
          <Button variant="secondary" onClick={downloadZip} busy={zipping} className="!py-1 text-xs">
            <Download size={14} /> Pobierz wszystko (ZIP)
          </Button>
        )}
      </div>
      <InAppBrowserNotice compact className="border-b border-brand-100 p-3" />
      <ul className="divide-y divide-brand-100 max-h-[32rem] overflow-y-auto">
        {items.map((r) => (
          <li key={r.id} className="flex items-center gap-2.5 px-3 py-2">
            {preview ? (
              <Thumb blob={r.blob} className="w-12 h-12" />
            ) : (
              <FileText size={20} className="shrink-0 text-brand-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-brand-800">{r.name}</p>
              <p className="text-[11px] text-brand-500">
                {r.before !== undefined && <>{formatBytes(r.before)} → </>}
                {formatBytes(r.blob.size)}
                {r.note && <> · {r.note}</>}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => saveBlob(r.blob, r.name)}
              className="!px-3.5 !py-3"
              aria-label={`Pobierz ${r.name}`}
            >
              <Download size={15} />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ToolLayout({
  title,
  lead,
  input,
  settings,
  output
}: {
  title: string;
  lead: string;
  input: ReactNode;
  settings: ReactNode;
  output: ReactNode;
}) {
  return (
    <section>
      <a
        href="#menu"
        className="mb-2 inline-block text-xs text-brand-500 underline decoration-dotted hover:text-brand-800 focus-ring"
      >
        ← Menu główne
      </a>
      <h1 className="font-serif text-xl font-semibold text-brand-900">{title}</h1>
      <p className="mt-1 mb-5 max-w-2xl text-sm text-brand-500 text-left sm:text-justify">
        {sklejKrotkie(lead)}
      </p>
      {/* minmax(0,1fr) także na telefonie: bez tego kolumna rozciąga się do najdłuższej nazwy pliku i rozpycha całą stronę */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">{input}</div>
        <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-20">
          {settings}
        </div>
        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-2">{output}</div>
      </div>
    </section>
  );
}

export function useFileList() {
  const [files, setFiles] = useState<File[]>([]);
  return {
    files,
    add: (more: File[]) => setFiles((cur) => [...cur, ...more]),
    replace: (more: File[]) => setFiles(more),
    remove: (i: number) => setFiles((cur) => cur.filter((_, k) => k !== i)),
    clear: () => setFiles([]),
    move: (from: number, to: number) =>
      setFiles((cur) => {
        const next = [...cur];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      })
  };
}

// W przeglądarce wbudowanej w aplikację (Messenger, Facebook...) pobieranie plików zwykle nie działa. Zamiast
// zostawić człowieka z przyciskiem, który nic nie robi, mówimy, co zrobić.
export function InAppBrowserNotice({
  compact = false,
  className = ''
}: {
  compact?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState<'tak' | 'nie' | null>(null);
  if (!isInAppBrowser()) return null;
  const address = location.href.split('#')[0];

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied('tak');
    } catch {
      setCopied('nie');
    }
  }

  return (
    <div className={className}>
      <Notice>
        <p className="font-medium">Pobieranie plików może tu nie działać</p>
        <p className="mt-1">
          {sklejKrotkie(
            compact
              ? 'Strona jest otwarta w przeglądarce wbudowanej w aplikację, która zwykle blokuje pobieranie. Otwórz ją w Chrome albo innej zwykłej przeglądarce.'
              : 'Strona jest otwarta w przeglądarce wbudowanej w aplikację (np. Messenger, Facebook, Instagram), a takie przeglądarki zwykle blokują pobieranie plików. Otwórz ją w Chrome albo innej zwykłej przeglądarce: w menu (⋯) poszukaj opcji „Otwórz w przeglądarce” lub „Otwórz w Chrome”.'
          )}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => void copyAddress()} className="!py-1.5 text-xs">
            {copied === 'tak' ? 'Skopiowano' : 'Skopiuj adres strony'}
          </Button>
          {copied === 'nie' && <span className="select-all break-all text-xs">{address}</span>}
        </div>
      </Notice>
    </div>
  );
}
