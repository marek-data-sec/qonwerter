import { describe, it, expect } from 'vitest';
import { sklejKrotkie } from '../utils/typografia';

const NBSP = '\u00A0';

describe('sklejKrotkie', () => {
  it('skleja jednoliterowe spójniki z następnym słowem', () => {
    expect(sklejKrotkie('Jest oceniana w module ISO i z rozdziałów normy')).toBe(
      `Jest oceniana w${NBSP}module ISO i${NBSP}z${NBSP}rozdziałów normy`
    );
  });

  it('skleja pierwsze słowo nowego zdania z następnym', () => {
    expect(sklejKrotkie('Jest oceniana osobno. Wynik pokazuje, ile wymagań jest spełnionych.')).toBe(
      `Jest oceniana osobno. Wynik${NBSP}pokazuje, ile wymagań jest spełnionych.`
    );
  });

  it('działa na fragmencie zaczynającym się od kropki', () => {
    expect(sklejKrotkie('. Wynik pokazuje, ile wymagań jest spełnionych.')).toBe(
      `. Wynik${NBSP}pokazuje, ile wymagań jest spełnionych.`
    );
  });

  it('nie skleja skrótu z małą literą po kropce, np. „tys. mieszkańców”', () => {
    expect(sklejKrotkie('Próg 500 tys. mieszkańców lub RLM')).toBe('Próg 500 tys. mieszkańców lub RLM');
  });

  it('nie rusza zwykłych dłuższych słów i jest idempotentne', () => {
    const tekst = 'Zwykłe zdanie bez krótkich spójników';
    expect(sklejKrotkie(tekst)).toBe(tekst);
    const raz = sklejKrotkie('Ocena w module. Wynik pokazuje to.');
    expect(sklejKrotkie(raz)).toBe(raz);
  });
});
