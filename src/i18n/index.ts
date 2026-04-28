import de from "./de";
import ar from "./ar";

export type Language = "de" | "ar";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type Translations = typeof de;
type PartialTranslations = DeepPartial<Translations>;

const translations: Record<Language, PartialTranslations> = {
  de,
  ar: ar as PartialTranslations,
};

let currentLanguage: Language = "de";

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string): string {
  const lang = currentLanguage;
  const dict = translations[lang] as Record<string, unknown>;
  const fallback = translations["de"] as Record<string, unknown>;

  const keys = key.split(".");
  let result: unknown = dict;
  let fallbackResult: unknown = fallback;

  for (const k of keys) {
    if (result && typeof result === "object") {
      result = (result as Record<string, unknown>)[k];
    } else {
      result = undefined;
    }
    if (fallbackResult && typeof fallbackResult === "object") {
      fallbackResult = (fallbackResult as Record<string, unknown>)[k];
    } else {
      fallbackResult = undefined;
    }
  }

  if (typeof result === "string") return result;
  if (typeof fallbackResult === "string") return fallbackResult;
  return key;
}

export default translations;
