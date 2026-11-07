import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PageBoard, { type PageItem } from '../components/PageBoard';

const settings = { pageSize: 'a4', orientation: 'auto', margin: 10 } as const;
const items: PageItem[] = ['a.png', 'b.png', 'c.png'].map((name, i) => ({
  id: String(i),
  file: new File(['x'], name, { type: 'image/png' }),
  rotation: 0
}));

function setup(view: 'kafelki' | 'lista' = 'kafelki', list = items) {
  const h = {
    onView: vi.fn(),
    onMove: vi.fn(),
    onRemove: vi.fn(),
    onRotate: vi.fn(),
    onSortName: vi.fn(),
    onReverse: vi.fn(),
    onClear: vi.fn()
  };
  render(<PageBoard items={list} settings={settings} view={view} {...h} />);
  return h;
}

describe('PageBoard', () => {
  it('nic nie renderuje przy pustej liście', () => {
    const { container } = render(
      <PageBoard
        items={[]}
        settings={settings}
        view="kafelki"
        onView={() => {}}
        onMove={() => {}}
        onRemove={() => {}}
        onRotate={() => {}}
        onSortName={() => {}}
        onReverse={() => {}}
        onClear={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('pokazuje kafelek dla każdej strony z numerem i nazwą pliku', () => {
    setup();
    expect(screen.getByText('1. a.png')).toBeInTheDocument();
    expect(screen.getByText('3. c.png')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('przyciski przesuwają, obracają i usuwają właściwą stronę', () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Przesuń stronę 1 później' }));
    expect(h.onMove).toHaveBeenCalledWith(0, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Obróć stronę 2 w prawo' }));
    expect(h.onRotate).toHaveBeenCalledWith(1, 90);
    fireEvent.click(screen.getByRole('button', { name: 'Obróć stronę 3 w lewo' }));
    expect(h.onRotate).toHaveBeenCalledWith(2, -90);
    fireEvent.click(screen.getByRole('button', { name: 'Usuń stronę 2' }));
    expect(h.onRemove).toHaveBeenCalledWith(1);
  });

  it('pierwsza strona nie da się przesunąć wcześniej, a ostatnia później', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Przesuń stronę 1 wcześniej' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Przesuń stronę 3 później' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Przesuń stronę 2 wcześniej' })).toBeEnabled();
  });

  it('przełącza widok i oznacza aktywny', () => {
    const h = setup('kafelki');
    expect(screen.getByRole('button', { name: 'Kafelki' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Lista' }));
    expect(h.onView).toHaveBeenCalledWith('lista');
  });

  it('w widoku listy pokazuje wiersze z obrotem i tymi samymi akcjami', () => {
    const rotated = items.map((it, i) => (i === 1 ? { ...it, rotation: 90 } : it));
    const h = setup('lista', rotated);
    expect(screen.getByText(/obrót 90°/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Przesuń stronę 2 później' }));
    expect(h.onMove).toHaveBeenCalledWith(1, 2);
  });

  it('sortuje, odwraca i czyści listę', () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Sortuj według nazwy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Odwróć kolejność' }));
    fireEvent.click(screen.getByRole('button', { name: 'wyczyść listę' }));
    expect(h.onSortName).toHaveBeenCalledTimes(1);
    expect(h.onReverse).toHaveBeenCalledTimes(1);
    expect(h.onClear).toHaveBeenCalledTimes(1);
  });
});
