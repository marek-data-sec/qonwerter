import { useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileOutput } from 'lucide-react';
import {
  Button,
  Card,
  DropZone,
  Field,
  Notice,
  ResultList,
  ToolLayout,
  inputCls,
  type ResultItem
} from '../components/ui';
import PageBoard, { type BoardView, type PageItem } from '../components/PageBoard';
import { normalizeRotation, renderImage } from '../utils/image';
import { pageGeometry, type Orientation, type PageSize } from '../utils/pdfLayout';
import { APP_NAME } from '../utils/appMeta';
import { errMsg, naturalCompare, tick } from '../utils/format';
import { usePersistentState } from '../utils/usePersistentState';

interface Opts {
  pageSize: PageSize;
  orientation: Orientation;
  margin: number;
  maxSide: number;
  quality: number;
  view: BoardView;
}
const DEFAULTS: Opts = {
  pageSize: 'a4',
  orientation: 'auto',
  margin: 10,
  maxSide: 0,
  quality: 90,
  view: 'kafelki'
};

async function buildPdf(items: PageItem[], o: Opts, onProgress: (n: number) => void): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.setProducer(APP_NAME);
  doc.setCreator(APP_NAME);
  for (let i = 0; i < items.length; i++) {
    onProgress(i + 1);
    await tick();
    const { file, rotation } = items[i];
    // JPEG zostaje JPEG-iem (małe pliki), reszta idzie jako PNG, żeby zachować przezroczystość.
    // Przejście przez canvas uwzględnia przy okazji obrót EXIF ze zdjęć z telefonu i obrót wybrany na kafelku.
    const isJpeg = file.type === 'image/jpeg';
    let r;
    try {
      r = await renderImage(file, {
        format: isJpeg ? 'jpeg' : 'png',
        quality: o.quality / 100,
        maxSide: o.maxSide,
        background: '#ffffff',
        rotate: rotation
      });
    } catch (e) {
      throw new Error(`${file.name}: ${errMsg(e)}`, { cause: e });
    }
    const bytes = new Uint8Array(await r.blob.arrayBuffer());
    const img = isJpeg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
    const g = pageGeometry(r.width, r.height, o);
    doc.addPage([g.pw, g.ph]).drawImage(img, { x: g.x, y: g.y, width: g.w, height: g.h });
  }
  return new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' });
}

export default function ImagesToPdf() {
  const [items, setItems] = useState<PageItem[]>([]);
  const nextId = useRef(0);
  const [opts, setOpts] = usePersistentState<Opts>('plik.obrazyPdf', DEFAULTS);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setOpts({ ...opts, [k]: v });

  const add = (files: File[]) => {
    const added = files.map((file) => ({ id: String(++nextId.current), file, rotation: 0 }));
    setItems((cur) => [...cur, ...added]);
  };
  const move = (from: number, to: number) =>
    setItems((cur) => {
      const next = [...cur];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  const remove = (index: number) => setItems((cur) => cur.filter((_, k) => k !== index));
  const rotate = (index: number, delta: number) =>
    setItems((cur) =>
      cur.map((it, k) => (k === index ? { ...it, rotation: normalizeRotation(it.rotation + delta) } : it))
    );

  async function run() {
    setResults([]);
    setError('');
    setProgress(0);
    try {
      const blob = await buildPdf(items, opts, setProgress);
      setResults([{ id: 'pdf', name: 'obrazy.pdf', blob, note: `${items.length} str.` }]);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setProgress(null);
    }
  }

  return (
    <ToolLayout
      title="Obrazy → PDF"
      lead="Złóż jeden PDF z kilku obrazów. Kafelki pokazują, jak każdy obraz ułoży się na stronie, a kolejność zmienisz przeciągając je. Zdjęcia JPG trafiają do PDF jako JPG o wybranej jakości, reszta bezstratnie."
      input={
        <>
          <DropZone accept="image/*" onFiles={add} hint="Obrazy: PNG, JPG, WebP, GIF, BMP, SVG" />
          <PageBoard
            items={items}
            settings={opts}
            view={opts.view}
            onView={(v) => set('view', v)}
            onMove={move}
            onRemove={remove}
            onRotate={rotate}
            onSortName={() =>
              setItems((cur) => [...cur].sort((a, b) => naturalCompare(a.file.name, b.file.name)))
            }
            onReverse={() => setItems((cur) => [...cur].reverse())}
            onClear={() => setItems([])}
          />
        </>
      }
      settings={
        <Card className="p-4 space-y-4">
          <Field label="Rozmiar strony">
            <select
              className={inputCls}
              value={opts.pageSize}
              onChange={(e) => set('pageSize', e.target.value as PageSize)}
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="fit">Dopasowany do obrazu</option>
            </select>
          </Field>
          {opts.pageSize !== 'fit' && (
            <Field label="Orientacja">
              <select
                className={inputCls}
                value={opts.orientation}
                onChange={(e) => set('orientation', e.target.value as Orientation)}
              >
                <option value="auto">Automatyczna (wg obrazu)</option>
                <option value="portrait">Pionowa</option>
                <option value="landscape">Pozioma</option>
              </select>
            </Field>
          )}
          <Field label="Margines">
            <select
              className={inputCls}
              value={opts.margin}
              onChange={(e) => set('margin', Number(e.target.value))}
            >
              {[0, 5, 10, 15, 20].map((m) => (
                <option key={m} value={m}>
                  {m} mm
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={`Jakość JPG: ${opts.quality}%`}
            hint="Dotyczy tylko zdjęć JPG. Pozostałe formaty zapisują się bezstratnie."
          >
            <input
              type="range"
              min={40}
              max={100}
              value={opts.quality}
              onChange={(e) => set('quality', Number(e.target.value))}
              className="w-full accent-brand-700"
            />
          </Field>
          <Field
            label="Maks. dłuższy bok obrazu (px)"
            hint="0 = oryginalny rozmiar. Zmniejszenie np. do 2000 mocno odchudza PDF ze skanów."
          >
            <input
              type="number"
              min={0}
              max={20000}
              step={100}
              className={inputCls}
              value={opts.maxSide}
              onChange={(e) => set('maxSide', Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>
          <Button onClick={run} disabled={!items.length} busy={progress !== null} className="w-full">
            <FileOutput size={15} />
            {progress ? `Strona ${progress} / ${items.length}` : 'Utwórz PDF'}
          </Button>
        </Card>
      }
      output={
        <>
          {error && <Notice kind="error">{error}</Notice>}
          <ResultList items={results} zipName="obrazy.zip" />
        </>
      }
    />
  );
}
