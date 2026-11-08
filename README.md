# Qonwerter

Zestaw narzędzi do plików, który działa w całości w przeglądarce: konwersja obrazów, praca z PDF i generator
kodów QR z własnym logo. Nie ma backendu, pliki nie są nigdzie wysyłane, a sama aplikacja nie łączy się
z żadnym zewnętrznym serwisem.

Można ją otworzyć online na GitHub Pages albo pobrać jako ZIP i uruchomić na Windowsie, bez internetu
i bez instalacji.

## Nazwa aplikacji

Nazwa, podtytuł i identyfikator (z którego powstają nazwy plików) są w jednym miejscu, w pliku
`app.config.json`:

```json
{ "name": "Qonwerter", "slug": "qonwerter", "tagline": "konwersja obrazów, PDF i kody QR" }
```

Z `slug` powstają `qonwerter.html` i `qonwerter-offline.zip`. Przy zmianie nazwy ustaw ten sam
`slug` w polu `name` w `package.json` (pilnuje tego test `appVersion.test.ts`), a zmienioną nazwę repozytorium
na GitHubie wpisz w adresie Pages. Tytuł karty, nagłówek, pliki ZIP i `Uruchom.bat` przejmą ją same.

## Co jest w środku

Po wejściu na stronę widać menu główne (`#menu`): krótki opis aplikacji i pięć kart, z których każda prowadzi
do osobnego narzędzia. Do menu wraca się klikając logo w nagłówku albo link „← Menu główne” nad tytułem
narzędzia, a na telefonie jest też pierwszą pozycją rozwijanego menu. Wybór widoku zapisuje się w adresie
(`#obrazy`, `#obrazy-pdf`, `#pdf-obrazy`, `#pdf`, `#qr`), więc działa tak samo na GitHub Pages i z pliku na
dysku, bez konfiguracji serwera. Pusty lub nieznany adres otwiera menu. Przełączenie widoku nie kasuje listy
wgranych plików.

**Obrazy** (`#obrazy`) - konwersja wielu plików naraz między PNG, JPG i WebP. Jakość (dla JPG i WebP),
maksymalny dłuższy bok w pikselach (obrazy nigdy nie są powiększane) i kolor tła dla przezroczystości,
bo JPG jej nie ma. Wejście to także GIF, BMP, SVG i AVIF, jeśli czyta go przeglądarka. Przy każdym wyniku
widać rozmiar przed i po, a całość pobiera się jednym ZIP-em.

**Obrazy → PDF** (`#obrazy-pdf`) - jeden PDF z kilku obrazów. Strony widać jako kafelki, a każdy z nich to
mini-strona w proporcjach wybranego formatu z obrazem ułożonym dokładnie tak, jak trafi do pliku (podgląd
i PDF liczą układ z tego samego kodu, `utils/pdfLayout.ts`). Kafelki przeciąga się myszą lub palcem (na
telefonie za uchwyt w rogu, żeby przewijanie strony nadal działało), a Escape anuluje przeciąganie. Zamiast
przeciągania są też przyciski ze strzałkami, więc da się to zrobić z klawiatury. Każdą stronę można obrócić
o 90° w lewo lub w prawo (skany i zdjęcia leżące bokiem), listę posortować według nazwy (IMG_2 przed IMG_10)
albo odwrócić. Dostępny jest też widok listy, a wybór widoku zapamiętuje się razem z ustawieniami. Strona
A4, Letter albo dopasowana do obrazu, orientacja automatyczna lub wymuszona, margines 0-20 mm. Zdjęcia JPG
trafiają do PDF jako JPG o wybranej jakości, reszta idzie bezstratnie jako PNG, żeby nie tracić
przezroczystości. Zdjęcia z telefonu są obracane zgodnie z EXIF. Limit boku obrazu mocno odchudza PDF ze
skanów.

**PDF → obrazy** (`#pdf-obrazy`) - strony PDF jako PNG, JPG albo WebP. Zakres stron w zapisie
`1-3, 5, 8-` (puste pole to wszystkie), rozdzielczość od 72 do 300 dpi. PDF chroniony hasłem prosi
o hasło zamiast wywalać błąd. Strony bardzo duże są zmniejszane do bezpiecznego rozmiaru, żeby nie
wyczerpać pamięci karty graficznej. Wynik jako pojedyncze pliki albo ZIP.

