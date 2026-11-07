import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Button,
  Card,
  DropZone,
  Field,
  FileList,
  Notice,
  ResultList,
  ToolLayout,
  inputCls,
  useFileList,
  type ResultItem
} from '../components/ui';
import { EXT, FORMAT_HINT, FORMAT_LABEL, renderImage, type OutFormat } from '../utils/image';
import { baseName, errMsg, tick, uniqueName } from '../utils/format';
import { usePersistentState } from '../utils/usePersistentState';

interface Opts {
  format: OutFormat;
  quality: number;
  maxSide: number;
  background: string;
}
const DEFAULTS: Opts = { format: 'jpeg', quality: 85, maxSide: 0, background: '#ffffff' };

export default function ImageConverter() {
  const list = useFileList();
  const [opts, setOpts] = usePersistentState<Opts>('plik.obrazy', DEFAULTS);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setOpts({ ...opts, [k]: v });

  async function run() {
    setResults([]);
    setErrors([]);
    const used = new Set<string>();
    const out: ResultItem[] = [];
    const errs: string[] = [];
    for (let i = 0; i < list.files.length; i++) {
      const f = list.files[i];
      setProgress(`${i + 1} / ${list.files.length}`);
      await tick();
      try {
        const r = await renderImage(f, {
          format: opts.format,
          quality: opts.quality / 100,
          maxSide: opts.maxSide,
          background: opts.background
        });
        out.push({
          id: `${i}-${f.name}`,
          name: uniqueName(`${baseName(f.name)}.${EXT[opts.format]}`, used),
          blob: r.blob,
          before: f.size,
          note: `${r.width}×${r.height}`
        });
      } catch (e) {
        errs.push(`${f.name}: ${errMsg(e)}`);
      }
    }
    setResults(out);
    setErrors(errs);
    setProgress(null);
  }

  return (
    <ToolLayout
      title="Konwersja obrazów"
      lead="Zamień wiele obrazów naraz między PNG, JPG i WebP, zmniejsz je albo skompresuj. Obsługiwane wejście: PNG, JPG, WebP, GIF, BMP, SVG oraz AVIF, jeśli Twoja przeglądarka go czyta."
      input={
        <>
          <DropZone accept="image/*" onFiles={list.add} hint="Obrazy: PNG, JPG, WebP, GIF, BMP, SVG" />
          <FileList files={list.files} thumbs onRemove={list.remove} onClear={list.clear} />
        </>
      }
      settings={
        <Card className="p-4 space-y-4">
          <Field label="Format wyjściowy" hint={FORMAT_HINT[opts.format]}>
            <select
              className={inputCls}
              value={opts.format}
              onChange={(e) => set('format', e.target.value as OutFormat)}
            >
              {(Object.keys(FORMAT_LABEL) as OutFormat[]).map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABEL[f]}
                </option>
              ))}
            </select>
          </Field>
          {opts.format !== 'png' && (
            <Field label={`Jakość: ${opts.quality}%`}>
              <input
                type="range"
                min={10}
                max={100}
                value={opts.quality}
                onChange={(e) => set('quality', Number(e.target.value))}
                className="w-full accent-brand-700"
              />
            </Field>
          )}
          <Field
            label="Maks. dłuższy bok (px)"
            hint="0 = bez zmiany rozmiaru. Obrazy nigdy nie są powiększane."
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
          {opts.format === 'jpeg' && (
            <Field label="Tło dla przezroczystości" hint="JPG nie obsługuje przezroczystości.">
              <input
                type="color"
                value={opts.background}
                onChange={(e) => set('background', e.target.value)}
                className="h-9 w-full cursor-pointer rounded-md border border-brand-200 bg-white p-1"
              />
            </Field>
          )}
          <Button onClick={run} disabled={!list.files.length} busy={progress !== null} className="w-full">
            <RefreshCw size={15} />
            {progress ? `Konwertuję ${progress}` : 'Konwertuj'}
          </Button>
        </Card>
      }
      output={
        <>
          {errors.length > 0 && (
            <Notice kind="error">
              {errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </Notice>
          )}
          <ResultList items={results} zipName="obrazy.zip" preview />
        </>
      }
    />
  );
}
