import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowDown,
  ArrowDownAZ,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  GripVertical,
  LayoutGrid,
  List,
  RotateCcw,
  RotateCw,
  X
} from 'lucide-react';
import { Card } from './ui';
import { makeThumb, type Thumb } from '../utils/image';
import { pageGeometry, type PageSettings } from '../utils/pdfLayout';
import { formatBytes } from '../utils/format';

export interface PageItem {
  id: string;
  file: File;
  rotation: number;
}

export type BoardView = 'kafelki' | 'lista';

interface Props {
  items: PageItem[];
  settings: PageSettings;
  view: BoardView;
  onView: (view: BoardView) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onRotate: (index: number, delta: number) => void;
  onSortName: () => void;
  onReverse: () => void;
  onClear: () => void;
}

// Pole, w które wpisuje się podgląd strony na kafelku
const BOX_W = 128;
const BOX_H = 168;

function useThumb(file: File, rotation: number): Thumb | null {
  const [thumb, setThumb] = useState<Thumb | null>(null);
  useEffect(() => {
    let alive = true;
    let url: string | undefined;
    makeThumb(file, rotation).then(
      (t) => {
        if (!alive) return URL.revokeObjectURL(t.url);
        url = t.url;
        setThumb(t);
      },
      () => alive && setThumb(null)
    );
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, rotation]);
  return thumb;
}

// Mini-strona w proporcjach wybranego formatu z obrazem ułożonym tak samo jak w gotowym PDF
function PagePreview({ item, settings }: { item: PageItem; settings: PageSettings }) {
  const thumb = useThumb(item.file, item.rotation);
  const g = thumb ? pageGeometry(thumb.width, thumb.height, settings) : null;
  const k = g ? Math.min(BOX_W / g.pw, BOX_H / g.ph) : 0.7;
  const w = g ? g.pw * k : BOX_W * k;
  const h = g ? g.ph * k : BOX_H * k;
  return (
    <div className="flex items-center justify-center" style={{ width: BOX_W, height: BOX_H }}>
      <div
        className="relative overflow-hidden border border-brand-200 bg-white shadow-card"
        style={{ width: w, height: h }}
      >
        {thumb && g && (
          <img
            src={thumb.url}
            alt=""
            draggable={false}
            className="absolute"
            style={{
              left: `${(g.x / g.pw) * 100}%`,
              top: `${((g.ph - g.y - g.h) / g.ph) * 100}%`,
              width: `${(g.w / g.pw) * 100}%`,
              height: `${(g.h / g.ph) * 100}%`
            }}
          />
        )}
      </div>
    </div>
  );
}

function RowThumb({ item }: { item: PageItem }) {
  const thumb = useThumb(item.file, item.rotation);
  return thumb ? (
    <img
      src={thumb.url}
      alt=""
      draggable={false}
      className="h-10 w-10 shrink-0 rounded bg-brand-100 object-cover"
    />
  ) : (
    <div className="h-10 w-10 shrink-0 rounded bg-brand-100" />
  );
}

const iconBtn =
  'p-1.5 rounded text-brand-500 hover:bg-brand-100 hover:text-brand-800 disabled:opacity-30 disabled:hover:bg-transparent focus-ring';

function Actions({
  index,
  count,
  vertical,
  onMove,
  onRotate,
  onRemove
}: {
  index: number;
  count: number;
  vertical?: boolean;
  onMove: Props['onMove'];
  onRotate: Props['onRotate'];
  onRemove: Props['onRemove'];
}) {
  const n = index + 1;
  const Before = vertical ? ArrowUp : ArrowLeft;
  const After = vertical ? ArrowDown : ArrowRight;
  return (
    <>
      <button
        aria-label={`Przesuń stronę ${n} wcześniej`}
        title="Wcześniej"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        className={iconBtn}
      >
        <Before size={14} />
      </button>
      <button
        aria-label={`Przesuń stronę ${n} później`}
        title="Później"
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
        className={iconBtn}
      >
        <After size={14} />
      </button>
      <button
        aria-label={`Obróć stronę ${n} w lewo`}
        title="Obróć w lewo"
        onClick={() => onRotate(index, -90)}
        className={iconBtn}
      >
        <RotateCcw size={14} />
      </button>
      <button
        aria-label={`Obróć stronę ${n} w prawo`}
        title="Obróć w prawo"
        onClick={() => onRotate(index, 90)}
        className={iconBtn}
      >
        <RotateCw size={14} />
      </button>
      <button
        aria-label={`Usuń stronę ${n}`}
        title="Usuń"
        onClick={() => onRemove(index)}
        className={iconBtn}
      >
        <X size={14} />
      </button>
    </>
  );
}

