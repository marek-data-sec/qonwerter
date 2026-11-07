// Łamanie wierszy po polsku: jednoliterowy spójnik (w, z, i, o, u, a) nie zostaje na końcu
// linii, a pierwsze słowo zdania nie ląduje samo na końcu wiersza. Wstawiamy twarde spacje.
const NBSP = '\u00A0';

// dwa przebiegi, bo dwa spójniki obok siebie ("i z") współdzielą spację i jeden przebieg łapie tylko pierwszy
const JEDNOLITEROWE = /(^|[\s(„])([aAiIoOuUwWzZ]) /g;

export function sklejKrotkie(tekst: string): string {
  return tekst
    .replace(JEDNOLITEROWE, `$1$2${NBSP}`)
    .replace(JEDNOLITEROWE, `$1$2${NBSP}`)
    .replace(/([.!?]) ([A-ZĄĆĘŁŃÓŚŹŻ][^\s]*) /g, `$1 $2${NBSP}`);
}
