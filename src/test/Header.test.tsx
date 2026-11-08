import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Image as ImageIcon, Files } from 'lucide-react';
import Header from '../components/Header';
import ChangelogModal from '../components/ChangelogModal';
import { APP_VERSION, ZIP_NAME } from '../utils/appMeta';

const narzedzia = [
  { id: 'obrazy', label: 'Obrazy', icon: ImageIcon },
  { id: 'pdf', label: 'Narzędzia PDF', icon: Files }
];

describe('Header', () => {
  it('oznacza aktywne narzędzie i linkuje do hasha', () => {
    render(<Header tools={narzedzia} active="pdf" />);
    const link = screen.getByRole('link', { name: 'Narzędzia PDF' });
    expect(link).toHaveAttribute('href', '#pdf');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Obrazy' })).not.toHaveAttribute('aria-current');
  });

  it('pokazuje link do wersji offline (ZIP) także w trybie deweloperskim, a w wersji z dysku go nie ma', () => {
    render(<Header tools={narzedzia} active="obrazy" />);
    expect(screen.getByRole('link', { name: /wersja na windows/i })).toHaveAttribute('href', `./${ZIP_NAME}`);
  });

  it('otwiera i zamyka menu na wąskim ekranie', () => {
    render(<Header tools={narzedzia} active="obrazy" />);
    expect(screen.queryByRole('navigation', { name: 'Narzędzia (menu)' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('navigation', { name: 'Narzędzia (menu)' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('link', { name: 'Obrazy' })[1]);
    expect(screen.queryByRole('navigation', { name: 'Narzędzia (menu)' })).not.toBeInTheDocument();
  });

  it('logo prowadzi do menu głównego i jest oznaczone jako bieżąca strona na menu', () => {
    const { rerender } = render(<Header tools={narzedzia} active="obrazy" />);
    const logo = screen.getByRole('link', { name: /Qonwerter/ });
    expect(logo).toHaveAttribute('href', '#menu');
    expect(logo).not.toHaveAttribute('aria-current');
    rerender(<Header tools={narzedzia} active="menu" />);
    expect(screen.getByRole('link', { name: /Qonwerter/ })).toHaveAttribute('aria-current', 'page');
  });

  it('rozwijane menu na telefonie zaczyna się od pozycji „Menu główne”', () => {
    render(<Header tools={narzedzia} active="obrazy" />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const nav = screen.getByRole('navigation', { name: 'Narzędzia (menu)' });
    const linki = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
    expect(linki[0]).toBe('Menu główne');
    expect(nav.querySelector('a')).toHaveAttribute('href', '#menu');
  });
});

describe('ChangelogModal', () => {
  it('pokazuje numer wersji i otwiera historię zmian', () => {
    render(<ChangelogModal />);
    fireEvent.click(screen.getByRole('button', { name: `v${APP_VERSION}` }));
    expect(screen.getByText('Historia zmian')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Zamknij historię zmian' }));
    expect(screen.queryByText('Historia zmian')).not.toBeInTheDocument();
  });
});
