import { useState } from 'react';
import { X, History } from 'lucide-react';
import { APP_VERSION, CHANGELOG } from '../utils/appMeta';

export default function ChangelogModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-brand-300 hover:text-brand-500 underline decoration-dotted transition-colors"
      >
        v{APP_VERSION}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-brand-950/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-panel max-w-lg w-full max-h-[80dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <History size={16} className="text-brand-500" />
                <h2 className="font-serif font-semibold text-brand-900">Historia zmian</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Zamknij historię zmian"
                className="text-brand-400 hover:text-brand-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {CHANGELOG.map((entry) => (
                <div key={entry.version}>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-brand-800">v{entry.version}</span>
                    <span className="text-[11px] text-brand-400">{entry.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {entry.changes.map((change, idx) => (
                      <li key={idx} className="text-xs text-brand-600 leading-relaxed flex gap-1.5">
                        <span className="text-brand-300 shrink-0">—</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
