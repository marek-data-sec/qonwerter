import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DropZone, FileList, ToolLayout } from '../components/ui';

const plik = (nazwa: string, typ: string) => new File(['x'], nazwa, { type: typ });

describe('DropZone', () => {
  it('przyjmuje tylko pliki pasujące do accept (upuszczenie)', () => {
    const onFiles = vi.fn();
    render(<DropZone accept="image/*" onFiles={onFiles} hint="obrazy" />);
    const strefa = screen.getByRole('button');
    fireEvent.drop(strefa, {
      dataTransfer: { files: [plik('a.png', 'image/png'), plik('b.pdf', 'application/pdf')] }
    });
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.png']);
  });

  it('rozpoznaje PDF po rozszerzeniu, nawet bez typu MIME', () => {
    const onFiles = vi.fn();
    render(<DropZone accept=".pdf,application/pdf" onFiles={onFiles} hint="pdf" />);
    fireEvent.drop(screen.getByRole('button'), { dataTransfer: { files: [plik('skan.PDF', '')] } });
    expect(onFiles).toHaveBeenCalledTimes(1);
  });

  it('w trybie pojedynczego pliku bierze tylko pierwszy', () => {
    const onFiles = vi.fn();
    render(<DropZone accept=".pdf" multiple={false} onFiles={onFiles} hint="pdf" />);
    fireEvent.drop(screen.getByRole('button'), {
      dataTransfer: { files: [plik('a.pdf', 'application/pdf'), plik('b.pdf', 'application/pdf')] }
    });
    expect(onFiles.mock.calls[0][0]).toHaveLength(1);
  });

  it('nie wywołuje onFiles, gdy nic nie pasuje', () => {
    const onFiles = vi.fn();
    render(<DropZone accept="image/*" onFiles={onFiles} hint="obrazy" />);
    fireEvent.drop(screen.getByRole('button'), { dataTransfer: { files: [plik('a.txt', 'text/plain')] } });
    expect(onFiles).not.toHaveBeenCalled();
  });
});

describe('FileList', () => {
  const pliki = [plik('a.pdf', 'application/pdf'), plik('b.pdf', 'application/pdf')];

  it('przesuwa i usuwa pozycje', () => {
    const onMove = vi.fn();
    const onRemove = vi.fn();
    render(<FileList files={pliki} reorder onMove={onMove} onRemove={onRemove} onClear={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Przesuń w dół' })[0]);
    expect(onMove).toHaveBeenCalledWith(0, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Usuń b.pdf' }));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('pierwszy element nie ma aktywnej strzałki w górę, ostatni w dół', () => {
    render(<FileList files={pliki} reorder onMove={() => {}} onRemove={() => {}} onClear={() => {}} />);
    expect(screen.getAllByRole('button', { name: 'Przesuń w górę' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Przesuń w dół' })[1]).toBeDisabled();
  });

  it('nic nie renderuje przy pustej liście', () => {
    const { container } = render(<FileList files={[]} onRemove={() => {}} onClear={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ToolLayout', () => {
  // Bez zdefiniowanej kolumny na telefonie przeglądarka rozciąga siatkę do szerokości najdłuższej
  // nazwy pliku i cała strona wychodzi poza ekran (przyciski w prawym rogu wierszy stają się niedostępne).
  it('na telefonie ma kolumnę, która może się zwęzić poniżej szerokości zawartości', () => {
    const { container } = render(
      <ToolLayout title="t" lead="l" input={<p>a</p>} settings={<p>b</p>} output={null} />
    );
    const siatka = container.querySelector('.grid') as HTMLElement;
    expect(siatka.className).toContain('grid-cols-[minmax(0,1fr)]');
    for (const dziecko of Array.from(siatka.children))
      expect((dziecko as HTMLElement).className).toContain('min-w-0');
  });
});
