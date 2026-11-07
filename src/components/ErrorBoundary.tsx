import { Component, ReactNode } from 'react';
import { clearAppStorage } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Łapie błędy renderowania, żeby zamiast białej strony pokazać jakikolwiek ratunek.
// Najczęstsza przyczyna: uszkodzone ustawienia w localStorage (ręczna edycja, stara wersja).
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private wyczysc = () => {
    if (
      window.confirm(
        'Usunę ustawienia narzędzi zapisane w tej przeglądarce. Twoje pliki nie są nigdzie przechowywane, więc nic poza ustawieniami nie zniknie. Kontynuować?'
      )
    ) {
      clearAppStorage();
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="max-w-xl mx-auto bg-white border border-alert-400 rounded-lg p-6 space-y-3"
      >
        <h1 className="font-serif text-xl text-brand-900">Coś poszło nie tak</h1>
        <p className="text-sm text-brand-700">
          Ta strona nie mogła się wyświetlić. Spróbuj odświeżyć. Jeśli błąd wraca, możliwe, że ustawienia
          zapisane w przeglądarce są uszkodzone i warto je wyczyścić.
        </p>
        <p className="text-xs text-brand-500 break-words">{this.state.error.message}</p>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-sm rounded bg-brand-800 text-white hover:bg-brand-900"
          >
            Odśwież
          </button>
          <button
            onClick={this.wyczysc}
            className="px-3 py-1.5 text-sm rounded border border-alert-400 text-alert-600 hover:bg-alert-50"
          >
            Wyczyść dane lokalne
          </button>
        </div>
      </div>
    );
  }
}
