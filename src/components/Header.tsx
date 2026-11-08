import type { LucideIcon } from 'lucide-react';
import { ArrowRightLeft, Download, Github, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { APP_NAME, APP_TAGLINE, ZIP_NAME } from '../utils/appMeta';

export interface ToolDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Na GitHub Pages pokazujemy link do ZIP-a z wersją na Windows. Sama wersja z dysku (file://) już go nie potrzebuje.
const IS_OFFLINE = typeof location !== 'undefined' && location.protocol === 'file:';

// ZIP powstaje przy `npm run build`. Serwer deweloperski (`npm run dev`) wydaje go z katalogu dist, a gdy
// go nie ma, odpowiada czytelnym błędem 404 zamiast stroną startową (patrz vite.config.ts).
export const showZipLink = () => !IS_OFFLINE;

const btn =
  'inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-800 border border-brand-200 hover:border-brand-400 rounded-md px-2.5 py-1.5 transition-colors';

export default function Header({ tools, active }: { tools: ToolDef[]; active: string }) {
  const [open, setOpen] = useState(false);

  const zipLink = showZipLink() && (
    <a href={`./${ZIP_NAME}`} download title="Pobierz ZIP z wersją działającą bez internetu" className={btn}>
      <Download size={14} />
      <span className="hidden sm:inline">Wersja na Windows</span>
    </a>
  );

  return (
    <header className="no-print bg-white border-b border-brand-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-2">
          <a
            href="#menu"
            title="Menu główne"
            aria-current={active === 'menu' ? 'page' : undefined}
            className="flex shrink-0 items-center gap-2.5 rounded transition-opacity hover:opacity-80 focus-ring"
          >
            <div className="w-9 h-9 rounded-md bg-brand-700 flex items-center justify-center shrink-0">
              <ArrowRightLeft size={19} className="text-brand-50" strokeWidth={2} />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="font-serif font-semibold text-brand-900 text-[15px] whitespace-nowrap">
                {APP_NAME}
              </div>
              <div className="text-[11px] text-brand-500 -mt-0.5 whitespace-nowrap">{APP_TAGLINE}</div>
            </div>
          </a>

          {/* Pełna nawigacja dopiero od 1024px (lg), niżej jest menu rozwijane. */}
          <nav aria-label="Narzędzia" className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
            {tools.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded text-[13px] font-medium whitespace-nowrap transition-colors ${
                  active === id
                    ? 'bg-brand-100 text-brand-800'
                    : 'text-brand-600 hover:text-brand-800 hover:bg-brand-50'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            {zipLink}
            {__REPO_URL__ && (
              <a
                href={__REPO_URL__}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Repozytorium na GitHubie"
                className="hidden sm:block p-2 rounded text-brand-600 hover:text-brand-800 hover:bg-brand-50"
              >
                <Github size={17} />
              </a>
            )}
            <button
              className="lg:hidden text-brand-700 p-1.5"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Narzędzia (menu)" className="lg:hidden pb-3 flex flex-col gap-1">
            <a
              href="#menu"
              onClick={() => setOpen(false)}
              className={`rounded px-3 py-2.5 text-sm font-medium ${
                active === 'menu' ? 'bg-brand-100 text-brand-800' : 'text-brand-600'
              }`}
            >
              Menu główne
            </a>
            {tools.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 rounded text-sm font-medium ${
                  active === id ? 'bg-brand-100 text-brand-800' : 'text-brand-600'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
