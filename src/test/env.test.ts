import { describe, expect, it } from 'vitest';
import { isInAppBrowser } from '../utils/env';

const wbudowane = {
  'Messenger na Androidzie':
    'Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36 [FB_IAB/MESSENGER;FBAV/460.0.0.0;]',
  'Facebook na iOS':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E236 [FBAN/FBIOS;FBAV/460.0;]',
  'Instagram na iOS':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E236 Instagram 330.0.0.0',
  'dowolny WebView na Androidzie':
    'Mozilla/5.0 (Linux; Android 12; Pixel 6 Build/SD1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36',
  'dowolny WebView na iOS':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E236'
};

const zwykle = {
  'Chrome na Androidzie':
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Samsung Internet':
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36',
  'Safari na iOS':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Chrome na iOS':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1',
  'Chrome na komputerze':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Firefox na komputerze': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'
};

describe('isInAppBrowser', () => {
  for (const [nazwa, ua] of Object.entries(wbudowane)) {
    it(`rozpoznaje przeglądarkę wbudowaną: ${nazwa}`, () => {
      expect(isInAppBrowser(ua)).toBe(true);
    });
  }
  for (const [nazwa, ua] of Object.entries(zwykle)) {
    it(`nie myli ze zwykłą przeglądarką: ${nazwa}`, () => {
      expect(isInAppBrowser(ua)).toBe(false);
    });
  }
});
