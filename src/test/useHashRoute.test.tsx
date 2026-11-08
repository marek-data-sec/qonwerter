import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { HOME, routeFromHash, useHashRoute } from '../utils/useHashRoute';

const ids = ['obrazy', 'qr'];

describe('routeFromHash', () => {
  it('rozpoznaje znane adresy, także z ukośnikiem', () => {
    expect(routeFromHash('#qr', ids)).toBe('qr');
    expect(routeFromHash('#/obrazy', ids)).toBe('obrazy');
  });

  it('pusty i nieznany adres to menu główne', () => {
    expect(routeFromHash('', ids)).toBe(HOME);
    expect(routeFromHash('#', ids)).toBe(HOME);
    expect(routeFromHash('#menu', ids)).toBe(HOME);
    expect(routeFromHash('#nie-ma-takiego', ids)).toBe(HOME);
  });
});

describe('useHashRoute', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    window.location.hash = '';
  });
  afterEach(() => {
    window.location.hash = '';
  });

  it('zaczyna od menu głównego, gdy adres jest pusty', () => {
    const { result } = renderHook(() => useHashRoute(ids));
    expect(result.current).toBe(HOME);
  });

  it('przechodzi do narzędzia po zmianie adresu i wraca na górę strony', () => {
    const { result } = renderHook(() => useHashRoute(ids));
    act(() => {
      window.location.hash = '#qr';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current).toBe('qr');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    act(() => {
      window.location.hash = '#menu';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current).toBe(HOME);
  });

  it('od razu otwiera narzędzie z adresu wpisanego w pasek', () => {
    window.location.hash = '#obrazy';
    const { result } = renderHook(() => useHashRoute(ids));
    expect(result.current).toBe('obrazy');
  });
});
