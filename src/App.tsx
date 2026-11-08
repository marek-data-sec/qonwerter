import { Files, FileImage, Image as ImageIcon, FileOutput, QrCode as QrIcon } from 'lucide-react';
import Header, { type ToolDef } from './components/Header';
import DisclaimerBar from './components/DisclaimerBar';
import ChangelogModal from './components/ChangelogModal';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './components/Home';
import { InAppBrowserNotice } from './components/ui';
import ImageConverter from './tools/ImageConverter';
import ImagesToPdf from './tools/ImagesToPdf';
import PdfToImages from './tools/PdfToImages';
import PdfTools from './tools/PdfTools';
import QrCode from './tools/QrCode';
import { HOME, useHashRoute } from './utils/useHashRoute';

const tools: (ToolDef & { el: JSX.Element; description: string })[] = [
  {
    id: 'obrazy',
    label: 'Obrazy',
    icon: ImageIcon,
    el: <ImageConverter />,
    description:
      'Zamień wiele obrazów naraz na PNG, JPG albo WebP. Możesz je też zmniejszyć lub skompresować.'
  },
  {
    id: 'obrazy-pdf',
    label: 'Obrazy → PDF',
    icon: FileOutput,
    el: <ImagesToPdf />,
    description:
      'Złóż jeden PDF z kilku obrazów. Strony ułożysz na kafelkach, obrócisz i przeciągniesz w odpowiednie miejsce.'
  },
  {
    id: 'pdf-obrazy',
    label: 'PDF → obrazy',
    icon: FileImage,
    el: <PdfToImages />,
    description: 'Zapisz strony PDF jako obrazy PNG, JPG albo WebP. Wybierasz strony i rozdzielczość.'
  },
  {
    id: 'pdf',
    label: 'Narzędzia PDF',
    icon: Files,
    el: <PdfTools />,
    description: 'Scal kilka PDF-ów w jeden, wyciągnij wybrane strony albo rozdziel dokument na osobne pliki.'
  },
  {
    id: 'qr',
    label: 'Kody QR',
    icon: QrIcon,
    el: <QrCode />,
    description:
      'Zrób kod QR z tekstu lub adresu strony i dodaj własne logo. Pobierzesz go jako PNG albo SVG.'
  }
];

const ids = tools.map((t) => t.id);

export default function App() {
  const active = useHashRoute(ids);
  return (
    <div className="min-h-screen bg-texture flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-brand-800 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium"
        onClick={(e) => {
          // #main-content nie jest trasą, więc nie zmieniamy hasha, tylko przenosimy fokus
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Przejdź do treści
      </a>
      <DisclaimerBar />
      <Header tools={tools} active={active} />
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:py-8">
        <InAppBrowserNotice className="mb-5" />
        <ErrorBoundary>
          {/* Wszystkie narzędzia zostają zamontowane, żeby przełączenie widoku nie kasowało listy plików */}
          {tools.map((t) => (
            <div key={t.id} hidden={t.id !== active}>
              {t.el}
            </div>
          ))}
          <div hidden={active !== HOME}>
            <Home items={tools} />
          </div>
        </ErrorBoundary>
      </main>
      <footer className="no-print border-t border-brand-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 text-xs text-brand-500 flex flex-col md:flex-row md:items-start justify-between gap-x-6 gap-y-2">
          <span className="md:max-w-sm">
            Pliki są trzymane w pamięci przeglądarki do momentu odświeżenia strony.
          </span>
          <span className="md:text-right">
            Canvas, pdf.js, pdf-lib, qrcode-generator, jsQR · <ChangelogModal />
          </span>
        </div>
      </footer>
    </div>
  );
}
