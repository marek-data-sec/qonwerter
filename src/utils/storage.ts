// Wszystkie klucze tej aplikacji zaczynają się od "plik." (ustawienia narzędzi)
const STORAGE_PREFIX = 'plik.';

export function clearAppStorage(storage: Storage = window.localStorage): void {
  try {
    const doUsuniecia: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const klucz = storage.key(i);
      if (klucz && klucz.startsWith(STORAGE_PREFIX)) doUsuniecia.push(klucz);
    }
    doUsuniecia.forEach((k) => storage.removeItem(k));
  } catch {
    // nic więcej nie zrobimy
  }
}
