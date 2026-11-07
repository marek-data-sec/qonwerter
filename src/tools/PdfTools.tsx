import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Files } from 'lucide-react';
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
import { baseName, errMsg, parsePageRange } from '../utils/format';

type Mode = 'scal' | 'wyodrebnij' | 'rozdziel';
const MODES: { id: Mode; label: string; lead: string }[] = [
  { id: 'scal', label: 'Scal', lead: 'Połącz kilka plików PDF w jeden. Kolejność ustawiasz strzałkami.' },
  {
    id: 'wyodrebnij',
    label: 'Wyodrębnij strony',
    lead: 'Zapisz wybrane strony jednego PDF jako nowy dokument.'
  },
  {
    id: 'rozdziel',
    label: 'Rozdziel',
    lead: 'Zapisz każdą stronę PDF jako osobny plik (wszystko w jednym ZIP-ie).'
  }
];

const pdfBlob = async (doc: PDFDocument) =>
  new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' });

function explain(e: unknown, name: string): Error {
  const msg = errMsg(e);
  if (/encrypt/i.test(msg))
    return new Error(`${name}: plik jest zaszyfrowany, a ta operacja go nie obsługuje.`);
  return new Error(`${name}: ${msg}`);
}

async function loadPdf(file: File): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await file.arrayBuffer());
  } catch (e) {
    throw explain(e, file.name);
  }
}

export default function PdfTools() {
  const [mode, setMode] = useState<Mode>('scal');
  const list = useFileList();
  const [range, setRange] = useState('');
  const [pages, setPages] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const single = mode !== 'scal';
  const first = list.files[0];

  function changeMode(next: Mode) {
    setMode(next);
    setResults([]);
    setError('');
    // w trybach na jednym pliku zostaje tylko pierwszy z listy
    if (next !== 'scal' && list.files.length > 1) list.replace(list.files.slice(0, 1));
  }

  useEffect(() => {
    setPages(0);
    if (!single || !first) return;
    let alive = true;
    loadPdf(first).then(
      (d) => alive && setPages(d.getPageCount()),
      (e) => alive && setError(errMsg(e))
    );
    return () => {
      alive = false;
    };
  }, [single, first]);

  async function run() {
    setResults([]);
    setError('');
    setBusy(true);
    try {
      if (mode === 'scal') {
        const out = await PDFDocument.create();
        for (const f of list.files) {
          const src = await loadPdf(f);
          (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
        }
        setResults([
          { id: 'scalony', name: 'scalony.pdf', blob: await pdfBlob(out), note: `${out.getPageCount()} str.` }
        ]);
      } else {
        const src = await loadPdf(first);
        const base = baseName(first.name);
        if (mode === 'wyodrebnij') {
          const nums = parsePageRange(range, src.getPageCount());
          const out = await PDFDocument.create();
          (
            await out.copyPages(
              src,
              nums.map((n) => n - 1)
            )
          ).forEach((p) => out.addPage(p));
          setResults([
            {
              id: 'wyciag',
              name: `${base}-wybrane-strony.pdf`,
              blob: await pdfBlob(out),
              note: `${nums.length} str.`
            }
          ]);
        } else {
          const total = src.getPageCount();
          const digits = String(total).length;
          const items: ResultItem[] = [];
          for (let i = 0; i < total; i++) {
            const out = await PDFDocument.create();
            out.addPage((await out.copyPages(src, [i]))[0]);
            items.push({
              id: String(i),
              name: `${base}-str-${String(i + 1).padStart(digits, '0')}.pdf`,
              blob: await pdfBlob(out)
            });
          }
          setResults(items);
        }
      }
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  const current = MODES.find((m) => m.id === mode)!;
  const ready = mode === 'scal' ? list.files.length > 1 : Boolean(first && pages);

  return (
    <ToolLayout
      title="Narzędzia PDF"
      lead={current.lead}
      input={
        <>
          <div
            role="tablist"
            aria-label="Operacja"
            className="inline-flex rounded-md border border-brand-200 bg-white p-0.5"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => changeMode(m.id)}
                className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors focus-ring ${
                  mode === m.id ? 'bg-brand-700 text-white' : 'text-brand-600 hover:bg-brand-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <DropZone
            accept=".pdf,application/pdf"
            multiple={!single}
            onFiles={single ? list.replace : list.add}
            hint={single ? 'Jeden plik PDF' : 'Pliki PDF do scalenia (min. 2)'}
          />
          <FileList
            files={list.files}
            reorder={!single}
            onMove={list.move}
            onRemove={list.remove}
            onClear={list.clear}
          />
          {single && pages > 0 && (
            <p className="text-xs text-brand-600">
              Liczba stron w dokumencie: <strong className="text-brand-800">{pages}</strong>
            </p>
          )}
        </>
      }
      settings={
        <Card className="p-4 space-y-4">
          {mode === 'wyodrebnij' && (
            <Field
              label="Strony"
              hint="Np. 1-3, 5, 8-. Kolejność możesz zmienić, np. „3, 1”. Puste = wszystkie."
            >
              <input
                className={inputCls}
                placeholder="wszystkie"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              />
            </Field>
          )}
          {mode !== 'wyodrebnij' && (
            <p className="text-xs text-brand-500">Ta operacja nie ma dodatkowych ustawień.</p>
          )}
          <Button onClick={run} disabled={!ready} busy={busy} className="w-full">
            <Files size={15} />
            {current.label}
          </Button>
        </Card>
      }
      output={
        <>
          {error && <Notice kind="error">{error}</Notice>}
          <ResultList items={results} zipName={first ? `${baseName(first.name)}-strony.zip` : 'strony.zip'} />
        </>
      }
    />
  );
}
