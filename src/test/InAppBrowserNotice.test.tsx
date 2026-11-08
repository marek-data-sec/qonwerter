import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InAppBrowserNotice } from '../components/ui';

const MESSENGER =
  'Mozilla/5.0 (Linux; Android 13; SM-A536B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 [FB_IAB/MESSENGER;FBAV/460.0.0.0;]';
const CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function ustawUA(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'userAgent');
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('InAppBrowserNotice', () => {
  it('nic nie pokazuje w zwykłej przeglądarce', () => {
    ustawUA(CHROME);
    const { container } = render(<InAppBrowserNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('w Messengerze mówi, że pobieranie może nie działać i co zrobić', () => {
    ustawUA(MESSENGER);
    render(<InAppBrowserNotice />);
    expect(screen.getByText('Pobieranie plików może tu nie działać')).toBeInTheDocument();
    expect(screen.getByText(/Otwórz w przeglądarce/)).toBeInTheDocument();
  });

  it('wersja zwięzła jest krótsza i nie podaje instrukcji menu', () => {
    ustawUA(MESSENGER);
    render(<InAppBrowserNotice compact />);
    expect(screen.getByText(/zwykle blokuje pobieranie/)).toBeInTheDocument();
    expect(screen.queryByText(/Otwórz w Chrome”/)).not.toBeInTheDocument();
  });

  it('kopiuje adres strony bez części po #', async () => {
    ustawUA(MESSENGER);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<InAppBrowserNotice />);
    fireEvent.click(screen.getByRole('button', { name: 'Skopiuj adres strony' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Skopiowano' })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(expect.not.stringContaining('#'));
  });

  it('gdy schowek jest niedostępny, pokazuje adres do ręcznego skopiowania', async () => {
    ustawUA(MESSENGER);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('x')) },
      configurable: true
    });
    render(<InAppBrowserNotice />);
    fireEvent.click(screen.getByRole('button', { name: 'Skopiuj adres strony' }));
    await waitFor(() => expect(document.querySelector('.select-all')).not.toBeNull());
    expect(document.querySelector('.select-all')?.textContent).toBe(location.href.split('#')[0]);
  });
});
