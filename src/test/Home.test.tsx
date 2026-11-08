import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Image as ImageIcon, QrCode } from 'lucide-react';
import Home from '../components/Home';

const items = [
  { id: 'obrazy', label: 'Obrazy', description: 'Zamień obrazy na inne formaty.', icon: ImageIcon },
  { id: 'qr', label: 'Kody QR', description: 'Zrób kod QR z własnym logo.', icon: QrCode }
];

describe('Home', () => {
  it('ma nagłówek i krótki opis aplikacji', () => {
    render(<Home items={items} />);
    expect(screen.getByRole('heading', { name: 'Menu główne' })).toBeInTheDocument();
    expect(screen.getByText(/nie trafiają na żaden serwer/)).toBeInTheDocument();
  });

  it('pokazuje każde narzędzie jako link z opisem, prowadzący pod właściwy adres', () => {
    render(<Home items={items} />);
    const obrazy = screen.getByRole('link', { name: /Obrazy/ });
    expect(obrazy).toHaveAttribute('href', '#obrazy');
    expect(obrazy).toHaveTextContent('Zamień obrazy na inne formaty.');
    expect(screen.getByRole('link', { name: /Kody QR/ })).toHaveAttribute('href', '#qr');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
