# Polityka bezpieczeństwa

## Zakres

To narzędzie to statyczna aplikacja frontendowa (React + Vite), bez backendu i bez zbierania danych
osobowych. Pliki wybrane przez użytkownika są przetwarzane wyłącznie w jego przeglądarce i nigdzie nie
są wysyłane, a w `localStorage` zapisują się tylko ustawienia narzędzi, patrz
[README](./README.md#co-jest-w-środku). Mimo to, jak każde oprogramowanie, może zawierać błędy
wpływające na bezpieczeństwo (np. podatność w zależności, błąd w obsłudze pliku, XSS).

## Jak zgłosić podatność

**Nie zgłaszaj podatności bezpieczeństwa jako publiczne issue.**

Użyj prywatnego zgłoszenia na GitHubie: zakładka **Security → Report a vulnerability** w tym repozytorium.

W zgłoszeniu podaj w miarę możliwości:

- opis podatności i jej potencjalny wpływ,
- kroki do odtworzenia (jeśli chodzi o konkretny plik, opisz jego rodzaj, nie dołączaj poufnych dokumentów),
- wersję aplikacji (widoczna w stopce, np. `v1.0.0`) i przeglądarkę,
- czy podatność dotyczy samego kodu, czy jednej z zależności (`package.json`).

## Czego się spodziewać

Ten projekt jest utrzymywany niekomercyjnie, bez formalnego zespołu bezpieczeństwa ani gwarantowanego
SLA. Postaram się potwierdzić otrzymanie zgłoszenia i ocenić jego zasadność, ale czas reakcji nie jest
gwarantowany. Odpowiedzialne ujawnienie (ang. *responsible disclosure*, czyli danie czasu na poprawkę
przed publicznym ujawnieniem szczegółów) jest bardzo mile widziane.

## Co aplikacja robi po swojej stronie

- Restrykcyjny CSP wpisywany do strony przy buildzie (`scripts/postbuild.mjs`): `default-src 'none'`,
  skrypt dopuszczony tylko przez hash, `connect-src` wyłącznie `data:` i `blob:`. Aplikacja nie ładuje
  zewnętrznych zasobów, w tym czcionek, i nie ma jak wysłać danych w sieć.
- pdf.js działa z wyłączonym `eval`, a worker jest dołączony jako blob.
- Zbyt duże obrazy i strony PDF są odrzucane albo zmniejszane, zamiast wyczerpywać pamięć przeglądarki.
- Błąd renderowania nie kończy się białą stroną, a uszkodzone ustawienia można wyczyścić jednym przyciskiem.

## Zależności i znane podatności

`npm audit` jest sprawdzany przy każdym Pull Requeście (poziom `high` dla zależności produkcyjnych
blokuje CI), a Dependabot co tydzień zgłasza aktualizacje. Zależności produkcyjne, czyli to, co trafia
do przeglądarki użytkownika, to React, pdf.js, pdf-lib, fflate, lucide-react i czcionki. Pozostałe pakiety
to narzędzia deweloperskie (budowanie, testy, lint) i nie są częścią wysyłanej aplikacji. W `package.json`
jest jedno `overrides` (`minimatch` ^11) łatające lukę w narzędziach do lintowania, jego uzasadnienie jest
w README.

## Zasięg tego dokumentu

Ta polityka dotyczy wyłącznie kodu aplikacji. To nie jest kanał do zgłaszania incydentów
bezpieczeństwa w Twoim przedsiębiorstwie.
