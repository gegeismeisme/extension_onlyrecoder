import i18next from 'i18next';
import { resources, type LocaleKey } from './locales';
import type { LanguageOption } from '../types/config';

let initialized = false;

const FALLBACK: LocaleKey = 'en';

const resolveLanguage = (language: LanguageOption): LocaleKey => {
  if (language === 'auto') {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh-CN';
    }
    return 'en';
  }

  return language === 'zh-CN' ? 'zh-CN' : 'en';
};

export async function initI18n(language: LanguageOption = 'auto') {
  const lng = resolveLanguage(language);
  if (!initialized) {
    await i18next.init({
      resources,
      lng,
      fallbackLng: FALLBACK,
      interpolation: { escapeValue: false }
    });
    initialized = true;
    return;
  }

  await i18next.changeLanguage(lng);
}

export const t = (key: string) => i18next.t(key);
