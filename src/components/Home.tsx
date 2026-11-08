import type { LucideIcon } from 'lucide-react';
import { APP_NAME } from '../utils/appMeta';
import { sklejKrotkie } from '../utils/typografia';
import { showZipLink } from './Header';

export interface HomeItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export default function Home({ items }: { items: HomeItem[] }) {
  return (
    <section>
      <h1 className="font-serif text-xl font-semibold text-brand-900">Menu główne</h1>
      <p className="mt-1 mb-5 max-w-2xl text-sm text-brand-500 text-left sm:text-justify">
        {sklejKrotkie(
          `${APP_NAME} zmienia format obrazów, składa i dzieli pliki PDF oraz robi kody QR z własnym logo. Wszystko dzieje się w Twojej przeglądarce, więc pliki nie trafiają na żaden serwer. Wybierz, co chcesz zrobić.`
        )}
      </p>
      <ul aria-label="Narzędzia" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ id, label, description, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="flex h-full gap-3 rounded-lg border border-brand-200 bg-white p-4 shadow-card transition-colors hover:border-brand-400 focus-ring"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-[15px] font-semibold text-brand-900">{label}</span>
                <span className="mt-0.5 block text-sm text-brand-500">{sklejKrotkie(description)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {showZipLink() && (
        <p className="mt-5 max-w-2xl text-xs text-brand-500">
          Wersję na Windows, która działa bez internetu, pobierzesz przyciskiem w prawym górnym rogu.
        </p>
      )}
    </section>
  );
}
