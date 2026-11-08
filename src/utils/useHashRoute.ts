import { useEffect, useState } from 'react';

// Widok wybiera się adresem (#obrazy, #qr...). Pusty albo nieznany adres to menu główne.
export const HOME = 'menu';

export function routeFromHash(hash: string, valid: string[]): string {
  const id = hash.replace(/^#\/?/, '');
  return valid.includes(id) ? id : HOME;
}

export function useHashRoute(valid: string[]): string {
  const [route, setRoute] = useState(() => routeFromHash(location.hash, valid));
  useEffect(() => {
    const onChange = () => {
      setRoute(routeFromHash(location.hash, valid));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [valid]);
  return route;
}
