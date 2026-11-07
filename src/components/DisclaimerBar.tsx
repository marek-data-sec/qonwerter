import { ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';

export default function DisclaimerBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="no-print bg-brand-800 text-brand-100 text-xs px-4 py-1.5 flex items-center justify-between">
        <span>Pliki nie są wysyłane na żaden serwer.</span>
        <button onClick={() => setDismissed(false)} className="underline decoration-dotted hover:text-white">
          rozwiń
        </button>
      </div>
    );
  }

  return (
    <div className="no-print bg-brand-100 border-b border-brand-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-brand-600 mt-0.5 shrink-0" />
        <p className="text-[13px] sm:text-sm text-brand-900 leading-snug">
          <strong className="font-semibold">
            Pliki są przetwarzane w Twojej przeglądarce i nie są wysyłane na żaden serwer.
          </strong>{' '}
          Aplikacja zapisuje w przeglądarce tylko ustawienia narzędzi.
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Zwiń informację"
          className="text-brand-500 hover:text-brand-800 shrink-0 p-1.5 -m-1.5 ml-auto"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
