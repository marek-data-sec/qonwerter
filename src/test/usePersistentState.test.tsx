import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePersistentState } from '../utils/usePersistentState';

const DOMYSLNE = { format: 'webp', quality: 85 };

describe('usePersistentState', () => {
  beforeEach(() => window.localStorage.clear());

  it('zwraca domyślne wartości, gdy nic nie zapisano', () => {
    const { result } = renderHook(() => usePersistentState('plik.test', DOMYSLNE));
    expect(result.current[0]).toEqual(DOMYSLNE);
  });

  it('zapisuje zmiany i odczytuje je po ponownym zamontowaniu', () => {
    const pierwszy = renderHook(() => usePersistentState('plik.test', DOMYSLNE));
    act(() => pierwszy.result.current[1]({ format: 'png', quality: 50 }));
    pierwszy.unmount();
    const drugi = renderHook(() => usePersistentState('plik.test', DOMYSLNE));
    expect(drugi.result.current[0]).toEqual({ format: 'png', quality: 50 });
  });

  it('uzupełnia brakujące pola nowymi domyślnymi (stary zapis z wcześniejszej wersji)', () => {
    window.localStorage.setItem('plik.test', JSON.stringify({ format: 'jpeg' }));
    const { result } = renderHook(() => usePersistentState('plik.test', DOMYSLNE));
    expect(result.current[0]).toEqual({ format: 'jpeg', quality: 85 });
  });

  it('nie wywala się na uszkodzonym JSON-ie', () => {
    window.localStorage.setItem('plik.test', '{nie-json');
    const { result } = renderHook(() => usePersistentState('plik.test', DOMYSLNE));
    expect(result.current[0]).toEqual(DOMYSLNE);
  });
});
