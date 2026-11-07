import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

function Wybucha(): JSX.Element {
  throw new Error('testowy wyjątek');
}

describe('ErrorBoundary', () => {
  it('pokazuje komunikat zamiast białej strony', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Wybucha />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('testowy wyjątek')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wyczyść dane lokalne' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renderuje dzieci, gdy nic się nie psuje', () => {
    render(
      <ErrorBoundary>
        <p>wszystko gra</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('wszystko gra')).toBeInTheDocument();
  });
});
