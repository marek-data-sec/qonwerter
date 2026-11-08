// Przeglądarki wbudowane w aplikacje (Messenger, Facebook, Instagram...) to WebView-y. Aplikacja, która je
// osadza, zwykle nie obsługuje pobierania plików, więc przycisk "Pobierz" się klika, ale nic się nie dzieje.
const IN_APP =
  /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Snapchat|TikTok|musical_ly|MicroMessenger|Line\/|LinkedInApp|Pinterest/i;
const ANDROID_WEBVIEW = /; wv\)/;
// zwykły Safari i Chrome na iOS mają w identyfikatorze "Safari/", WebView-y nie
const IOS_WEBVIEW = /(iPhone|iPad|iPod)(?!.*Safari)/;

export function isInAppBrowser(
  ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent
): boolean {
  return IN_APP.test(ua) || ANDROID_WEBVIEW.test(ua) || IOS_WEBVIEW.test(ua);
}
