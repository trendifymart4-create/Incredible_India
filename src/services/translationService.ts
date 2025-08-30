import en from '../translations/en.json';
import fr from '../translations/fr.json';
import de from '../translations/de.json';
import ja from '../translations/ja.json';
import zh from '../translations/zh.json';

const translations: Record<string, any> = {
  en,
  fr,
 de,
  ja,
  zh
};

export const getTranslation = (language: string, key: string): string => {
  // Split the key by dots to navigate through nested objects
  const keys = key.split('.');
  
  // Get the translation object for the current language
  let translationObject = translations[language] || translations.en;
  
  // Navigate through the nested objects
  for (const k of keys) {
    if (translationObject && translationObject[k]) {
      translationObject = translationObject[k];
    } else {
      // If translation not found, return the key itself
      return key;
    }
  }
  
  return translationObject;
};

export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];
};

export default translations;