**Narzędzia PDF** (`#pdf`) - trzy operacje na dokumentach: scalanie kilku plików w jeden (kolejność jak
na liście), wyodrębnianie wybranych stron (kolejność z zakresu jest zachowana, więc `3, 1` daje
najpierw trzecią stronę) i rozdzielanie na pojedyncze strony w jednym ZIP-ie. Zaszyfrowane pliki są
odrzucane z czytelnym komunikatem.

**Kody QR** (`#qr`) - kod z dowolnego tekstu lub adresu, z opcjonalnym własnym logo (np. firmy). Kod rysuje się
na żywo. Ustawia się kolor kodu i tła, rozmiar obrazu (512, 1024 lub 2048 px), szerokość białej ramki i rozmiar
logo (10-30% boku kodu) z podkładką w kolorze tła. Pobiera się go jako PNG albo jako wektorowy SVG do druku
(kod jako jedna ścieżka, logo osadzone w pliku). Polskie litery są kodowane jako UTF-8. Z logo aplikacja używa
najwyższej korekcji błędów (H), co pozwala odtworzyć do ok. 30% kodu, ale zmniejsza maksymalną długość tekstu
(ok. 1270 bajtów zamiast ok. 2330 bez logo). Kod zawiera dokładnie wpisany tekst, bez przekierowań przez
zewnętrzny serwis, więc nie wygasa i nikt nie liczy skanów. Po każdej zmianie aplikacja próbuje odczytać
własny kod i pokazuje wynik, a przy odwróconych kolorach lub słabym kontraście ostrzega. Ten test pomaga, ale
nie zastępuje sprawdzenia telefonem przed drukiem. Logo nie jest zapamiętywane, po odświeżeniu strony trzeba je
dodać ponownie.

**Ustawienia trzymane tylko lokalnie.** Format, jakość, rozmiar strony itd. zapamiętują się w `localStorage`
pod kluczami `plik.*`, osobno dla każdego narzędzia. Same pliki nie są nigdzie zapisywane i znikają po
odświeżeniu strony. Uszkodzony zapis nie psuje działania, a błąd renderowania pokazuje komunikat
z przyciskiem "Wyczyść dane lokalne" zamiast białej strony.

**Wersja na Windows.** Na stronie jest przycisk "Wersja na Windows" w prawym górnym rogu nagłówka. Pobiera ZIP
z jednym plikiem HTML, `Uruchom.bat` i krótką instrukcją. Po wypakowaniu wystarczy dwukrotnie kliknąć
`Uruchom.bat` albo sam plik HTML, a aplikacja otworzy się w domyślnej przeglądarce. Nie trzeba niczego
instalować ani mieć uprawnień administratora. Plik można skopiować na pendrive'a albo udostępnić w sieci
lokalnej. Wersja z dysku nie pokazuje już linku do pobrania.

Dodatkowo: zwijany pasek z informacją, że pliki nie są nigdzie wysyłane, klikalny numer wersji z historią zmian w stopce, link "Przejdź do treści" dla klawiatury
i ukrywanie elementów nawigacji przy wydruku.

Konwersja zależy od przeglądarki. Zapis do WebP nie działa w starszym Safari, a HEIC z iPhone'ów nie jest
obsługiwany przez większość przeglądarek. Aplikacja zgłasza to komunikatem przy konkretnym pliku, a pozostałe
pliki konwertuje dalej. PDF z niestandardowymi czcionkami (zwłaszcza CJK) może w wersji offline
renderować się bez części znaków, bo mapy znaków pdf.js nie są dołączone.

Przeglądarki wbudowane w aplikacje (Messenger, Facebook, Instagram i podobne) zwykle nie obsługują pobierania
plików: przycisk się klika, ale nic się nie zapisuje. Aplikacja rozpoznaje je po identyfikatorze przeglądarki
i pokazuje podpowiedź, żeby otworzyć stronę w Chrome albo innej zwykłej przeglądarce (u góry strony, nad listą
wyników i przy przyciskach kodu QR). Rozpoznawanie jest zgadywaniem po nazwie, więc czasem może się pomylić
w obie strony.

