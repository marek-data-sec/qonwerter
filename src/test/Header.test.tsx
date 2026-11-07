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
