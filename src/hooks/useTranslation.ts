import { useLanguage } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

export function useTranslation() {
  const { lang } = useLanguage();
  return translations[lang];
}