## Uruchomienie lokalne

Wymagania: Node.js 20.19+, 22.13+ albo 24+ (CI używa 22). Pilnuje tego pole `engines` w `package.json`, więc
przy starszym Node `npm install` ostrzeże od razu.

```bash
npm install
npm run dev
```

Domyślnie pod http://localhost:5173. Link „Wersja na Windows” jest widoczny także tutaj. ZIP powstaje dopiero
przy `npm run build`, więc serwer deweloperski wydaje go z katalogu `dist/`. Jeśli jeszcze nie budowałeś
aplikacji, link zwróci komunikat 404 z podpowiedzią (bez tego przeglądarka pobrałaby stronę startową
udającą ZIP-a). Pobrany plik ma więc zawartość dopiero po `npm run build`.

```bash
npm run build      # dist/index.html i dist/qonwerter-offline.zip
npm run preview    # podgląd builda lokalnie
npm run lint
```

Wynik buildu to jeden plik `index.html` (ok. 3 MB, bo zawiera silnik PDF i czcionki) oraz ZIP obok niego.
Zwykłe moduły ES nie działają po otwarciu z dysku (`file://`), a ten sam plik ma działać i na GitHub
Pages, i po dwukliku, dlatego wszystko jest wbudowane w jeden plik (`vite-plugin-singlefile`), a worker
pdf.js jest dołączony jako blob. Po buildzie `scripts/postbuild.mjs` wpisuje do strony politykę CSP
z hashem skryptu i pakuje ZIP.

## Testy

Vitest + Testing Library, katalog `src/test/`, około 90 testów. Trzy warstwy:

1. **Logika** (`format`, `typografia`, `usePersistentState`, `storage`, `qr`, `env`, `useHashRoute`) - parser zakresów stron, nazwy
   plików bez kolizji w ZIP-ie, kodowanie polskich liter w kodzie QR, układ strony PDF, limity długości tekstu, zgodność SVG
   z macierzą kodu, ostrzeżenia o kolorach, rozpoznawanie przeglądarek wbudowanych w aplikacje (na prawdziwych identyfikatorach
   Messengera, Facebooka i zwykłych przeglądarek), wybór widoku z adresu, zapamiętywanie ustawień (w tym uszkodzony JSON i stary zapis bez nowych
   pól), czyszczenie tylko własnych kluczy. `appVersion.test.ts` pilnuje, żeby wersja w `package.json`
   zgadzała się z `appMeta.ts`.
2. **Komponenty** (`ui`, `Header`, `Home`, `PageBoard`, `InAppBrowserNotice`, `ErrorBoundary`, `ChangelogModal`) - strefa upuszczania plików
   (filtr po typie i rozszerzeniu), lista plików ze zmianą kolejności, menu na wąskim ekranie, link do ZIP-a.

3. **Prywatność** (`privacy.test.ts`) - pilnuje deklaracji z interfejsu. Kod w `src/` nie może zawierać
   zapytań sieciowych (`fetch`, `XMLHttpRequest`, `WebSocket` itd.), ciasteczek, IndexedDB, sessionStorage
   ani service workerów, a `localStorage` wolno dotykać tylko dwóm plikom i nie dostają w nim miejsca pliki,
   tylko ustawienia. Dodatkowo `scripts/postbuild.mjs` przerywa build, gdy w HTML pojawi się zewnętrzny
   skrypt, styl, obraz albo ramka. Jeśli któryś z tych testów zaczyna się wywalać, najpierw zmień
   deklarację (pasek, stopka, README, SECURITY.md), a dopiero potem test.

Samej konwersji (canvas, worker pdf.js, pdf-lib) testy jednostkowe nie obejmują, bo jsdom tego nie
implementuje. Te ścieżki sprawdza się ręcznie w przeglądarce, najlepiej także z otwartego z dysku pliku
HTML. Jeśli test nagle przestaje działać przy komponencie z miniaturą, to przyczyną jest brak
`URL.createObjectURL` w jsdom. Testy `FileList` używają dlatego wersji bez `thumbs`.

