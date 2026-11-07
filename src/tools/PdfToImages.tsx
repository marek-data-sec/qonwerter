import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { FileImage } from 'lucide-react';
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
import { EXT, FORMAT_HINT, FORMAT_LABEL, type OutFormat } from '../utils/image';
import { isPasswordError, openPdf, renderPdfPage } from '../utils/pdf';
import { baseName, errMsg, parsePageRange, tick } from '../utils/format';
import { usePersistentState } from '../utils/usePersistentState';

interface Opts {
  format: OutFormat;
  quality: number;
  dpi: number;
  range: string;
}
const DEFAULTS: Opts = { format: 'png', quality: 90, dpi: 150, range: '' };

export default function PdfToImages() {
  const list = useFileList();
  const file = list.files[0];
  const [opts, setOpts] = usePersistentState<Opts>('plik.pdfObrazy', DEFAULTS);
  const [pages, setPages] = useState(0);
  const [password, setPassword] = useState('');
  const [locked, setLocked] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<string | null>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setOpts({ ...opts, [k]: v });

  // hasło dotyczy konkretnego pliku, więc po wybraniu innego pliku przestaje obowiązywać
  const [unlock, setUnlock] = useState<{ file: File; password: string }>();
  const passwordForFile = unlock && unlock.file === file ? unlock.password : undefined;
  const unlockWith = () => file && setUnlock({ file, password });

  useEffect(() => {
    let alive = true;
    docRef.current?.destroy();
    docRef.current = null;
    setPages(0);
    setError('');
    setResults([]);
    if (passwordForFile === undefined) setPassword('');
    if (!file) {
      setLocked(false);
      return;
    }
    file
      .arrayBuffer()
      .then((buf) => openPdf(buf, passwordForFile))
      .then((doc) => {
        // wolniejszy odczyt poprzedniego pliku nie może nadpisać nowszego
        if (!alive) return void doc.destroy();
        docRef.current = doc;
        setPages(doc.numPages);
        setLocked(false);
      })
      .catch((e) => {
        if (!alive) return;
        if (isPasswordError(e)) {
          setLocked(true);
          if (passwordForFile) setError('Nieprawidłowe hasło.');
        } else {
          setLocked(false);
          setError(`Nie można otworzyć PDF: ${errMsg(e)}`);
        }
      });
    return () => {
      alive = false;
    };
  }, [file, passwordForFile]);

  // zwolnienie dokumentu przy zamknięciu narzędzia
  useEffect(
    () => () => {
      docRef.current?.destroy();
    },
    []
  );

  async function run() {
    const doc = docRef.current;
    if (!doc || !file) return;
    setResults([]);
    setError('');
    try {
      const nums = parsePageRange(opts.range, doc.numPages);
      const digits = String(doc.numPages).length;
      const out: ResultItem[] = [];
      for (let i = 0; i < nums.length; i++) {
        setProgress(`${i + 1} / ${nums.length}`);
        await tick();
        const r = await renderPdfPage(doc, nums[i], opts.dpi / 72, opts.format, opts.quality / 100);
        out.push({
          id: String(nums[i]),
          name: `${baseName(file.name)}-str-${String(nums[i]).padStart(digits, '0')}.${EXT[opts.format]}`,
          blob: r.blob,
          note: `${r.width}×${r.height}`
        });
        setResults([...out]);
      }
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setProgress(null);
    }
  }

  return (
    <ToolLayout
      title="PDF → obrazy"
      lead="Zamień strony PDF na obrazy PNG, JPG lub WebP. Możesz wybrać tylko część stron i rozdzielczość. Wiele stron pobierzesz jednym plikiem ZIP."
      input={
        <>
          <DropZone
            accept=".pdf,application/pdf"
            multiple={false}
            onFiles={list.replace}
            hint="Jeden plik PDF"
          />
          <FileList files={list.files} onRemove={list.remove} onClear={list.clear} />
          {locked && (
            <Card className="p-3 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[12rem]">
                <Field label="PDF jest chroniony hasłem">
                  <input
                    type="password"
                    className={inputCls}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && unlockWith()}
                  />
                </Field>
              </div>
              <Button onClick={unlockWith} disabled={!password}>
                Odblokuj
              </Button>
            </Card>
          )}
          {pages > 0 && (
            <p className="text-xs text-brand-600">
              Liczba stron w dokumencie: <strong className="text-brand-800">{pages}</strong>
            </p>
          )}
        </>
      }
      settings={
        <Card className="p-4 space-y-4">
          <Field label="Strony" hint="Np. 1-3, 5, 8- (puste = wszystkie).">
            <input
              className={inputCls}
              placeholder="wszystkie"
              value={opts.range}
              onChange={(e) => set('range', e.target.value)}
            />
          </Field>
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
            label="Rozdzielczość"
            hint="Wyższa daje ostrzejszy obraz, ale większe pliki. Bardzo duże strony są zmniejszane automatycznie."
          >
            <select
              className={inputCls}
              value={opts.dpi}
              onChange={(e) => set('dpi', Number(e.target.value))}
            >
              <option value={72}>72 dpi (podgląd)</option>
              <option value={150}>150 dpi (standard)</option>
              <option value={200}>200 dpi</option>
              <option value={300}>300 dpi (druk)</option>
            </select>
          </Field>
          <Button onClick={run} disabled={!pages} busy={progress !== null} className="w-full">
            <FileImage size={15} />
            {progress ? `Strona ${progress}` : 'Konwertuj'}
          </Button>
        </Card>
      }
      output={
        <>
          {error && <Notice kind="error">{error}</Notice>}
          <ResultList items={results} zipName={`${file ? baseName(file.name) : 'pdf'}-obrazy.zip`} preview />
        </>
      }
    />
  );
}
