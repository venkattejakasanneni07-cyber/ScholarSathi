import en from '../data/i18n.en.json';
import hi from '../data/i18n.hi.json';
import te from '../data/i18n.te.json';

export type LanguageCode = 'en' | 'hi' | 'te';

const translations = { en, hi, te };

export function t(
  lang: LanguageCode,
  keyPath: string,
  variables?: Record<string, string | number>
): string {
  const currentDict = translations[lang] || translations.en;
  const keys = keyPath.split('.');
  let current: any = currentDict;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English
      let fallback: any = translations.en;
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return keyPath;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return keyPath;
  }

  let result = current;
  if (variables) {
    for (const [varKey, varVal] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(varVal));
    }
  }

  return result;
}