```bash
npm test              # jednorazowo
npm run test:watch    # watch
npm run test:coverage # z pokryciem (HTML w coverage/index.html)
```

## Publikacja na GitHub Pages

Repozytorium ma być publiczne, a strona wdraża się z workflow `Pages`:

1. Wgraj repo na GitHub (gałąź `main`).
2. W **Settings → Pages** ustaw **Source: GitHub Actions**.
3. Każdy kolejny push do `main` uruchamia lint, testy i build, a potem publikuje stronę razem
   z `qonwerter-offline.zip`. Link "Wersja na Windows" prowadzi do tego pliku względną ścieżką,
   więc działa pod adresem `https://<login>.github.io/<nazwa-repo>/` bez żadnej konfiguracji.

Adres do repozytorium w nagłówku (ikona GitHuba) bierze się ze zmiennej `GITHUB_REPOSITORY`, więc
pojawia się tylko na buildzie z Actions, lokalnie jest ukryty.

## Struktura projektu

```
qonwerter/
├── app.config.json                ← nazwa aplikacji i identyfikator plików (jedno miejsce)
├── index.html                     ← szkielet strony (znacznik __CSP__ podmienia postbuild)
├── vite.config.ts                 ← single file, base './'
├── eslint.config.js
├── scripts/
│   └── postbuild.mjs              ← CSP z hashem skryptu, ZIP z Uruchom.bat
├── .github/workflows/             ← ci (PR), pages (push do main), release (tag v*)
├── src/
│   ├── tools/                     ← pięć narzędzi
│   │   ├── ImageConverter.tsx         ← obrazy → obrazy
│   │   ├── ImagesToPdf.tsx            ← obrazy → PDF (pdf-lib)
│   │   ├── PdfToImages.tsx            ← PDF → obrazy (pdf.js)
│   │   ├── PdfTools.tsx               ← scalanie, wyodrębnianie, rozdzielanie
│   │   └── QrCode.tsx                 ← kody QR z logo, podgląd na żywo, PNG i SVG
│   ├── components/                nagłówek, Home (menu główne), DisclaimerBar, ChangelogModal, ErrorBoundary,
│   │                              PageBoard.tsx (kafelki stron z przeciąganiem, widok listy),
│   │                              ui.tsx (DropZone, FileList, ResultList, ToolLayout, pola formularza)
│   ├── utils/
│   │   ├── image.ts                   ← wczytanie, skalowanie i zapis przez canvas
│   │   ├── pdf.ts                     ← pdf.js, worker jako blob, renderowanie stron
│   │   ├── env.ts                     ← rozpoznawanie przeglądarek wbudowanych w aplikacje
│   │   ├── pdfLayout.ts               ← układ strony PDF (wspólny dla podglądu i pliku)
│   │   ├── qr.ts                      ← macierz kodu, rysowanie, eksport SVG, test odczytu
│   │   ├── download.ts                ← zapis pliku i ZIP (fflate)
│   │   ├── format.ts                  ← rozmiary, nazwy bez kolizji, parser zakresu stron
│   │   ├── usePersistentState.ts, useHashRoute.ts, storage.ts, typografia.ts, appMeta.ts
│   ├── test/                      testy (Vitest)
│   ├── App.tsx                    zakładki na hashu, ErrorBoundary, stopka
│   └── main.tsx
└── package.json
```

## Wersja i changelog

`src/utils/appMeta.ts` zawiera `APP_VERSION` i `CHANGELOG`. Wersja jest w trzech miejscach:
`package.json` (+ `package-lock.json`), `APP_VERSION` i najnowszy wpis `CHANGELOG`. Test
`appVersion.test.ts` wywali się, jeśli któreś się rozjedzie. Changelog jest dla użytkownika, więc wpisy są
krótkie i bez szczegółów technicznych.

## Wydawanie nowej wersji

Zmiany robisz na osobnej gałęzi, a `main` jest tylko do mergowania, bo każdy push do `main` wdraża
stronę na GitHub Pages. Przykład dla 1.0.1:

