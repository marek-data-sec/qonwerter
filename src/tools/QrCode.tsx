import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, QrCode as QrIcon, XCircle } from 'lucide-react';
import { Button, Card, DropZone, Field, FileList, Notice, ToolLayout, inputCls } from '../components/ui';
import {
  buildMatrix,
  colorWarning,
  drawQr,
  prepareLogo,
  readsBack,
  toSvg,
  type QrLogo,
  type QrStyle
} from '../utils/qr';
import { saveBlob } from '../utils/download';
import { errMsg } from '../utils/format';
import { usePersistentState } from '../utils/usePersistentState';

interface Settings {
  fg: string;
  bg: string;
  size: number;
  margin: number;
  logoPct: number;
  logoPad: boolean;
}
const DEFAULTS: Settings = {
  fg: '#000000',
  bg: '#ffffff',
  size: 1024,
  margin: 4,
  logoPct: 22,
  logoPad: true
};

export default function QrCode() {
  const [text, setText] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<QrLogo | null>(null);
  const [logoError, setLogoError] = useState('');
  const [s, setS] = usePersistentState<Settings>('plik.qr', DEFAULTS);
  const [error, setError] = useState('');
  const [check, setCheck] = useState<'ok' | 'fail' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v });

  const style: QrStyle = {
    fg: s.fg,
    bg: s.bg,
    margin: s.margin,
    sizePx: s.size,
    logo,
    logoPct: s.logoPct,
    logoPad: s.logoPad
  };
  const hasText = text.trim().length > 0;
  const colorNote = colorWarning(s.fg, s.bg);

  async function pickLogo(files: File[]) {
    setLogoError('');
    try {
      setLogo(await prepareLogo(files[0]));
      setLogoFile(files[0]);
    } catch (e) {
      setLogoError(errMsg(e));
    }
  }

  function removeLogo() {
    setLogo(null);
    setLogoFile(null);
    setLogoError('');
  }

  // Kod rysuje się na żywo przy każdej zmianie tekstu, logo lub ustawień
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasText) {
      setError('');
      setCheck(null);
      return;
    }
    try {
      const m = buildMatrix(text, logo ? 'H' : 'M');
      drawQr(canvas, m, {
        fg: s.fg,
        bg: s.bg,
        margin: s.margin,
        sizePx: s.size,
        logo,
        logoPct: s.logoPct,
        logoPad: s.logoPad
      });
      setError('');
      setCheck(readsBack(canvas, text) ? 'ok' : 'fail');
    } catch (e) {
      setError(errMsg(e));
      setCheck(null);
    }
  }, [text, hasText, logo, s]);

  const ready = hasText && !error;

  function downloadPng() {
    canvasRef.current?.toBlob((blob) => blob && saveBlob(blob, 'kod-qr.png'), 'image/png');
  }

  function downloadSvg() {
    try {
      const svg = toSvg(buildMatrix(text, logo ? 'H' : 'M'), style);
      saveBlob(new Blob([svg], { type: 'image/svg+xml' }), 'kod-qr.svg');
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <ToolLayout
      title="Kody QR"
      lead="Zamień tekst albo adres strony na kod QR i dodaj własne logo, np. firmy. Kod rysuje się na żywo, a pobrać go można jako PNG albo wektorowy SVG do druku."
      input={
        <>
          <Card className="p-4">
            <Field
              label="Tekst lub adres"
              hint="Kod zawiera dokładnie to, co wpiszesz. Przy adresie strony zacznij od https://."
            >
              <textarea
                className={`${inputCls} min-h-[5.5rem] resize-y`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="https://example.com"
                spellCheck={false}
              />
            </Field>
          </Card>

          {logoFile ? (
            <FileList files={[logoFile]} thumbs onRemove={removeLogo} onClear={removeLogo} />
          ) : (
            <DropZone
              accept="image/*"
              multiple={false}
              onFiles={(f) => void pickLogo(f)}
              hint="Opcjonalne logo: PNG, JPG, SVG, WebP"
            />
          )}
          {logoError && <Notice kind="error">{logoError}</Notice>}

          <Card className="p-4">
            {error && <Notice kind="error">{error}</Notice>}
            {!hasText && <p className="text-sm text-brand-500">Wpisz tekst albo adres, żeby zobaczyć kod.</p>}
            <canvas
              ref={canvasRef}
              aria-label="Podgląd kodu QR"
              className={`mx-auto max-w-full h-auto rounded border border-brand-200 ${ready ? '' : 'hidden'}`}
              style={{ maxHeight: '26rem', width: 'auto' }}
            />
            {ready && check === 'ok' && (
              <p className="mt-3 flex items-start gap-1.5 text-[13px] text-ok-600">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                Test odczytu w aplikacji udany. Przed drukiem sprawdź kod jeszcze telefonem.
              </p>
            )}
            {ready && check === 'fail' && (
              <p className="mt-3 flex items-start gap-1.5 text-[13px] text-alert-700">
                <XCircle size={15} className="mt-0.5 shrink-0" />
                Test odczytu się nie powiódł. Zmniejsz logo, zwiększ kontrast albo skróć tekst.
              </p>
            )}
            {ready && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={downloadPng}>
                  <Download size={15} /> Pobierz PNG
                </Button>
                <Button variant="secondary" onClick={downloadSvg}>
                  <Download size={15} /> Pobierz SVG
                </Button>
              </div>
            )}
          </Card>
        </>
      }
      settings={
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kolor kodu">
              <input
                type="color"
                value={s.fg}
                onChange={(e) => set('fg', e.target.value)}
                className="h-9 w-full cursor-pointer rounded-md border border-brand-200 bg-white p-1"
              />
            </Field>
            <Field label="Kolor tła">
              <input
                type="color"
                value={s.bg}
                onChange={(e) => set('bg', e.target.value)}
                className="h-9 w-full cursor-pointer rounded-md border border-brand-200 bg-white p-1"
              />
            </Field>
          </div>
          {colorNote && <Notice>{colorNote}</Notice>}
          <Field label="Rozmiar obrazu">
            <select className={inputCls} value={s.size} onChange={(e) => set('size', Number(e.target.value))}>
              {[512, 1024, 2048].map((v) => (
                <option key={v} value={v}>
                  {v} px
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={`Biała ramka: ${s.margin} modułów`}
            hint="Czytniki potrzebują jasnego marginesu wokół kodu. Zalecane jest 4."
          >
            <input
              type="range"
              min={2}
              max={8}
              value={s.margin}
              onChange={(e) => set('margin', Number(e.target.value))}
              className="w-full accent-brand-700"
            />
          </Field>
          {logo && (
            <>
              <Field
                label={`Rozmiar logo: ${s.logoPct}%`}
                hint="Logo do ok. 25% boku kodu zwykle nie przeszkadza w odczycie. Z logo kod używa najwyższej korekcji błędów, więc zmieści mniej tekstu."
              >
                <input
                  type="range"
                  min={10}
                  max={30}
                  value={s.logoPct}
                  onChange={(e) => set('logoPct', Number(e.target.value))}
                  className="w-full accent-brand-700"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-brand-800">
                <input
                  type="checkbox"
                  checked={s.logoPad}
                  onChange={(e) => set('logoPad', e.target.checked)}
                  className="accent-brand-700"
                />
                Podkładka pod logo w kolorze tła
              </label>
            </>
          )}
          <p className="flex items-center gap-1.5 text-[11px] text-brand-500">
            <QrIcon size={13} className="shrink-0" /> Logo nie jest zapamiętywane, po odświeżeniu trzeba je
            dodać ponownie.
          </p>
        </Card>
      }
      output={null}
    />
  );
}
