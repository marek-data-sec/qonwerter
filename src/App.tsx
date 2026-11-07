import { useEffect, useState } from 'react';
import { Files, FileImage, Image as ImageIcon, FileOutput, QrCode as QrIcon } from 'lucide-react';
import Header, { type ToolDef } from './components/Header';
import DisclaimerBar from './components/DisclaimerBar';
import ChangelogModal from './components/ChangelogModal';
import ErrorBoundary from './components/ErrorBoundary';
import ImageConverter from './tools/ImageConverter';
import ImagesToPdf from './tools/ImagesToPdf';
import PdfToImages from './tools/PdfToImages';
import PdfTools from './tools/PdfTools';
import QrCode from './tools/QrCode';

const tools: (ToolDef & { el: JSX.Element })[] = [
  { id: 'obrazy', label: 'Obrazy', icon: ImageIcon, el: <ImageConverter /> },
  { id: 'obrazy-pdf', label: 'Obrazy → PDF', icon: FileOutput, el: <ImagesToPdf /> },
  { id: 'pdf-obrazy', label: 'PDF → obrazy', icon: FileImage, el: <PdfToImages /> },
  { id: 'pdf', label: 'Narzędzia PDF', icon: Files, el: <PdfTools /> },
  { id: 'qr', label: 'Kody QR', icon: QrIcon, el: <QrCode /> }
];

function useHashTool(): string {
  const read = () => {
    const h = location.hash.replace(/^#\/?/, '');
    return tools.some((t) => t.id === h) ? h : tools[0].id;
  };
  const [id, setId] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setId(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return id;
}

export default function App() {
  const active = useHashTool();
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
        <ErrorBoundary>
          {/* Wszystkie narzędzia zostają zamontowane, żeby przełączenie zakładki nie kasowało listy plików */}
          {tools.map((t) => (
            <div key={t.id} hidden={t.id !== active}>
              {t.el}
            </div>
          ))}
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