export default function PageBoard({
  items,
  settings,
  view,
  onView,
  onMove,
  onRemove,
  onRotate,
  onSortName,
  onReverse,
  onClear
}: Props) {
  const boardRef = useRef<HTMLUListElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);

  // zamknięcie narzędzia w trakcie przeciągania nie może zostawić nasłuchiwaczy na oknie
  useEffect(() => () => cleanupRef.current?.(), []);

  // Przeciąganie na wskaźnikach (pointer events), więc działa tak samo myszą, palcem i rysikiem.
  // Kafelek jedzie za kursorem przez transform (bez przerenderowania Reacta przy każdym ruchu),
  // a zmiana kolejności następuje dopiero po upuszczeniu. Na ekranie dotykowym kafelek łapie się
  // tylko za uchwyt, żeby przeciąganie palcem po kafelkach dalej przewijało stronę.
  function beginDrag(e: ReactPointerEvent<HTMLLIElement>, index: number, id: string) {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest('[data-nodrag]')) return;
    if (e.pointerType !== 'mouse' && !t.closest('[data-grip]')) return;

    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const start = {
      x: e.clientX,
      docY: e.clientY + window.scrollY,
      cx: r.left + r.width / 2,
      docCy: r.top + window.scrollY + r.height / 2
    };
    let moved = false;
    let to = index;

    const finish = (commit: boolean) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
      cleanupRef.current = null;
      el.style.transform = '';
      setDragId(null);
      setTarget(null);
      if (commit && moved && to !== index) onMove(index, to);
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY + window.scrollY - start.docY;
      if (!moved) {
        if (Math.hypot(dx, dy) < 5) return;
        moved = true;
        setDragId(id);
        setTarget(index);
      }
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(2deg)`;
      // Miejsce docelowe to najbliższy środek: dawnego miejsca tego kafelka albo któregoś z pozostałych
      let best = index;
      let bestDist = (ev.clientX - start.cx) ** 2 + (ev.clientY - (start.docCy - window.scrollY)) ** 2;
      boardRef.current?.querySelectorAll<HTMLElement>('[data-tile]').forEach((tile) => {
        const i = Number(tile.dataset.index);
        if (i === index) return;
        const b = tile.getBoundingClientRect();
        const d = (ev.clientX - (b.left + b.width / 2)) ** 2 + (ev.clientY - (b.top + b.height / 2)) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      if (best !== to) {
        to = best;
        setTarget(best);
      }
      // przy długiej liście przesuwamy stronę, gdy kafelek zbliża się do krawędzi ekranu
      if (ev.clientY < 70) window.scrollBy(0, -14);
      else if (ev.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
    };
    const up = (ev: PointerEvent) => ev.pointerId === e.pointerId && finish(true);
    const cancel = (ev: PointerEvent) => ev.pointerId === e.pointerId && finish(false);
    const key = (ev: KeyboardEvent) => ev.key === 'Escape' && finish(false);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    cleanupRef.current = () => finish(false);
  }

  if (!items.length) return null;
  const total = items.reduce((s, i) => s + i.file.size, 0);
  const actions = { count: items.length, onMove, onRotate, onRemove };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 px-3 py-2">
        <p className="text-xs text-brand-600">
          <strong className="font-semibold text-brand-800">{items.length}</strong> str. · {formatBytes(total)}
        </p>
        <div className="flex items-center gap-1">
          <div
            role="group"
            aria-label="Widok"
            className="inline-flex rounded-md border border-brand-200 bg-white p-0.5"
          >
            {(['kafelki', 'lista'] as const).map((v) => (
              <button
                key={v}
                aria-pressed={view === v}
                onClick={() => onView(v)}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors focus-ring ${
                  view === v ? 'bg-brand-700 text-white' : 'text-brand-600 hover:bg-brand-50'
                }`}
              >
                {v === 'kafelki' ? <LayoutGrid size={13} /> : <List size={13} />}
                {v === 'kafelki' ? 'Kafelki' : 'Lista'}
              </button>
            ))}
          </div>
          <button
            aria-label="Sortuj według nazwy"
            title="Sortuj według nazwy"
            onClick={onSortName}
            className={iconBtn}
          >
            <ArrowDownAZ size={15} />
          </button>
          <button
            aria-label="Odwróć kolejność"
            title="Odwróć kolejność"
            onClick={onReverse}
            className={iconBtn}
          >
            <ArrowUpDown size={15} />
          </button>
          <button
            onClick={onClear}
            className="ml-1 text-xs text-brand-500 underline decoration-dotted hover:text-brand-800"
          >
            wyczyść listę
          </button>
        </div>
      </div>

      {view === 'kafelki' ? (
        <>
          <ul
            ref={boardRef}
            aria-label="Strony dokumentu"
            className="grid select-none gap-3 p-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))' }}
          >
            {items.map((item, i) => {
              const dragged = dragId === item.id;
              return (
                <li
                  key={item.id}
                  data-tile
                  data-index={i}
                  onPointerDown={(e) => beginDrag(e, i, item.id)}
                  onDragStart={(e) => e.preventDefault()}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border bg-brand-50 p-2 ${
                    dragged
                      ? 'pointer-events-none z-40 cursor-grabbing border-brand-400 bg-white shadow-panel'
                      : 'cursor-grab border-brand-200'
                  } ${target === i && dragId && !dragged ? 'ring-2 ring-brand-500' : ''}`}
                >
                  <span
                    data-grip
                    aria-hidden
                    className="absolute left-1 top-1 z-10 cursor-grab touch-none rounded p-1 text-brand-400"
                  >
                    <GripVertical size={14} />
                  </span>
                  <PagePreview item={item} settings={settings} />
                  <p
                    className="w-full truncate text-center text-[11px] text-brand-600"
                    title={item.file.name}
                  >
                    {i + 1}. {item.file.name}
                  </p>
                  <div data-nodrag className="flex items-center">
                    <Actions index={i} {...actions} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-brand-100 px-3 py-2 text-[11px] text-brand-500">
            Przeciągnij kafelek, żeby zmienić kolejność (na telefonie złap za uchwyt w rogu). Podgląd
            pokazuje, jak obraz ułoży się na stronie przy obecnych ustawieniach.
          </p>
        </>
      ) : (
        <ul className="max-h-96 divide-y divide-brand-100 overflow-y-auto" aria-label="Strony dokumentu">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2.5 px-3 py-2">
              <RowThumb item={item} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-brand-800">
                  {i + 1}. {item.file.name}
                </p>
                <p className="text-[11px] text-brand-500">
                  {formatBytes(item.file.size)}
                  {item.rotation ? ` · obrót ${item.rotation}°` : ''}
                </p>
              </div>
              <Actions index={i} vertical {...actions} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