1. `git checkout main && git pull && git checkout -b wersja-1.0.1`
2. `npm version 1.0.1 --no-git-tag-version`
3. W `appMeta.ts` ustaw `APP_VERSION` i dopisz wpis na górze `CHANGELOG`.
4. Sprawdź lokalnie to samo, co robi CI: `npm ci && npm run lint && npm test && npm run build`
5. `git add . && git commit -m "Wersja 1.0.1: krótki opis" && git push -u origin wersja-1.0.1`
6. Na GitHubie otwórz Pull Request do `main`. Workflow `CI` odpali lint, testy i build. Po zielonym
   znaczku zmerguj, a strona zaktualizuje się po 1-2 minutach.
7. Oznacz wydanie: `git checkout main && git pull && git tag -a v1.0.1 -m "Wersja 1.0.1" &&
   git push origin v1.0.1`. Workflow `Release` sam utworzy Release z wygenerowanymi notatkami
   i dołączy `qonwerter-offline.zip`.
8. Na działającej stronie sprawdź numer wersji w stopce.

Zmiana samych poprawek to trzeci człon (1.0.0 → 1.0.1), nowe narzędzie albo nowy format to drugi (1.1.0).

## Bezpieczeństwo tego projektu

Aplikacja nie ma backendu ani sekretów, więc większość pracy to ograniczenie tego, co w ogóle może zrobić
kod w przeglądarce:

- [`SECURITY.md`](./SECURITY.md) z zasadami zgłaszania podatności (przez prywatne zgłoszenie na GitHubie),
- restrykcyjny CSP wpisywany przy buildzie: `default-src 'none'`, skrypt dopuszczony tylko przez hash,
  `connect-src` wyłącznie `data:` i `blob:`, czyli aplikacja nie ma jak wysłać niczego w sieć,
- brak zewnętrznych zasobów, w tym czcionek (idą z `@fontsource`, wbudowane w plik),
- pdf.js ma wyłączone `eval` (`isEvalSupported: false`),
- zależności: `npm audit` jest czysty (także dla narzędzi deweloperskich), a Dependabot co tydzień proponuje
  aktualizacje. W `package.json` jest jedno `overrides` (`minimatch` ^11) wymuszające wersję z łatką na lukę
  w narzędziach do lintowania. Można je usunąć, gdy ESLint i typescript-eslint same podniosą tę zależność,
  a `npm run lint` i `npm audit` pokażą, czy nadal wszystko gra,
- pliki są czytane do pamięci przeglądarki i nigdzie nie są zapisywane, a adresy `blob:` są zwalniane po
  użyciu.

Nie ma pliku `security.txt`, bo strona stoi pod adresem projektu (`/<nazwa-repo>/`), a RFC 9116 wymaga
go w korzeniu domeny.

## Zastrzeżenie

Narzędzie ma charakter pomocniczy. Konwersja do JPG i WebP jest stratna, a przy zamianie PDF na obrazy
tekst przestaje być tekstem (nie da się go zaznaczyć ani przeszukać). Wynik zawsze warto obejrzeć przed
użyciem, a oryginały zachować. Kod QR przed drukiem lub publikacją zawsze sprawdź telefonem, najlepiej
kilkoma różnymi, bo test odczytu w aplikacji nie odzwierciedla każdego czytnika. „QR Code” jest zastrzeżonym
znakiem towarowym DENSO WAVE INCORPORATED.

## Stos technologiczny

React 18 + TypeScript, Vite (vite-plugin-singlefile), Tailwind CSS, pdf.js (`pdfjs-dist`), pdf-lib, fflate
(ZIP), qrcode-generator (macierz kodu QR), jsQR (test odczytu), lucide-react, localStorage jako jedyna trwałość danych (tylko ustawienia), Vitest + Testing
Library, ESLint. Czcionki Source Sans 3 i Source Serif 4 z pakietów `@fontsource`.

## Licencja

MIT, zobacz [`LICENSE`](./LICENSE). Przed publikacją wpisz w nim swoje imię i nazwisko albo nazwę.
