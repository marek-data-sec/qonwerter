import { useEffect, useState } from 'react';

// Ustawienia narzędzi zostają w localStorage, z domyślnymi wartościami
// uzupełnianymi przy zmianie wersji. Brak dostępu do localStorage nie psuje działania.
export function usePersistentState<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { ...initial, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      /* localStorage niedostępny */
    }
    return initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* localStorage niedostępny */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
